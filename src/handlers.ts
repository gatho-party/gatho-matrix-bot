
import { OurStore, store } from './store';
import {
  LogService, MatrixClient,
} from "matrix-bot-sdk";
import { sendRSVP, setRSVPMessageId, fetchRSVPMessageId } from './gatho-api';
import { getDisplayname } from './matrix-api';
import { MatrixReactionEvent, RSVPReaction } from './interfaces';
import { emojiMap, Status } from './common-interfaces';
import { calculateStatusToSend } from './update-rsvp-count';
import { sendRSVPAndUpdateState } from './model'
import { matrixBotUsername } from './config';

/**
 * Handle Matrix reaction events. If this doesn't fire, it might be because you haven't
 * `yarn link`ed the patched `matrix-bot-sdk` - see README.md :)
 * @param roomId The Matrix room id of the event
 * @param event The Matrix event
 */
export const handleReaction = (store: OurStore, client: MatrixClient) => async (roomId: string, event: MatrixReactionEvent): Promise<undefined> => {
  const relatesTo = event.content['m.relates_to'];
  if (relatesTo === undefined) {
    LogService.error("index", `m.relates_to event field doesn't exist in reaction event, ignoring.`);
    return;
  }
  const { event_id: relatesToEventId, key: emoji } = relatesTo;

  if (emojiMap[emoji] === undefined) {
    return;
  }

  // If we don't know what message is the special RSVP message, check the server
  if (store.getState().rsvpMessages[roomId] === undefined) {
    LogService.debug("index", `We don't yet have the RSVP message ID for room ${roomId}, fetching...`);
    const eventInfo = await fetchRSVPMessageId(roomId);
    if (eventInfo === null) {
      LogService.error("index", `Bad response from server.`);
      return;
    }
    if (eventInfo.event_exists_for_room && eventInfo.matrix_room_address !== null) {
      // We already have an RSVP message, let's save it to the store
      store.dispatch({ type: 'set-rsvp-message-id', roomId, rsvpMessageId: eventInfo.matrix_room_address });
    } else if (eventInfo.event_exists_for_room) {
      // Set RSVP message to the message this reaction is on and save to store
      await setRSVPMessageId({ roomId, rsvpMessageEventId: relatesToEventId });
      store.dispatch({ type: 'set-rsvp-message-id', roomId, rsvpMessageId: relatesToEventId });
    }
  }

  if (store.getState().rsvpMessages[roomId] !== relatesToEventId) {
    // Reaction is not on our RSVP message id, ignoring.
    console.log("Reaction not in RSVP message ID, ignoring");
    return;
  }


  const { sender: matrix_username } = event
  const displayname = await getDisplayname(client, matrix_username);
  const status: Status = emojiMap[emoji];

  await sendRSVPAndUpdateState({ store, event, displayname, status, roomId });
}

/**
 * TODO: Write tests for this
 * @param store 
 * @param client 
 * @returns 
 */
export const handleRedaction = (store: OurStore, client: MatrixClient) =>
  async (roomId: string, event: any): Promise<undefined> => {
    const eventIdThatIsBeingRedacted: string = event.redacts;
    if (eventIdThatIsBeingRedacted === undefined) {
      LogService.error("index", `Didn't find eventId being redacted`);
      return
    }

    const rsvpsInOurRoom = store.getState().rsvpReactions[roomId] as RSVPReaction[] | undefined;
    if (rsvpsInOurRoom === undefined) {
      // Room isn't yet defined, so there are no RSVPs present.
      return;
    }

    const newStatus: Status | null = calculateStatusToSend(rsvpsInOurRoom, eventIdThatIsBeingRedacted);
    if (newStatus !== null) {
      const redactedRSVP: RSVPReaction | undefined = rsvpsInOurRoom
        .find(rsvp => rsvp.matrixEventId === eventIdThatIsBeingRedacted);
      if (redactedRSVP === undefined) {
        return;
      }
      const sender_matrix_username = redactedRSVP.sender
      const displayname: string | undefined = (await client.getUserProfile(event.sender)).displayname;
      sendRSVP({ roomId, matrix_username: sender_matrix_username, status: newStatus, displayname });
    }

    if (rsvpsInOurRoom === undefined) {
      return;
    }

    store.dispatch({ type: 'remove-rsvp', roomId, redactionEvent: eventIdThatIsBeingRedacted });
  }


export async function handleJoinEvent(store: OurStore, client: MatrixClient, roomId: string, event: any): Promise<void> {
  if (event.sender === matrixBotUsername) {
    return;
  }

  // If we don't have an RSVP message, check if the room is in gatho.
  // To improve: We could have data in the store of linked rooms (which may or may not have an
  // RSVP message for them), but this would require syncing on load (or storing store between
  // sessions).
  if (store.getState().rsvpMessages[roomId] === undefined) {
    const eventInfo = await fetchRSVPMessageId(roomId);
    if (eventInfo === null) {
      LogService.error("index", `Bad response from server calling fetchRSVPMessageId in room.event handler`);
      return;
    }

    if (eventInfo.event_exists_for_room === false || eventInfo.matrix_room_address == null) {
      // Room isn't linked if no event exists for room or matrix room address is null
      return;
    }
  }
  // If there are RSVP messages for the room it's definitely been linked
  const status: Status = 'invited'
  const displayname = await getDisplayname(client, event.sender);
  await sendRSVPAndUpdateState({ store, event, displayname, status, roomId });
}
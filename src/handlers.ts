
import { OurStore, store } from './store';
import {
  LogService, MatrixClient,
} from "matrix-bot-sdk";
import { sendRSVP, setRSVPMessageId, fetchRSVPMessageId } from './gatho-api';
import { getDisplayname } from './matrix-api';
import { MatrixInviteEvent, MatrixReactionEvent, MatrixUsername, RSVPReaction } from './interfaces';
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
    LogService.error("handlers", `m.relates_to event field doesn't exist in reaction event, ignoring.`);
    return;
  }
  const { event_id: relatesToEventId, key: emoji } = relatesTo;

  if (emojiMap[emoji] === undefined) {
    console.log(`Emoji ${emoji} isn't in emojiMap.`);
    return;
  }

  // If we don't know what message is the special RSVP message, check the server
  if (store.getState().rsvpMessages[roomId] === undefined) {
    LogService.debug("index", `We don't yet have the RSVP message ID for room ${roomId}, fetching...`);
    const eventInfo = await fetchRSVPMessageId(roomId);
    if (eventInfo === null) {
      LogService.error("handlers", `Bad response from server.`);
      return;
    }
    if (eventInfo.event_exists_for_room && eventInfo.rsvp_message_id !== null) {
      // We already have an RSVP message, let's save it to the store
      store.dispatch({ type: 'set-rsvp-message-id', roomId, rsvpMessageId: eventInfo.rsvp_message_id });
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


  const { sender: matrixUserSubmittingRSVP, event_id } = event
  const displayname = await getDisplayname(client, matrixUserSubmittingRSVP);
  const status: Status = emojiMap[emoji];

  await sendRSVPAndUpdateState({ store, matrixUserSubmittingRSVP, matrixEventId: event_id, displayname, status, roomId });
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
      LogService.error("handlers", `Didn't find eventId being redacted`);
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


export async function handleInviteEvent(store: OurStore, client: MatrixClient, roomId: string, event: MatrixInviteEvent): Promise<void> {
  const invitedUser: MatrixUsername = event.state_key;
  if (invitedUser === matrixBotUsername) {
    LogService.info("handlers", `Join event was the bot ${matrixBotUsername}, ignoring`);
    return;
  }

  // If we don't have an RSVP message, check if the room is in gatho.
  // To improve: We could have data in the store of linked rooms (which may or may not have an
  // RSVP message for them), but this would require syncing on load (or storing store between
  // sessions).
  if (store.getState().rsvpMessages[roomId] === undefined) {
    const eventInfo = await fetchRSVPMessageId(roomId);
    if (eventInfo === null) {
      LogService.error("handlers", `Bad response from server calling fetchRSVPMessageId in room.event handler`);
      return;
    }

    if (eventInfo.event_exists_for_room === false) {
      // Room isn't linked if no event exists
      // If matrix room ID not linked yet that's fine - that will come later
      LogService.info("handlers", `Room isn't linked, ignoring join event`);
      return;
    }
  }
  // If there are RSVP messages for the room it's definitely been linked
  const status: Status = 'invited'
  const displayname = await getDisplayname(client, invitedUser);
  await sendRSVPAndUpdateState({
    store, matrixUserSubmittingRSVP: invitedUser,
    matrixEventId: event.event_id
    , displayname, status, roomId
  });

}
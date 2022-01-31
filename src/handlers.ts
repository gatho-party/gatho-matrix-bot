
import { OurStore, store } from './store';
import {
  LogService, MatrixClient,
} from "matrix-bot-sdk";
import { sendRSVP, setRSVPMessageId, fetchRSVPMessageId } from './gatho-api';
import { getDisplayname } from './matrix-api';
import { MatrixReactionEvent, RSVPReaction } from './interfaces';
import { emojiMap, Status } from './common-interfaces';

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
  const {event_id: relatesToEventId, key: emoji} = relatesTo;

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
    if(eventInfo.event_exists_for_room && eventInfo.matrix_room_address !== null) {
      // We already have an RSVP message, let's save it to the store
      store.dispatch({ type: 'set-rsvp-message-id', roomId, rsvpMessageId: eventInfo.matrix_room_address });
    } else if(eventInfo.event_exists_for_room) {
      // Set RSVP message to the message this reaction is on and save to store
      await setRSVPMessageId({ roomId, rsvpMessageEventId: relatesToEventId });
      store.dispatch({ type: 'set-rsvp-message-id', roomId, rsvpMessageId: relatesToEventId });
    }
  }

  if (store.getState().rsvpMessages[roomId] !== relatesToEventId) {
    // Reaction is not on our RSVP message id, ignoring.
    return;
  }

  /** The username of the person who reacted */
  const {sender: matrix_username, event_id: matrixEventId} = event

  const displayname = await getDisplayname(client, matrix_username);
  const newReaction: RSVPReaction = {
    reaction: emoji,
    matrixEventId: matrixEventId,
    sender: matrix_username,
    displayname
  }
  store.dispatch({ type: 'add-rsvp', roomId, reaction: newReaction });

  const status: Status = emojiMap[newReaction.reaction];

  sendRSVP({ roomId, matrix_username, status, displayname });
}
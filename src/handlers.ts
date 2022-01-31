
import { OurStore, store } from './store';
import {
  LogService, MatrixClient,
} from "matrix-bot-sdk";
import { sendRSVP, setRsvpMessageId } from './gatho-api';
import { getDisplayname } from './matrix-api';
import { MatrixReactionEvent, RSVPReaction } from './interfaces';
import { emojiMap, Status } from './common-interfaces';

export type HandleReactionOutcomes = 'no-rsvp-message-on-server' | 'relates-to-missing'
  | 'not-on-our-rsvp-message' | 'emoji-irrelevant' | 'sent-rsvp';
/**
 * Handle Matrix reaction events. If this doesn't fire, it might be because you haven't
 * `yarn link`ed the patched `matrix-bot-sdk` - see README.md :)
 * @param roomId The Matrix room id of the event
 * @param event The Matrix event
 */
export const handleReaction = (store: OurStore, client: MatrixClient) => async (roomId: string, event: MatrixReactionEvent): Promise<HandleReactionOutcomes> => {
  // If we don't know what message is the special RSVP message, check the server
  if (store.getState().rsvpMessages[roomId] === undefined) {
    LogService.debug("index", `We don't yet have the RSVP message ID for room ${roomId}, fetching...`);
    if (await setRsvpMessageId(roomId) === false) {
      LogService.debug("index", `No RSVP message on server for room ${roomId}, ignoring.`);
      return 'no-rsvp-message-on-server';
    } else {
      LogService.debug("index", `Got RSVP message id.`);
    }
  }

  const relatesTo = event.content['m.relates_to'];
  if (relatesTo === undefined) {
    LogService.error("index", `m.relates_to event field doesn't exist in reaction event, ignoring.`);
    return 'relates-to-missing';
  }
  const relatesToEventId = relatesTo.event_id;

  if (store.getState().rsvpMessages[roomId] !== relatesToEventId) {
    // Emoji is not on our RSVP message id, ignoring.
    return 'not-on-our-rsvp-message';
  }

  /** The emoji reaction */
  const emoji = relatesTo.key;
  /** The username of the person who reacted */
  const matrix_username = event.sender;
  const matrixEventId = event.event_id;

  const displayname = await getDisplayname(client, matrix_username);
  const newReaction: RSVPReaction = {
    reaction: emoji,
    matrixEventId: matrixEventId,
    sender: matrix_username,
    displayname
  }
  store.dispatch({ type: 'add-rsvp', roomId, reaction: newReaction });

  if (emojiMap[newReaction.reaction] === undefined) {
    console.log(`Reaction ${newReaction.reaction} not in our reaction map`);
    console.log(`keys in reaction map are ${Object.keys(emojiMap)}`);
    return 'emoji-irrelevant'
  }
  const status: Status = emojiMap[newReaction.reaction];

  sendRSVP({ roomId, matrix_username, status, displayname });
  return 'sent-rsvp';
}
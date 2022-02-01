import { emojiMap, Status } from './common-interfaces';
import { sendRSVP } from './gatho-api';
import { RSVPReaction } from './interfaces';
import { OurStore, store } from './store';
import {
  LogService
} from "matrix-bot-sdk";

export async function sendRSVPAndUpdateState({ store,
  event, displayname, status, roomId }: {
    store: OurStore,
    event: any, displayname?: string, status: Status, roomId: string
  }): Promise<void> {

  /** The username of the person who reacted */
  const { sender: matrix_username, event_id: matrixEventId } = event

  const newReaction: RSVPReaction = {
    status,
    matrixEventId: matrixEventId,
    sender: matrix_username,
    displayname
  }
  store.dispatch({ type: 'add-rsvp', roomId, reaction: newReaction });
  LogService.info("model", `Sending RSVP ${status} for ${matrix_username} to ${roomId}`);
  sendRSVP({ roomId, matrix_username, status, displayname });
}

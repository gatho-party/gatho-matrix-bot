import { emojiMap, Status } from './common-interfaces';
import { sendRSVP } from './gatho-api';
import { MatrixUsername, RSVPReaction } from './interfaces';
import { OurStore, store } from './store';
import {
  LogService
} from "matrix-bot-sdk";

export async function sendRSVPAndUpdateState({ store,
  matrixUserSubmittingRSVP, matrixEventId, displayname, status, roomId }: {
    store: OurStore,
    matrixUserSubmittingRSVP: MatrixUsername,
    matrixEventId: string, displayname?: string, status: Status, roomId: string
  }): Promise<void> {

  /** The username of the person who reacted */

  const newReaction: RSVPReaction = {
    status,
    matrixEventId: matrixEventId,
    sender: matrixUserSubmittingRSVP,
    displayname
  }
  store.dispatch({ type: 'add-rsvp', roomId, reaction: newReaction });
  LogService.info("model", `Sending RSVP ${status} for ${matrixUserSubmittingRSVP} to ${roomId}`);
  sendRSVP({ roomId, matrix_username: matrixUserSubmittingRSVP, status, displayname });
}

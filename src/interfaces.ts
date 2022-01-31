
export interface RSVPReaction {
  reaction: string;
  sender: string;
  matrixEventId: string;
  displayname?: string;
}
export type RSVPCount = { [key: string]: RSVPReaction[]; };
/** Key is a room address, value is a message id */
export type RSVPMessageIdsForRoom = { [key: string]: string; };

export type MatrixReactionEvent = {
  content: {
    'm.relates_to'?: {
      event_id: string
      /** The emoji itself */
      key: string
    }
  }
  sender: string,
  event_id: string
}
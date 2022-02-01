
export interface RSVPReaction {
  reaction: string;
  sender: string;
  matrixEventId: string;
  displayname?: string;
}
export type RSVPCount = { [key: string]: RSVPReaction[]; };
/** Key is a room address, value is a message id */
export type RSVPMessageIdsForRoom = { [key: string]: string; };

type CommonMatrixEventFields = {
  origin_server_ts: number,
  sender: string,
  event_id: string
}

export type MatrixEvent = CommonMatrixEventFields & {
  content: Object;
}
export type MessageEvent = CommonMatrixEventFields & {
  content: {
    body: string,
    msgtype: "m.text" | string
    "org.matrix.msc1767.text"?: string
  },
  "type": "m.room.message",
  unsigned: Object;
}

export type MatrixReactionEvent = CommonMatrixEventFields & {
  content: {
    'm.relates_to'?: {
      event_id: string
      /** The emoji itself */
      key: string
    }
  }
}
export type MatrixJoinEvent = CommonMatrixEventFields & {
  type: "m.room.member",
  content: {
      membership: "join",
      displayname?: string,
      avatar_url: string | null
  }
  state_key?:string
  unsigned?: Object;
}
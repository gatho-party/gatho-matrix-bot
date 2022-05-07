export const emojiMap: { [key: string]: Status; } = {
  "👍️": 'going',
  "👍": 'going',
  "👎️": 'notgoing',
  "👎": 'notgoing',
  "🤔": 'maybe'
}

export type Status = 'going' | 'maybe' | 'notgoing' | 'invited';

/////////

export interface ViaMatrixPayload {
  /** Key sent from the Matrix bot to prove it's us! */
  secret_matrix_bot_key: string,
}

export interface RSVPViaMatrixPayload extends ViaMatrixPayload {
  status: Status,
  matrix_username?: string;
  matrix_room_address: string;
  displayname?: string;
}

export interface FetchRSVPMessageIdReq extends ViaMatrixPayload {
  matrix_room_address: string
}
export interface FetchRSVPMessageIdRes {
  status: `success`,
  rsvp_message_id: string | null,
  event_exists_for_room: boolean 
}

export interface SetRSVPMessageReq extends ViaMatrixPayload {
    room_id: string,
    rsvp_message_id: string,
}
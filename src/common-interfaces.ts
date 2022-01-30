export const rsvpGoing = "👍️"
export const rsvpNotGoing = "👎️"
export const rsvpMaybe = "🤔"

export type rsvpEmoji = "👍️" | "👎️" | "🤔";

export const emojiMap: { [key: string]: Status; } = {
  "👍️": 'going',
  "👎️": 'notgoing',
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

export interface FetchRSVPMessageIdPayload extends ViaMatrixPayload {
  matrix_room_address: string
}
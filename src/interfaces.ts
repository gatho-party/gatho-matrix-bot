
export interface RSVPReaction {
  reaction: string;
  sender: string;
  eventId: string;
  displayname?:string;
}
export type RSVPCount = {[key:string]: RSVPReaction[]; };
/** Key is a room address, value is a message id */
export type RSVPMessageIdsForRoom = {[key:string]: string; };
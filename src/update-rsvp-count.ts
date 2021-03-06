import { RSVPCount, RSVPReaction } from './interfaces';
import { Status } from './gatho-api';
/**
 * Add new RSVP
 * @param rsvpCount The current reactions/RSVPs.
 * @param roomId The room (party) we are updating the RSVPs for
 * @param reaction The object containing info about the reaction Matrix event
 * @returns New RSVP count
 */
export function addRSVP(rsvpCount: RSVPCount, roomId: string, reaction: RSVPReaction): RSVPCount {
  const newRSVPCount: RSVPCount = Object.assign({}, rsvpCount);
  if (roomId in rsvpCount === false) {
    newRSVPCount[roomId] = [];
  }
  newRSVPCount[roomId].push(reaction);
  console.log("Success adding! RSVP list is now: ");
  console.log(JSON.stringify(newRSVPCount, null, 2));

  return newRSVPCount;
}

export function calculateStatusToSend(
  rsvpsInRoom: RSVPReaction[],
  redactionEventId: string,
): Status | null {
  const redactedRSVP: RSVPReaction | undefined = rsvpsInRoom
    .find(rsvp => rsvp.matrixEventId === redactionEventId);

  if (redactedRSVP === undefined) {
    return null;
  }

  const senderOfRedactedRSVP = redactedRSVP.sender;

  /*
  If we're redacting something, and we don't have any other entries - then make us 'invited'.
  If we're redacting something, and we we already have *ONE* other *valid* entry - send the
    other valid entry.
  Otherwise - don't send anything.
  */
  const ourOtherReleventReactions = rsvpsInRoom
    .filter(rsvp => rsvp.sender === senderOfRedactedRSVP)
    .filter(rsvp => rsvp.matrixEventId !== redactionEventId)

  if (ourOtherReleventReactions.length === 1) {
    const newRsvp = ourOtherReleventReactions[0]
    const status: Status = newRsvp.status;
    return status;
  }
  if (ourOtherReleventReactions.length > 1) {
    return null;
  }
  return 'invited';
}


export function removeRSVP(rsvpCount: RSVPCount, roomId: string, redactionEvent: string): RSVPCount {
  if (roomId in rsvpCount === false) {
    console.error(`Didn't find roomId ${roomId} in RSVPs`);
    console.log(JSON.stringify(rsvpCount, null, 2));
    return rsvpCount;
  }
  const newGlobalRSVPCountForRoom: RSVPReaction[] = rsvpCount[roomId]
    .filter(rsvp => rsvp.matrixEventId !== redactionEvent);

  if (newGlobalRSVPCountForRoom.length === rsvpCount[roomId].length) {
    console.error(`Didn't find event ${redactionEvent} in RSVPs`);
    console.log(JSON.stringify(rsvpCount, null, 2));
    return rsvpCount;
  }

  const newRSVPCount: RSVPCount = Object.assign({}, rsvpCount);
  newRSVPCount[roomId] = newGlobalRSVPCountForRoom;
  console.log("Success redacting! RSVP list is now: ");
  console.log(JSON.stringify(newRSVPCount, null, 2));

  return newRSVPCount;
}

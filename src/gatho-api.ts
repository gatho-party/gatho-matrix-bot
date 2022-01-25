import { RSVPViaMatrixPayload, FetchRSVPMessageIdPayload } from "./common-interfaces";
export type Status = 'going' | 'maybe' | 'notgoing' | 'invited';
import { secret_matrix_bot_key } from './secrets';
import fetch, { Response } from 'node-fetch';
import { LogService } from "matrix-bot-sdk";

// export const gathoApiUrl = "http://localhost:3000";
export const gathoApiUrl = "https://gatho.party";

/**
 * 
 * @param urlPath Must include leading slash
 * @param payload Object to be JSON stringified and sent as body
*/
async function sendPostRequest(urlPath: string, payload: any): Promise<Response> {
  let body: string;
  try {
    body = JSON.stringify(payload);
  } catch (e) {
    throw Error(`Unable to stringify payload object: ${payload}`);
  }

  const result = await fetch(`${gathoApiUrl}${urlPath}`, {
    body,
    method: "POST",
  });
  return result;
}

export async function sendRSVP(
  { status, matrix_username, roomId, displayname }:
    { status: Status, matrix_username?: string, roomId: string, displayname?: string }

): Promise<Response | null> {
  const payload: RSVPViaMatrixPayload = {
    secret_matrix_bot_key,
    status,
    matrix_username,
    displayname,
    matrix_room_address: roomId
  }
  let result;
  try {
    LogService.debug("index", `Sending RSVP out...`);
    result = await sendPostRequest('/api/rsvp-via-matrix', payload);
    
    LogService.debug("index", `...result sending RSVP is ${JSON.stringify(result)}`);
  } catch (e) {
    LogService.error("index", `Error sending RSVP: ${e}`);
    console.log(`Error sending RSVP: ${e}`);
    return null;
  }

  return result;
}

export async function fetchRsvpMessageId(roomId: string): Promise<string | null> {
  const payload: FetchRSVPMessageIdPayload = {
    secret_matrix_bot_key,
    matrix_room_address: roomId
  }
  const result = await sendPostRequest('/api/rsvp-message-id-for-room', payload);
  const json = await result.json();
  if (json.status === undefined) {
    throw Error("No success in status of rsvp-message-id-for-room response.");
  }
  return json.matrix_room_address;
}

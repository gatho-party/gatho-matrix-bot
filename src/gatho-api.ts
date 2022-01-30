import { RSVPViaMatrixPayload, FetchRSVPMessageIdPayload } from "./common-interfaces";
export type Status = 'going' | 'maybe' | 'notgoing' | 'invited';
import { secret_matrix_bot_key } from './secrets';
import fetch, { Response } from 'node-fetch';
import { LogService } from "matrix-bot-sdk";
import { gathoApiUrl } from './config';

/**
 * Send a POST request with a JSON payload
 * @param urlPath Must include leading slash
 * @param payload Object to be JSON stringified and sent as body
*/
async function sendPostRequest(urlPath: string, payload: Object): Promise<Response> {
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

/**
 * Send RSVP to the Gatho server with the status of a given user
 * @param Object containing the typed fields.
 * @returns 
 */
export async function sendRSVP(
  { status, matrix_username, roomId, displayname }:
    { status: Status, matrix_username: string, roomId: string, displayname?: string }
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
    LogService.debug("gatho-api", `Sending RSVP out...`);
    result = await sendPostRequest('/api/rsvp-via-matrix', payload);
    LogService.debug("gatho-api", `...result sending RSVP is ${JSON.stringify(result)}`);
  } catch (e) {
    LogService.error("gatho-api", `Error sending RSVP: ${e}`);
    return null;
  }
  return result;
}

/**
 * Fetch the message ID of the message designated as the RSVP message.
 * @param roomId The Matrix Room ID of the room to look up.
 * @returns 
 */
export async function fetchRsvpMessageId(roomId: string): Promise<string | null> {
  const payload: FetchRSVPMessageIdPayload = {
    secret_matrix_bot_key,
    matrix_room_address: roomId
  }

  let json;
  try {
    const result = await sendPostRequest('/api/rsvp-message-id-for-room', payload);
    json = await result.json();
  } catch (e) {
    LogService.error("gatho-api", `Failed to fetch message id for room ${roomId}`);
  }
  if (json.status === undefined) {
    LogService.error("gatho-api", `No success field in response of /api/rsvp-message-id-for-room`);
    return null;
  }
  return json.matrix_room_address;
}

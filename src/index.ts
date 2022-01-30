import {
  MatrixAuth, MatrixClient, SimpleFsStorageProvider, AutojoinRoomsMixin,
  LogService, LogLevel,
  RichConsoleLogger,
} from "matrix-bot-sdk";
import { homeserverUrl, password, username, gathoApiUrl } from './config'
import { RSVPCount, RSVPMessageIdsForRoom, RSVPReaction } from './interfaces';
import { calculateStatusToSend, removeRSVP, updateGlobalRSVPCount } from './update-rsvp-count'
import { emojiMap, Status } from "./common-interfaces";
import { fetchRsvpMessageId, sendRSVP } from "./gatho-api";
import { generateLinkEventUrl } from './utils';

LogService.setLogger(new RichConsoleLogger());
// LogService.setLevel(LogLevel.INFO);
LogService.setLevel(LogLevel.TRACE);
// LogService.muteModule("Metrics");
LogService.trace = LogService.debug;

// Globals
let globalRSVPCount: RSVPCount = {};
let rsvpMessageEventId: RSVPMessageIdsForRoom = {};

const storage = new SimpleFsStorageProvider("./data/bot.json");

async function getDisplayname(matrix_username: string): Promise<string | undefined> {
  let displayname: string | undefined;
  try {
    displayname = (await client.getUserProfile(matrix_username)).displayname;
  } catch (e) {
    LogService.error("index", `Failed to retrieve displayname for user ${matrix_username}: ${e}`);
  }
  return displayname;
}
async function handleRedaction(roomId: string, event: any) {
  // If we don't know what message is the special RSVP message, check the server
  if (rsvpMessageEventId[roomId] === undefined) {
    if (await setRsvpMessageId(roomId) === false) {
      return;
    }
  }

  const eventIdThatIsBeingRedacted: string = event.redacts;
  if (eventIdThatIsBeingRedacted === undefined) {
    LogService.error("index", `Didn't find eventId being redacted`);
    return
  }

  const rsvpsInOurRoom = globalRSVPCount[roomId] as RSVPReaction[] | undefined;
  if (rsvpsInOurRoom === undefined) {
    // Room isn't yet defined, so there are no RSVPs present.
    return;
  }

  const newStatus: Status | null = calculateStatusToSend(rsvpsInOurRoom, eventIdThatIsBeingRedacted, emojiMap);
  if (newStatus !== null) {
    const redactedRSVP: RSVPReaction | undefined = rsvpsInOurRoom
      .find(rsvp => rsvp.matrixEventId === eventIdThatIsBeingRedacted);
    if (redactedRSVP === undefined) {
      return;
    }
    const sender_matrix_username = redactedRSVP.sender
    const displayname: string | undefined = (await client.getUserProfile(event.sender)).displayname;
    sendRSVP({ roomId, matrix_username: sender_matrix_username, status: newStatus, displayname });
  }

  if (rsvpsInOurRoom === undefined) {
    return;
  }

  globalRSVPCount = removeRSVP(globalRSVPCount, roomId, eventIdThatIsBeingRedacted);
}

/**
 * Get the Matrix message ID of the RSVP message, and store it under the roomId key in the
 * `rsvpMessageEventId` object.
 * @param roomId Matrix room ID to find the RSVP message ID in
 * @returns 
 */
async function setRsvpMessageId(roomId: string): Promise<boolean> {
  LogService.info("index", "RSVP message event ID is not defined yet, looking up...");
  const maybeRsvpMessageId = await fetchRsvpMessageId(roomId);
  LogService.info("index", "Got response from API.");
  if (maybeRsvpMessageId === null) {
    LogService.error("index", `Unable to find message id from db for room ${roomId}. Event likely doesn't yet exist`);
    return false;
  } else if (maybeRsvpMessageId === '') {
    LogService.error("index", `No rsvp message id is yet stored (it's empty) in db for room ${roomId}`);
    return false;
  } else {
    rsvpMessageEventId[roomId] = maybeRsvpMessageId;
    return true
  }
}

/**
 * */


/**
 * Handle Matrix reaction events. If this doesn't fire, it might be because you haven't
 * `yarn link`ed the patched `matrix-bot-sdk` - see README.md :)
 * @param roomId The Matrix room id of the event
 * @param event The Matrix event
 */
async function handleReaction(roomId: string, event: any): Promise<undefined> {
  // If we don't know what message is the special RSVP message, check the server
  if (rsvpMessageEventId[roomId] === undefined) {
    LogService.debug("index", `We don't yet have the RSVP message ID for room ${roomId}, fetching...`);
    if (await setRsvpMessageId(roomId) === false) {
      LogService.debug("index", `No RSVP message on server for room ${roomId}, ignoring.`);
      return;
    } else {
      LogService.debug("index", `Got RSVP message id.`);
    }
  }

  const relatesTo: { event_id: string } | undefined = event.content['m.relates_to'];
  if (relatesTo === undefined) {
    LogService.error("index", `m.relates_to event field doesn't exist in reaction event, ignoring.`);
    return;
  }
  const relatesToEventId = relatesTo.event_id;
  if (rsvpMessageEventId[roomId] !== relatesToEventId) {
    // Emoji is not on our RSVP message id, ignoring.
    return;
  }

  /** The emoji reaction */
  const emoji = event.content['m.relates_to'].key;
  /** The username of the person who reacted */
  const matrix_username = event.sender;
  const matrixEventId = event.event_id;

  const displayname = await getDisplayname(matrix_username);
  const newReaction: RSVPReaction = {
    reaction: emoji,
    matrixEventId: matrixEventId,
    sender: matrix_username,
    displayname
  }
  globalRSVPCount = updateGlobalRSVPCount(globalRSVPCount, roomId, newReaction)
  if (emojiMap[newReaction.reaction] === undefined) {
    console.log(`Reaction ${newReaction.reaction} not in our reaction map`);
    console.log(`keys in reaction map are ${Object.keys(emojiMap)}`);
    return;
  }
  const status: Status = emojiMap[newReaction.reaction];

  sendRSVP({ roomId, matrix_username, status, displayname });
}

let client: MatrixClient

async function main() {
  const authedClient = await (new MatrixAuth(homeserverUrl)).passwordLogin(username, password);
  client = new MatrixClient(authedClient.homeserverUrl, authedClient.accessToken, storage);

  // Automatically join rooms the bot is invited to
  AutojoinRoomsMixin.setupOnClient(client);

  client.on("reaction", handleReaction);
  client.on("room.redaction", handleRedaction);

  client.on("room.failed_decryption", (roomId, event, error) => {
    // handle `m.room.encrypted` event that could not be decrypted
    LogService.error("index", `Failed decryption event!\n${{ roomId, event, error }}`);
  });

  client.on("room.join", (roomId: string, event: any) => {
    console.log({ event });
    LogService.info("index", `Bot joined room ${roomId}`);
    client.sendMessage(roomId, {
      "msgtype": "m.notice",
      "body": `Hello, this is the Gatho.party bot! Link this chat to a Gatho event via ${generateLinkEventUrl(roomId, gathoApiUrl)}. For questions or feedback join #gatho-events:matrix.org.`,
    });
  });

  LogService.info("index", "Starting bot...");
  await client.start()
  LogService.info("index", "Bot started!");
}


main();
import {
  MatrixAuth, MatrixClient, SimpleFsStorageProvider, AutojoinRoomsMixin,
  LogService, LogLevel,
  RichConsoleLogger,
} from "matrix-bot-sdk";
import { homeserverUrl, matrixBotPassword, matrixBotUsername, gathoApiUrl } from './config'
import { generateLinkEventUrl, isInviteEvent, isJoinEvent, parseMatrixUsernamePretty } from './utils';
import { store } from './store';
import { handleInviteEvent, handleReaction, handleRedaction } from './handlers'

LogService.setLogger(new RichConsoleLogger());
// LogService.setLevel(LogLevel.INFO);
LogService.setLevel(LogLevel.TRACE);
// LogService.muteModule("Metrics");
LogService.trace = LogService.debug;

const storage = new SimpleFsStorageProvider("./data/bot.json");



let client: MatrixClient;

async function main() {
  const botUsernameWithoutDomain = parseMatrixUsernamePretty(matrixBotUsername);
  const authedClient = await (new MatrixAuth(homeserverUrl)).passwordLogin(botUsernameWithoutDomain, matrixBotPassword);
  client = new MatrixClient(authedClient.homeserverUrl, authedClient.accessToken, storage);

  // Automatically join rooms the bot is invited to
  AutojoinRoomsMixin.setupOnClient(client);

  client.on("reaction", handleReaction(store, client));
  client.on("room.redaction", handleRedaction(store, client));

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

  client.on("room.event", async (roomId: string, event: any) => {
    console.log("room.event:");
    console.log(JSON.stringify(event, null, 2));
    if (isInviteEvent(event)) {
      LogService.info("index", `Received room invite event`);
      await handleInviteEvent(store, client, roomId,event);
    }
  });

  LogService.info("index", "Starting bot...");
  await client.start()
  LogService.info("index", "Bot started!");
}


main();
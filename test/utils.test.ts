import { MatrixEvent, MatrixJoinEvent, MessageEvent } from "../src/interfaces";
import { generateLinkEventUrl, isJoinEvent } from "../src/utils";

describe("generateLinkEventUrl#()", () => {
  test("when no other rsvps are present, status is invited", async () => {
    const url: string = generateLinkEventUrl('!aqBUWoYrLqnWKlazzz:domain.com', "https://gatho.party");
    expect(url).toMatchInlineSnapshot(`"https://gatho.party/link-chat/!aqBUWoYrLqnWKlazzz%3Adomain.com"`);
  });
});

const joinEvent: MatrixJoinEvent = {
  "type": "m.room.member",
  "sender": "@bot:matrix.gatho.party",
  "content": {
    "membership": "join",
    "displayname": "dev-bot",
    "avatar_url": null
  },
  "state_key": "@bot:matrix.gatho.party",
  "origin_server_ts": 1643680492130,
  "unsigned": {
    "replaces_state": "$125135",
    "prev_content": {
      "displayname": "dev-bot",
      "membership": "invite"
    },
    "prev_sender": "@jake:blah.chat",
    "age": 471
  },
  "event_id": "$ja135013501351"
}
const messageEvent: MessageEvent = {
  "content": {
    "body": "test",
    "msgtype": "m.text",
    "org.matrix.msc1767.text": "test"
  },
  "origin_server_ts": 1643703765821,
  "sender": "@jake:blah.chat",
  "type": "m.room.message",
  "unsigned": {
    "age": 377
  },
  "event_id": "$1tMSg01351351"
}

describe("#isJoinEvent()", () => {
  test("correctly identifies join event", async () => {
    expect(isJoinEvent(joinEvent)).toBe(true);
  });
  test("doesn't mistake message event for join event", async () => {
    expect(isJoinEvent(messageEvent)).toBe(false);
  });
});

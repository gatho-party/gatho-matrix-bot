import { MatrixEvent, MatrixInviteEvent, MatrixJoinEvent, MessageEvent } from "../src/interfaces";
import { generateLinkEventUrl, isInviteEvent, isJoinEvent, parseMatrixUsernamePretty } from "../src/utils";

describe("generateLinkEventUrl#()", () => {
  test("when no other rsvps are present, status is invited", async () => {
    const url: string = generateLinkEventUrl('!aqBUWoYrLqnWKlazzz:domain.com', "https://gatho.party");
    expect(url).toMatchInlineSnapshot(`"https://gatho.party/link-chat/!aqBUWoYrLqnWKlazzz%3Adomain.com"`);
  });
});

const inviteEvent: MatrixInviteEvent = {
    "content": {
      "avatar_url": "mxc://domain/1351351",
      "displayname": "Jake C",
      "membership": "invite"
    },
    "origin_server_ts": 1643711476699,
    "sender": "@inviter:domain",
    "state_key": "@invitee:domain",
    "type": "m.room.member",
    "unsigned": {
    },
    "event_id": "$..."
}
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

describe("#isInviteEvent()", () => {
  test("correctly identifies invite event", async () => {
    expect(isInviteEvent(inviteEvent)).toBe(true);
  });
  test("doesn't mistake message event for invite event", async () => {
    expect(isInviteEvent(messageEvent)).toBe(false);
  });
  test("doesn't mistake join event for invite event", async () => {
    expect(isInviteEvent(joinEvent)).toBe(false);
  });
});



describe("#parseMatrixUsernamePretty()", () => {
  test("parses name correctly", async () => {
    const name = parseMatrixUsernamePretty("@Jake:somedomain.com");
    expect(name).toBe('Jake');
  });
  test("return original when without @", async () => {
    const name = parseMatrixUsernamePretty("Jake:somedomain.com");
    expect(name).toBe('Jake:somedomain.com');
  });
  test("return original when without :", async () => {
    const name = parseMatrixUsernamePretty("@Jakesomedomain.com");
    expect(name).toBe('@Jakesomedomain.com');
  });
});
import { handleJoinEvent, handleReaction } from '../src/handlers'
import { setRSVPMessageId, sendRSVP, fetchRSVPMessageId } from '../src/gatho-api'
import { mocked } from 'ts-jest/utils'
import { rootReducer } from '../src/store';
import { createStore } from 'redux'
import { MatrixClient } from 'matrix-bot-sdk';
import { MatrixJoinEvent, MatrixReactionEvent } from '../src/interfaces';
import { getDisplayname } from '../src/matrix-api'

import * as dotenv from 'dotenv';
import { Status } from '../src/common-interfaces';
import { matrixBotUsername } from '../src/config';
// Support .env file
dotenv.config();

export const secret_matrix_bot_key = process.env.GATHO_API_SECRET_KEY as string;
import { sendRSVPAndUpdateState } from '../src/model';
jest.mock('../src/matrix-api', () => ({
  getDisplayname: jest.fn()
}));
jest.mock('../src/gatho-api', () => ({
  sendRSVPAndUpdateState: jest.fn(),
  setRsvpMessageId: jest.fn(),
  sendRSVP: jest.fn(),
  fetchRSVPMessageId: jest.fn(),
  setRSVPMessageId: jest.fn()
}));



const mockedGetDisplayname = mocked(getDisplayname, true);
const mockedSetRSVPMessageId = mocked(setRSVPMessageId, true);
const mockedSendRSVP = mocked(sendRSVP, true);
const mockedFetchRSVPMessageId = mocked(fetchRSVPMessageId, true);

afterEach(() => {
  jest.clearAllMocks();
})
describe("secret matrix bot key", () => {
  test("GATHO_API_SECRET_KEY env var is defined", () => {
    expect(secret_matrix_bot_key).toBeDefined();
  })
});
describe("#handleJoinEvent()", () => {
  test("when join event is the matrix bot joining the room, ignore", async () => {
    const joinEvent: MatrixJoinEvent = {
      "type": "m.room.member",
      "sender": matrixBotUsername,
      "content": {
        "membership": "join",
        "displayname": "dev-bot",
        "avatar_url": null
      },
      "state_key": matrixBotUsername,
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
    const store = createStore(rootReducer)
    await handleJoinEvent(store,
      undefined as unknown as MatrixClient,
      'room-id',
      joinEvent
    )
    expect(mockedFetchRSVPMessageId).toBeCalledTimes(0);
    expect(sendRSVP).toBeCalledTimes(0);
    expect(store.getState()).toMatchInlineSnapshot(`
Object {
  "rsvpMessages": Object {},
  "rsvpReactions": Object {},
}
`);
  });
  test("when join event is valid and room doesn't exist, ignore", async () => {
    mockedFetchRSVPMessageId.mockResolvedValueOnce({
      status: 'success',
      matrix_room_address: null,
      event_exists_for_room: false
    });
    const joinEvent: MatrixJoinEvent = {
      "type": "m.room.member",
      "sender": '@someone:somewhere',
      "content": {
        "membership": "join",
        "displayname": "dev-bot",
        "avatar_url": null
      },
      "origin_server_ts": 1643680492130,
      "unsigned": {
      },
      "event_id": "$ja135013501351"
    }
    const store = createStore(rootReducer)
    await handleJoinEvent(store,
      undefined as unknown as MatrixClient,
      'room-id',
      joinEvent
    )
    expect(mockedFetchRSVPMessageId).toBeCalledTimes(1);
    expect(sendRSVP).toBeCalledTimes(0);
    expect(store.getState()).toMatchInlineSnapshot(`
Object {
  "rsvpMessages": Object {},
  "rsvpReactions": Object {},
}
`);
  });

  test("when join event is valid and room exists, send invited RSVP", async () => {
    mockedFetchRSVPMessageId.mockResolvedValueOnce({
      status: 'success',
      matrix_room_address: 'room-id',
      event_exists_for_room: true
    });
    const joinEvent: MatrixJoinEvent = {
      "type": "m.room.member",
      "sender": '@someone:somewhere',
      "content": {
        "membership": "join",
        "displayname": "dev-bot",
        "avatar_url": null
      },
      "origin_server_ts": 1643680492130,
      "unsigned": {
      },
      "event_id": "$ja135013501351"
    }
    const store = createStore(rootReducer)
    await handleJoinEvent(store,
      undefined as unknown as MatrixClient,
      'room-id',
      joinEvent
    )
    expect(mockedFetchRSVPMessageId).toBeCalledTimes(1);
    expect(sendRSVP).toBeCalledTimes(1);
    expect(store.getState().rsvpReactions).toMatchInlineSnapshot(`
Object {
  "room-id": Array [
    Object {
      "displayname": undefined,
      "matrixEventId": "$ja135013501351",
      "sender": "@someone:somewhere",
      "status": "invited",
    },
  ],
}
`);
  });

});
describe("#handleReaction()", () => {
  test("when event doesn't exist for valid reaction, ignore", async () => {
    mockedFetchRSVPMessageId.mockResolvedValueOnce({
      status: 'success',
      matrix_room_address: null,
      event_exists_for_room: false
    });
    const event: MatrixReactionEvent = {
      origin_server_ts: 1234,
      content: {
        'm.relates_to': {
          event_id: 'not-our-rsvp-message-id',
          key: "👍️"
        }
      },
      sender: 'sender',
      event_id: 'event_id'
    }
    const store = createStore(rootReducer)
    await (handleReaction(store, undefined as unknown as MatrixClient))('matrix-room-id', event);
    expect(store.getState().rsvpReactions).toStrictEqual({});
    expect(store.getState().rsvpMessages).toStrictEqual({});
    expect(mockedSendRSVP).toBeCalledTimes(0);
    expect(mockedFetchRSVPMessageId).toBeCalledWith('matrix-room-id');
    expect(mockedFetchRSVPMessageId).toBeCalledTimes(1);
  });
  test("when event exists, no RSVP message exists and reaction is valid, set RSVP message id", async () => {
    mockedFetchRSVPMessageId.mockResolvedValueOnce({
      status: 'success',
      matrix_room_address: null,
      event_exists_for_room: true
    });
    mockedGetDisplayname.mockResolvedValueOnce('sender displayname');
    const event: MatrixReactionEvent = {
      origin_server_ts: 1234,
      content: {
        'm.relates_to': {
          event_id: 'new-rsvp-message-id',
          key: "👍️"
        }
      },
      sender: 'sender',
      event_id: 'event_id'
    }
    const store = createStore(rootReducer)
    await (handleReaction(store, undefined as unknown as MatrixClient))('matrix-room-id', event);
    expect(store.getState().rsvpReactions).toMatchInlineSnapshot(`
Object {
  "matrix-room-id": Array [
    Object {
      "displayname": "sender displayname",
      "matrixEventId": "event_id",
      "sender": "sender",
      "status": "going",
    },
  ],
}
`);
    expect(store.getState().rsvpMessages["matrix-room-id"]).toEqual("new-rsvp-message-id");
    expect(mockedFetchRSVPMessageId).toBeCalledWith('matrix-room-id');
    expect(mockedFetchRSVPMessageId).toBeCalledTimes(1);
    expect(mockedSetRSVPMessageId).toBeCalledTimes(1);
    expect(mockedSetRSVPMessageId).toBeCalledWith(
      { roomId: 'matrix-room-id', rsvpMessageEventId: 'new-rsvp-message-id' });

    expect(mockedSendRSVP).toBeCalledWith({
      roomId: 'matrix-room-id', matrix_username: 'sender',
      status: 'going', displayname: 'sender displayname'
    });
    expect(mockedSendRSVP).toBeCalledTimes(1);
  });

  test("when room exists but reaction isn't valid, ignore", async () => {
    const event: MatrixReactionEvent = {
      origin_server_ts: 1234,
      content: {
        'm.relates_to': {
          event_id: 'not-our-rsvp-message-id',
          key: "woo"
        }
      },
      sender: 'sender',
      event_id: 'event_id'

    }
    const store = createStore(rootReducer)
    await (handleReaction(store, undefined as unknown as MatrixClient))('matrix-room-id', event);

    expect(store.getState().rsvpReactions).toStrictEqual({});
    // Don't call API when invalid emoji
    expect(mockedFetchRSVPMessageId).toBeCalledTimes(0);
    expect(mockedSendRSVP).toBeCalledTimes(0);
  });

  test("when m.relates_to doesn't exist, ignore", async () => {
    const event: MatrixReactionEvent = {
      origin_server_ts: 1234,
      content: {
      },
      sender: 'sender',
      event_id: 'event_id'

    }
    const store = createStore(rootReducer)
    await (handleReaction(store, undefined as unknown as MatrixClient))('matrix-room-id', event);

    expect(store.getState().rsvpReactions).toStrictEqual({});
    expect(mockedSendRSVP).toBeCalledTimes(0);
  });

  test("when reaction is for a different message to our RSVP message, ignore", async () => {
    mockedFetchRSVPMessageId.mockResolvedValueOnce({
      status: 'success',
      matrix_room_address: 'our-rsvp-message-id',
      event_exists_for_room: true
    });
    const event: MatrixReactionEvent = {
      origin_server_ts: 1234,
      content: {
        'm.relates_to': {
          event_id: 'not-our-rsvp-message-id',
          key: "👍️"
        }
      },
      sender: 'sender',
      event_id: 'event_id'

    }
    const initialState = {
      rsvpMessages: {
        'matrix-room-id': 'our-rsvp-message-id'
      }
    }
    const store = createStore(rootReducer, initialState)
    await (handleReaction(store, undefined as unknown as MatrixClient))('matrix-room-id', event);
    expect(store.getState().rsvpReactions).toStrictEqual({});
    expect(mockedSendRSVP).toBeCalledTimes(0);
  });

  test("when reaction is valid and RSVP message ID is in the store", async () => {
    mockedGetDisplayname.mockResolvedValueOnce('sender displayname');
    const event: MatrixReactionEvent = {
      origin_server_ts: 1234,
      content: {
        'm.relates_to': {
          event_id: 'our-rsvp-message-id',
          key: "👍️"
        }
      },
      sender: 'sender',
      event_id: 'event_id'
    }
    const initialState = {
      rsvpMessages: {
        'matrix-room-id': 'our-rsvp-message-id'
      }
    }
    const store = createStore(rootReducer, initialState)
    await (handleReaction(store, undefined as unknown as MatrixClient))('matrix-room-id', event);
    expect(store.getState().rsvpReactions).toStrictEqual({
      'matrix-room-id': [
        {
          status: 'going',
          matrixEventId: 'event_id',
          sender: 'sender',
          displayname: 'sender displayname'
        }
      ]
    });
    expect(mockedSendRSVP).toBeCalledWith({
      roomId: 'matrix-room-id', matrix_username: 'sender', status: 'going', displayname: 'sender displayname'
    });
    expect(mockedSendRSVP).toBeCalledTimes(1);
  });
  test("when reaction is valid & different and RSVP message ID is in the store, updates RSVP", async () => {
    mockedGetDisplayname.mockResolvedValueOnce('sender displayname');
    const event: MatrixReactionEvent = {
      origin_server_ts: 1234,
      content: {
        'm.relates_to': {
          event_id: 'our-rsvp-message-id',
          key: "👎️",
        }
      },
      sender: 'sender',
      event_id: 'event_id'
    }
    const initialState = {
      rsvpMessages: {
        'matrix-room-id': 'our-rsvp-message-id'
      },
      rsvpReactions: {
        'matrix-room-id': [
          {
            status: 'going' as Status,
            matrixEventId: 'event_id',
            sender: 'sender',
            displayname: 'sender displayname'
          }
        ]
      }
    }
    const store = createStore(rootReducer, initialState)
    await (handleReaction(store, undefined as unknown as MatrixClient))('matrix-room-id', event);
    expect(store.getState().rsvpReactions).toMatchInlineSnapshot(`
Object {
  "matrix-room-id": Array [
    Object {
      "displayname": "sender displayname",
      "matrixEventId": "event_id",
      "sender": "sender",
      "status": "going",
    },
    Object {
      "displayname": "sender displayname",
      "matrixEventId": "event_id",
      "sender": "sender",
      "status": "notgoing",
    },
  ],
}
`);
    expect(mockedSendRSVP).toBeCalledWith({
      roomId: 'matrix-room-id', matrix_username: 'sender', status: 'notgoing', displayname: 'sender displayname'
    });
    expect(mockedSendRSVP).toBeCalledTimes(1);
  });
});

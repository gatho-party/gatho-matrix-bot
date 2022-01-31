import { handleReaction } from '../src/handlers'
import { setRSVPMessageId, sendRSVP, fetchRSVPMessageId } from '../src/gatho-api'
import { mocked } from 'ts-jest/utils'
import { rootReducer } from '../src/store';
import { createStore } from 'redux'
import { MatrixClient } from 'matrix-bot-sdk';
import { MatrixReactionEvent } from '../src/interfaces';
import { getDisplayname } from '../src/matrix-api'

import * as dotenv from 'dotenv';
// Support .env file
dotenv.config();

export const secret_matrix_bot_key = process.env.GATHO_API_SECRET_KEY as string;

jest.mock('../src/matrix-api', () => ({
  getDisplayname: jest.fn()
}));
jest.mock('../src/gatho-api', () => ({
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
describe("#handleReaction()", () => {
  test("when event doesn't exist for valid reaction, ignore", async () => {
    mockedFetchRSVPMessageId.mockResolvedValueOnce({
      status: 'success',
      matrix_room_address: null,
      event_exists_for_room: false
    });
    const event: MatrixReactionEvent = {
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
  test("when event exists, no RSVP message exists and valid reaction, set RSVP message id", async () => {
    mockedFetchRSVPMessageId.mockResolvedValueOnce({
      status: 'success',
      matrix_room_address: null,
      event_exists_for_room: true
    });
    mockedGetDisplayname.mockResolvedValueOnce('sender displayname');
    const event: MatrixReactionEvent = {
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
      "reaction": "👍️",
      "sender": "sender",
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
          reaction: '👍️',
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
            reaction: '👍️',
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
      "reaction": "👍️",
      "sender": "sender",
    },
    Object {
      "displayname": "sender displayname",
      "matrixEventId": "event_id",
      "reaction": "👎️",
      "sender": "sender",
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
import { handleReaction } from '../src/handlers'
import { setRsvpMessageId, sendRSVP } from '../src/gatho-api'
import { mocked } from 'ts-jest/utils'
import { rootReducer } from '../src/store';
import { createStore, combineReducers } from 'redux'
import { MatrixClient } from 'matrix-bot-sdk';
import { MatrixReactionEvent } from '../src/interfaces';
import { getDisplayname } from '../src/matrix-api'

jest.mock('../src/matrix-api', () => ({
  getDisplayname: jest.fn()
}));
jest.mock('../src/gatho-api', () => ({
  setRsvpMessageId: jest.fn(),
  sendRSVP: jest.fn()
}));

const mockedGetDisplayname = mocked(getDisplayname, true);
const mockedSetRsvpMessageId = mocked(setRsvpMessageId, true);
const mockedSendRSVP = mocked(sendRSVP, true);

describe("#handleReaction()", () => {
  test("when room doesn't exist for reaction, ignore", async () => {
    mockedSetRsvpMessageId.mockResolvedValueOnce(false);
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
    const result = await (handleReaction(store, undefined as unknown as MatrixClient))('matrix-room-id', event);
    expect(result).toBe('no-rsvp-message-on-server');
    expect(store.getState().rsvpReactions).toStrictEqual({});
    expect(mockedSendRSVP).toBeCalledTimes(0);
  });

  test("when room doesn't exist for reaction, ignore", async () => {
    mockedSetRsvpMessageId.mockResolvedValueOnce(false);
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
    expect(mockedSendRSVP).toBeCalledTimes(0);
  });
  test("when m.relates_to doesn't exist, ignore", async () => {
    mockedSetRsvpMessageId.mockResolvedValueOnce(true);
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
    mockedSetRsvpMessageId.mockResolvedValueOnce(true);
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
    const initialState = {
      rsvpMessages: {
        'matrix-room-id': 'our-rsvp-message-id'
      }
    }
    const store = createStore(rootReducer, initialState)
    const result = await (handleReaction(store, undefined as unknown as MatrixClient))('matrix-room-id', event);
    expect(result).toBe('not-on-our-rsvp-message');
    expect(store.getState().rsvpReactions).toStrictEqual({});
    expect(mockedSendRSVP).toBeCalledTimes(0);
  });

  test("when reaction is valid and on our message", async () => {
    mockedSetRsvpMessageId.mockResolvedValueOnce(true);
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
    const result = await (handleReaction(store, undefined as unknown as MatrixClient))('matrix-room-id', event);
    expect(result).toBe('sent-rsvp');
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
});
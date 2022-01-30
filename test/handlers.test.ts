import {handleReaction} from '../src/handlers'
import {setRsvpMessageId, sendRSVP} from '../src/gatho-api'
import { mocked } from 'ts-jest/utils'
import { rootReducer } from '../src/store';
import { createStore, combineReducers } from 'redux'
import { MatrixClient } from 'matrix-bot-sdk';

jest.mock('../src/gatho-api', () => ({
  setRsvpMessageId: jest.fn(),
  sendRSVP: jest.fn()
}));

const mockedSetRsvpMessageId = mocked(setRsvpMessageId,true);
const mockedSendRSVP = mocked(sendRSVP,true);

describe("#handleReaction()", () => {
  test("when room doesn't exist for reaction, ignore", async () => {
    mockedSetRsvpMessageId.mockResolvedValueOnce(false);
    const event = {
    }
    const store = createStore(rootReducer)
    await (handleReaction(store, undefined as unknown as MatrixClient))('matrix-room-id', event);

    expect(store.getState().rsvpReactions).toStrictEqual({});
    expect(mockedSendRSVP).toBeCalledTimes(0);
  });

  test("when room doesn't exist for reaction, ignore", async () => {
    mockedSetRsvpMessageId.mockResolvedValueOnce(false);
    const event = {
    }
    const store = createStore(rootReducer)
    await (handleReaction(store, undefined as unknown as MatrixClient))('matrix-room-id', event);

    expect(store.getState().rsvpReactions).toStrictEqual({});
    expect(mockedSendRSVP).toBeCalledTimes(0);
  });

});
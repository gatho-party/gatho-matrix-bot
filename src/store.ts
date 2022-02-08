import { createStore, combineReducers } from 'redux'
import { RSVPCount, RSVPMessageIdsForRoom, RSVPReaction } from './interfaces';

const defaultRsvpReducerState: RSVPCount = {};

/* Default state of the map of Matrix room IDs to RSVP message IDs */
const defaultRSVPMessageReducerState: RSVPMessageIdsForRoom = {};

import { removeRSVP, addRSVP } from './update-rsvp-count';
type RemoveRSVPAction = { type: 'remove-rsvp', roomId: string, redactionEvent: string };
type AddRSVPAction = { type: 'add-rsvp', roomId: string, reaction: RSVPReaction };
type RSVPReducerActionTypes = RemoveRSVPAction | AddRSVPAction;

type SetRSVPMessageIDAction = { type: 'set-rsvp-message-id', roomId: string, rsvpMessageId: string }
type RSVPMessagesActionTypes = SetRSVPMessageIDAction;

function rsvpReducer(state = defaultRsvpReducerState, action: RSVPReducerActionTypes) {
  switch (action.type) {
    case 'remove-rsvp':
      return removeRSVP(state, action.roomId, action.redactionEvent);
    case 'add-rsvp':
      return addRSVP(state, action.roomId, action.reaction)
    default:
      return state
  }
}
function rsvpMessagesReducer(state = defaultRSVPMessageReducerState, action: RSVPMessagesActionTypes) {
  switch (action.type) {
    case 'set-rsvp-message-id':
      const { roomId, rsvpMessageId } = action;
      return {
        ...state,
        [roomId]: rsvpMessageId
      };
    default:
      return state
  }
}

export const rootReducer = combineReducers({ rsvpReactions: rsvpReducer, rsvpMessages: rsvpMessagesReducer })
export let store = createStore(rootReducer)
export type OurStore = typeof store;

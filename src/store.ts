import { createStore, combineReducers } from 'redux'
import { RSVPCount, RSVPMessageIdsForRoom, RSVPReaction } from './interfaces';

const defaultRsvpReducerState: RSVPCount = {};

/* Default state of the map of Matrix room IDs to RSVP message IDs */
const defaultRSVPMessageReducerState: RSVPMessageIdsForRoom = {};

import {removeRSVP, addRSVP} from './update-rsvp-count';
type RemoveRSVPAction = {type: 'remove-rsvp', roomId: string, redactionEvent: string};
type AddRSVPAction = {type: 'add-rsvp', roomId: string, reaction: RSVPReaction};
type RSVPReducerActionTypes = RemoveRSVPAction | AddRSVPAction;

type SetRSVPMessageIDAction = {type: 'set-rsvp-message-id', roomId: string, rsvpMessageId: string}
type RSVPMessagesActionTypes = SetRSVPMessageIDAction;

function rsvpReducer(state = defaultRsvpReducerState, action: RSVPReducerActionTypes) {
  switch (action.type) {
    case 'remove-rsvp':
      return removeRSVP(state,action.roomId, action.redactionEvent);
    case 'add-rsvp':
      return addRSVP(state, action.roomId, action.reaction)
    default:
      return state
  }
}
// let rsvpMessageEventId: RSVPMessageIdsForRoom = {};
function rsvpMessagesReducer(state = defaultRSVPMessageReducerState, action: RSVPMessagesActionTypes) {
  switch (action.type) {
    case 'set-rsvp-message-id':
      const {roomId, rsvpMessageId} = action;
      return {
        ...state,
        [roomId]:rsvpMessageId
      };
    default:
      return state
  }
}

// Create a Redux store holding the state of your app.
// Its API is { subscribe, dispatch, getState }.
export const rootReducer = combineReducers({rsvpReactions: rsvpReducer, rsvpMessages: rsvpMessagesReducer})
export let store = createStore(rootReducer)
export type OurStore = typeof store;

// You can use subscribe() to update the UI in response to state changes.
// Normally you'd use a view binding library (e.g. React Redux) rather than subscribe() directly.
// There may be additional use cases where it's helpful to subscribe as well.

// store.subscribe(() => console.log(store.getState()))

// // The only way to mutate the internal state is to dispatch an action.
// // The actions can be serialized, logged or stored and later replayed.
// store.dispatch({ type: 'counter/incremented' })
// // {value: 1}
// store.dispatch({ type: 'counter/incremented' })
// // {value: 2}
// store.dispatch({ type: 'counter/decremented' })
// {value: 1}
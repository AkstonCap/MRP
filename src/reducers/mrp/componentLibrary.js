import * as TYPE from 'actions/types';

/**
 * Component Library reducer.
 *
 * Each entry stores ONLY the Distordia masterdata asset address and a
 * timestamp.  All component details are resolved at query time from the
 * chain — no data duplication.
 *
 * Entry shape: { address: string, addedAt: string }
 */

const initialState = [];

export default function componentLibrary(state = initialState, action) {
  switch (action.type) {
    case TYPE.SET_LIBRARY:
      return action.payload;

    case TYPE.ADD_TO_LIBRARY: {
      const addr = action.payload.address;
      if (!addr) return state;
      const exists = state.some((c) => c.address === addr);
      if (exists) return state;
      return [
        ...state,
        { address: addr, addedAt: action.payload.addedAt || new Date().toISOString() },
      ];
    }

    case TYPE.REMOVE_FROM_LIBRARY:
      return state.filter((c) => c.address !== action.payload);

    default:
      return state;
  }
}

import * as TYPE from 'actions/types';

const initialState = [];

export default function componentLibrary(state = initialState, action) {
  switch (action.type) {
    case TYPE.SET_LIBRARY:
      return action.payload;

    case TYPE.ADD_TO_LIBRARY: {
      // Prevent duplicates by materialId or address
      const exists = state.some(
        (c) =>
          c.id === action.payload.id ||
          (action.payload.address && c.address === action.payload.address)
      );
      if (exists) return state;
      return [...state, action.payload];
    }

    case TYPE.REMOVE_FROM_LIBRARY:
      return state.filter(
        (c) => c.id !== action.payload && c.address !== action.payload
      );

    default:
      return state;
  }
}

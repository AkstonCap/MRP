import * as TYPE from 'actions/types';

const initialState = [];

export default function pallets(state = initialState, action) {
  switch (action.type) {
    case TYPE.SET_PALLETS:
      return action.payload;

    case TYPE.ADD_PALLET:
      return [...state, action.payload];

    case TYPE.UPDATE_PALLET:
      return state.map((pallet) =>
        pallet.id === action.payload.palletId
          ? { ...pallet, ...action.payload.updates }
          : pallet
      );

    case TYPE.REMOVE_PALLET:
      return state.filter((pallet) => pallet.id !== action.payload);

    default:
      return state;
  }
}

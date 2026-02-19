import * as TYPE from 'actions/types';

const initialState = [];

export default function invoices(state = initialState, action) {
  switch (action.type) {
    case TYPE.SET_INVOICES:
      return action.payload;

    case TYPE.ADD_INVOICE:
      return [...state, action.payload];

    case TYPE.UPDATE_INVOICE:
      return state.map((inv) =>
        inv.id === action.payload.invoiceId
          ? { ...inv, ...action.payload.updates }
          : inv
      );

    default:
      return state;
  }
}

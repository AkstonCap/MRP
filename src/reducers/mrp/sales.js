import * as TYPE from 'actions/types';

/**
 * Sales log — one entry per check-out line.
 *
 * Entry shape:
 *   {
 *     id: string,
 *     timestamp: string,
 *     productAddress: string,
 *     quantity: number,
 *     unit: string,
 *     unitPrice: number,      // price snapshot at check-out
 *     currency: string,
 *     total: number,          // quantity * unitPrice
 *     reference: string,      // receipt ref or free-form
 *     expediter: string
 *   }
 */

const initialState = [];

export default function sales(state = initialState, action) {
  switch (action.type) {
    case TYPE.SET_SALES:
      return action.payload || [];

    case TYPE.RECORD_SALE:
      return [...state, action.payload];

    default:
      return state;
  }
}

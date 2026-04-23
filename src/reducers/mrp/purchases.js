import * as TYPE from 'actions/types';

/**
 * Purchase log — one entry per received buy from a local vendor.
 *
 * Entry shape:
 *   {
 *     id: string,
 *     timestamp: string,
 *     vendorAddress: string,
 *     productAddress: string,
 *     quantity: number,
 *     unit: string,
 *     unitCost: number,
 *     currency: string,
 *     reference: string,
 *     notes: string
 *   }
 */

const initialState = [];

export default function purchases(state = initialState, action) {
  switch (action.type) {
    case TYPE.SET_PURCHASES:
      return action.payload || [];

    case TYPE.RECORD_PURCHASE:
      return [...state, action.payload];

    default:
      return state;
  }
}

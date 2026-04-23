import * as TYPE from 'actions/types';

/**
 * Vendor library reducer.
 *
 * Each entry stores ONLY the Distordia `vendor_master_data` asset address
 * and a timestamp.  Vendor details are resolved at query time from the
 * cached chain assets — no data duplication.
 *
 * Entry shape: { address: string, addedAt: string }
 */

const initialState = [];

export default function vendors(state = initialState, action) {
  switch (action.type) {
    case TYPE.SET_VENDORS:
      return action.payload;

    case TYPE.ADD_VENDOR: {
      const addr = action.payload.address;
      if (!addr) return state;
      if (state.some((v) => v.address === addr)) return state;
      return [
        ...state,
        { address: addr, addedAt: action.payload.addedAt || new Date().toISOString() },
      ];
    }

    case TYPE.REMOVE_VENDOR:
      return state.filter((v) => v.address !== action.payload);

    default:
      return state;
  }
}

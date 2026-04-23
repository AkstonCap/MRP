import * as TYPE from 'actions/types';

/**
 * Stock balance reducer — one entry per product keyed by the product's
 * Distordia `material_master_data` asset address.
 *
 * Entry shape:
 *   {
 *     productAddress: string,
 *     quantity: number,
 *     unit: string,
 *     unitPrice: number,     // sale price (modifiable)
 *     currency: string,
 *     location: string,
 *     stockAssetAddress?: string,  // on-chain stock_balance asset address
 *     lastMovementAt: string,
 *     movements: [{ ts, delta, kind, ref }]
 *   }
 */

const initialState = {};

const emptyBalance = (productAddress) => ({
  productAddress,
  quantity: 0,
  unit: 'pcs',
  unitPrice: 0,
  currency: 'USD',
  location: '',
  stockAssetAddress: null,
  lastMovementAt: null,
  movements: [],
});

export default function stockBalances(state = initialState, action) {
  switch (action.type) {
    case TYPE.SET_STOCK_BALANCES:
      return action.payload || {};

    case TYPE.SET_STOCK_BALANCE: {
      const { productAddress, balance } = action.payload;
      if (!productAddress) return state;
      const current = state[productAddress] || emptyBalance(productAddress);
      return {
        ...state,
        [productAddress]: { ...current, ...balance, productAddress },
      };
    }

    case TYPE.SET_STOCK_PRICE: {
      const { productAddress, unitPrice, currency } = action.payload;
      if (!productAddress) return state;
      const current = state[productAddress] || emptyBalance(productAddress);
      return {
        ...state,
        [productAddress]: {
          ...current,
          unitPrice: Number(unitPrice) || 0,
          currency: currency || current.currency || 'USD',
        },
      };
    }

    case TYPE.ADJUST_STOCK_BALANCE: {
      const { productAddress, delta, meta } = action.payload;
      if (!productAddress || !Number.isFinite(delta)) return state;
      const current = state[productAddress] || emptyBalance(productAddress);
      const ts = (meta && meta.timestamp) || new Date().toISOString();
      return {
        ...state,
        [productAddress]: {
          ...current,
          quantity: Number(current.quantity || 0) + Number(delta),
          lastMovementAt: ts,
          movements: [
            ...current.movements,
            {
              ts,
              delta: Number(delta),
              kind: (meta && meta.kind) || 'adjust',
              ref: (meta && meta.ref) || '',
            },
          ],
        },
      };
    }

    default:
      return state;
  }
}

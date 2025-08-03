import * as TYPE from 'actions/types';

const initialState = [];

export default function chainAssets(state = initialState, action) {
  switch (action.type) {
    case TYPE.SET_CHAIN_ASSETS:
    case TYPE.SYNC_ASSETS_FROM_CHAIN:
      return action.payload;

    case TYPE.ADD_CHAIN_ASSET:
      // Check if asset already exists (by address)
      const existingIndex = state.findIndex(asset => asset.address === action.payload.address);
      if (existingIndex >= 0) {
        // Update existing asset
        return state.map((asset, index) =>
          index === existingIndex ? { ...asset, ...action.payload } : asset
        );
      } else {
        // Add new asset
        return [...state, action.payload];
      }

    case TYPE.UPDATE_CHAIN_ASSET:
      return state.map(asset =>
        asset.address === action.payload.assetAddress
          ? { ...asset, ...action.payload.updates }
          : asset
      );

    default:
      return state;
  }
}

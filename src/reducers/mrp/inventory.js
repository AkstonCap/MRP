import * as TYPE from 'actions/types';

const initialState = {};

export default function inventory(state = initialState, action) {
  switch (action.type) {
    case TYPE.SET_INVENTORY:
      return action.payload;

    case TYPE.ADD_INVENTORY_TRANSACTION:
      const { assetAddress, materialId, transaction } = action.payload;
      // Support both new asset address format and legacy material ID
      const inventoryKey = assetAddress || materialId;
      
      const currentInventory = state[inventoryKey] || { 
        onHand: 0, 
        reserved: 0, 
        available: 0,
        transactions: [] 
      };
      
      const newOnHand = currentInventory.onHand + transaction.quantity;
      const newAvailable = newOnHand - currentInventory.reserved;
      
      return {
        ...state,
        [inventoryKey]: {
          ...currentInventory,
          onHand: newOnHand,
          available: newAvailable,
          transactions: [...currentInventory.transactions, transaction],
          assetAddress: assetAddress, // Store reference to chain asset
        },
      };

    default:
      return state;
  }
}

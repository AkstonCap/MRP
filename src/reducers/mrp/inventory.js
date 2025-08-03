import * as TYPE from 'actions/types';

const initialState = {};

export default function inventory(state = initialState, action) {
  switch (action.type) {
    case TYPE.SET_INVENTORY:
      return action.payload;

    case TYPE.ADD_INVENTORY_TRANSACTION:
      const { materialId, transaction } = action.payload;
      const currentInventory = state[materialId] || { 
        onHand: 0, 
        reserved: 0, 
        available: 0,
        transactions: [] 
      };
      
      const newOnHand = currentInventory.onHand + transaction.quantity;
      const newAvailable = newOnHand - currentInventory.reserved;
      
      return {
        ...state,
        [materialId]: {
          ...currentInventory,
          onHand: newOnHand,
          available: newAvailable,
          transactions: [...currentInventory.transactions, transaction],
        },
      };

    default:
      return state;
  }
}

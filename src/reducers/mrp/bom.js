import * as TYPE from 'actions/types';

const initialState = {};

export default function bom(state = initialState, action) {
  switch (action.type) {
    case TYPE.SET_BOM:
      return action.payload;

    case TYPE.ADD_BOM_ITEM:
      const { parentMaterialId, bomItem } = action.payload;
      const currentBom = state[parentMaterialId] || [];
      
      return {
        ...state,
        [parentMaterialId]: [...currentBom, bomItem],
      };

    case TYPE.REMOVE_BOM_ITEM:
      const { parentMaterialId: parentId, bomItemId } = action.payload;
      const existingBom = state[parentId] || [];
      
      return {
        ...state,
        [parentId]: existingBom.filter(item => item.id !== bomItemId),
      };

    default:
      return state;
  }
}

import * as TYPE from 'actions/types';

const initialState = {};

export default function bom(state = initialState, action) {
  switch (action.type) {
    case TYPE.SET_BOM:
      return action.payload;

    case TYPE.ADD_BOM_ITEM:
      const { parentAssetAddress, parentMaterialId, bomItem } = action.payload;
      // Support both new asset address format and legacy material ID
      const bomKey = parentAssetAddress || parentMaterialId;
      const currentBom = state[bomKey] || [];
      
      return {
        ...state,
        [bomKey]: [...currentBom, bomItem],
      };

    case TYPE.REMOVE_BOM_ITEM:
      const { parentAssetAddress: parentAddr, parentMaterialId: parentId, bomItemId } = action.payload;
      const existingBomKey = parentAddr || parentId;
      const existingBom = state[existingBomKey] || [];
      
      return {
        ...state,
        [existingBomKey]: existingBom.filter(item => item.id !== bomItemId),
      };

    default:
      return state;
  }
}

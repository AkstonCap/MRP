import * as TYPE from './types';

export const showConnections = () => ({
  type: TYPE.SHOW_CONNECTIONS,
});

export const hideConnections = () => ({
  type: TYPE.HIDE_CONNECTIONS,
});

export const updateInput = (inputValue) => ({
  type: TYPE.UPDATE_INPUT,
  payload: inputValue,
});

// MRP Action Creators
export const addMaterial = (material) => ({
  type: TYPE.ADD_MATERIAL,
  payload: material,
});

export const updateMaterial = (materialId, updates) => ({
  type: TYPE.UPDATE_MATERIAL,
  payload: { materialId, updates },
});

export const deleteMaterial = (materialId) => ({
  type: TYPE.DELETE_MATERIAL,
  payload: materialId,
});

export const setMaterials = (materials) => ({
  type: TYPE.SET_MATERIALS,
  payload: materials,
});

export const addInventoryTransaction = (transaction) => ({
  type: TYPE.ADD_INVENTORY_TRANSACTION,
  payload: transaction,
});

export const setInventory = (inventory) => ({
  type: TYPE.SET_INVENTORY,
  payload: inventory,
});

export const addBomItem = (parentMaterialId, bomItem) => ({
  type: TYPE.ADD_BOM_ITEM,
  payload: { parentMaterialId, bomItem },
});

export const removeBomItem = (parentMaterialId, bomItemId) => ({
  type: TYPE.REMOVE_BOM_ITEM,
  payload: { parentMaterialId, bomItemId },
});

export const setBom = (bom) => ({
  type: TYPE.SET_BOM,
  payload: bom,
});

export const setActiveTab = (tabName) => ({
  type: TYPE.SET_ACTIVE_TAB,
  payload: tabName,
});

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

// On-Chain Asset Action Creators (Primary Reference)
export const setChainAssets = (assets) => ({
  type: TYPE.SET_CHAIN_ASSETS,
  payload: assets,
});

export const addChainAsset = (asset) => ({
  type: TYPE.ADD_CHAIN_ASSET,
  payload: asset,
});

export const updateChainAsset = (assetAddress, updates) => ({
  type: TYPE.UPDATE_CHAIN_ASSET,
  payload: { assetAddress, updates },
});

export const syncAssetsFromChain = (assets) => ({
  type: TYPE.SYNC_ASSETS_FROM_CHAIN,
  payload: assets,
});

// Legacy Material Action Creators (for backward compatibility)
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

// Inventory Action Creators (now references chain assets)
export const addInventoryTransaction = (transaction) => ({
  type: TYPE.ADD_INVENTORY_TRANSACTION,
  payload: transaction,
});

export const setInventory = (inventory) => ({
  type: TYPE.SET_INVENTORY,
  payload: inventory,
});

// BOM Action Creators (now references chain assets)
export const addBomItem = (parentAssetAddress, bomItem) => ({
  type: TYPE.ADD_BOM_ITEM,
  payload: { parentAssetAddress, bomItem },
});

export const removeBomItem = (parentAssetAddress, bomItemId) => ({
  type: TYPE.REMOVE_BOM_ITEM,
  payload: { parentAssetAddress, bomItemId },
});

export const setBom = (bom) => ({
  type: TYPE.SET_BOM,
  payload: bom,
});

export const setActiveTab = (tabName) => ({
  type: TYPE.SET_ACTIVE_TAB,
  payload: tabName,
});

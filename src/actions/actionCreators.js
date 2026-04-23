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

// Inventory Action Creators (references chain assets by address)
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

// Component Library Action Creators
export const addToLibrary = (component) => ({
  type: TYPE.ADD_TO_LIBRARY,
  payload: component,
});

export const removeFromLibrary = (componentId) => ({
  type: TYPE.REMOVE_FROM_LIBRARY,
  payload: componentId,
});

export const setLibrary = (library) => ({
  type: TYPE.SET_LIBRARY,
  payload: library,
});

// Warehouse Pallet Action Creators
export const addPallet = (pallet) => ({
  type: TYPE.ADD_PALLET,
  payload: pallet,
});

export const updatePallet = (palletId, updates) => ({
  type: TYPE.UPDATE_PALLET,
  payload: { palletId, updates },
});

export const removePallet = (palletId) => ({
  type: TYPE.REMOVE_PALLET,
  payload: palletId,
});

export const setPallets = (pallets) => ({
  type: TYPE.SET_PALLETS,
  payload: pallets,
});

// Invoice Action Creators
export const addInvoice = (invoice) => ({
  type: TYPE.ADD_INVOICE,
  payload: invoice,
});

export const updateInvoice = (invoiceId, updates) => ({
  type: TYPE.UPDATE_INVOICE,
  payload: { invoiceId, updates },
});

export const setInvoices = (invoices) => ({
  type: TYPE.SET_INVOICES,
  payload: invoices,
});

export const setActiveTab = (tabName) => ({
  type: TYPE.SET_ACTIVE_TAB,
  payload: tabName,
});

// Vendor Library Action Creators (address-only)
export const addVendor = (vendor) => ({
  type: TYPE.ADD_VENDOR,
  payload: vendor,
});

export const removeVendor = (address) => ({
  type: TYPE.REMOVE_VENDOR,
  payload: address,
});

export const setVendors = (vendors) => ({
  type: TYPE.SET_VENDORS,
  payload: vendors,
});

// Stock Balance Action Creators
export const setStockBalance = (productAddress, balance) => ({
  type: TYPE.SET_STOCK_BALANCE,
  payload: { productAddress, balance },
});

export const adjustStockBalance = (productAddress, delta, meta) => ({
  type: TYPE.ADJUST_STOCK_BALANCE,
  payload: { productAddress, delta, meta },
});

export const setStockPrice = (productAddress, unitPrice, currency) => ({
  type: TYPE.SET_STOCK_PRICE,
  payload: { productAddress, unitPrice, currency },
});

export const setStockBalances = (balances) => ({
  type: TYPE.SET_STOCK_BALANCES,
  payload: balances,
});

// Purchase Action Creators
export const recordPurchase = (purchase) => ({
  type: TYPE.RECORD_PURCHASE,
  payload: purchase,
});

export const setPurchases = (purchases) => ({
  type: TYPE.SET_PURCHASES,
  payload: purchases,
});

// Sale Action Creators
export const recordSale = (sale) => ({
  type: TYPE.RECORD_SALE,
  payload: sale,
});

export const setSales = (sales) => ({
  type: TYPE.SET_SALES,
  payload: sales,
});

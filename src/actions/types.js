export const SHOW_CONNECTIONS = 'SHOW_CONNECTIONS';
export const HIDE_CONNECTIONS = 'HIDE_CONNECTIONS';

export const UPDATE_INPUT = 'UPDATE_INPUT';

// On-Chain Asset Actions (Primary Reference)
export const SET_CHAIN_ASSETS = 'SET_CHAIN_ASSETS';
export const ADD_CHAIN_ASSET = 'ADD_CHAIN_ASSET';
export const UPDATE_CHAIN_ASSET = 'UPDATE_CHAIN_ASSET';
export const SYNC_ASSETS_FROM_CHAIN = 'SYNC_ASSETS_FROM_CHAIN';

// Inventory Actions (Reference chain assets by address)
export const ADD_INVENTORY_TRANSACTION = 'ADD_INVENTORY_TRANSACTION';
export const SET_INVENTORY = 'SET_INVENTORY';

// BOM Actions (Reference chain assets by address)
export const ADD_BOM_ITEM = 'ADD_BOM_ITEM';
export const REMOVE_BOM_ITEM = 'REMOVE_BOM_ITEM';
export const SET_BOM = 'SET_BOM';

// Component Library Actions
export const ADD_TO_LIBRARY = 'ADD_TO_LIBRARY';
export const REMOVE_FROM_LIBRARY = 'REMOVE_FROM_LIBRARY';
export const SET_LIBRARY = 'SET_LIBRARY';

// Warehouse Pallet Actions
export const ADD_PALLET = 'ADD_PALLET';
export const UPDATE_PALLET = 'UPDATE_PALLET';
export const REMOVE_PALLET = 'REMOVE_PALLET';
export const SET_PALLETS = 'SET_PALLETS';

// Invoice Actions
export const ADD_INVOICE = 'ADD_INVOICE';
export const UPDATE_INVOICE = 'UPDATE_INVOICE';
export const SET_INVOICES = 'SET_INVOICES';

export const SET_ACTIVE_TAB = 'SET_ACTIVE_TAB';

// Vendor Library Actions (address-only, mirrors component library)
export const ADD_VENDOR = 'ADD_VENDOR';
export const REMOVE_VENDOR = 'REMOVE_VENDOR';
export const SET_VENDORS = 'SET_VENDORS';

// Stock Balance Actions (per-product balance + unit price)
export const SET_STOCK_BALANCE = 'SET_STOCK_BALANCE';
export const ADJUST_STOCK_BALANCE = 'ADJUST_STOCK_BALANCE';
export const SET_STOCK_PRICE = 'SET_STOCK_PRICE';
export const SET_STOCK_BALANCES = 'SET_STOCK_BALANCES';

// Purchase Actions (buy from vendor → increments stock)
export const RECORD_PURCHASE = 'RECORD_PURCHASE';
export const SET_PURCHASES = 'SET_PURCHASES';

// Sale Actions (check-out → decrements stock, feeds income report)
export const RECORD_SALE = 'RECORD_SALE';
export const SET_SALES = 'SET_SALES';

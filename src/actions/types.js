export const SHOW_CONNECTIONS = 'SHOW_CONNECTIONS';
export const HIDE_CONNECTIONS = 'HIDE_CONNECTIONS';

export const UPDATE_INPUT = 'UPDATE_INPUT';

// On-Chain Asset Actions (Primary Reference)
export const SET_CHAIN_ASSETS = 'SET_CHAIN_ASSETS';
export const ADD_CHAIN_ASSET = 'ADD_CHAIN_ASSET';
export const UPDATE_CHAIN_ASSET = 'UPDATE_CHAIN_ASSET';
export const SYNC_ASSETS_FROM_CHAIN = 'SYNC_ASSETS_FROM_CHAIN';

// Local Material Actions (Deprecated - will reference chain assets)
export const ADD_MATERIAL = 'ADD_MATERIAL';
export const UPDATE_MATERIAL = 'UPDATE_MATERIAL';
export const DELETE_MATERIAL = 'DELETE_MATERIAL';
export const SET_MATERIALS = 'SET_MATERIALS';

// Inventory Actions (Reference chain assets by address)
export const ADD_INVENTORY_TRANSACTION = 'ADD_INVENTORY_TRANSACTION';
export const SET_INVENTORY = 'SET_INVENTORY';

// BOM Actions (Reference chain assets by address)
export const ADD_BOM_ITEM = 'ADD_BOM_ITEM';
export const REMOVE_BOM_ITEM = 'REMOVE_BOM_ITEM';
export const SET_BOM = 'SET_BOM';

export const SET_ACTIVE_TAB = 'SET_ACTIVE_TAB';

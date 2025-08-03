import { combineReducers } from 'redux';
import chainAssets from './chainAssets';
import materials from './materials';
import inventory from './inventory';
import bom from './bom';
import activeTab from './activeTab';

export default combineReducers({
  chainAssets,
  materials,
  inventory,
  bom,
  activeTab,
});

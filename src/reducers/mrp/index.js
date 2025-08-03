import { combineReducers } from 'redux';
import materials from './materials';
import inventory from './inventory';
import bom from './bom';
import activeTab from './activeTab';

export default combineReducers({
  materials,
  inventory,
  bom,
  activeTab,
});

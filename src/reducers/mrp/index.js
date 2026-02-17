import { combineReducers } from 'redux';
import chainAssets from './chainAssets';
import materials from './materials';
import inventory from './inventory';
import bom from './bom';
import activeTab from './activeTab';
import componentLibrary from './componentLibrary';
import pallets from './pallets';
import invoices from './invoices';

export default combineReducers({
  chainAssets,
  materials,
  inventory,
  bom,
  activeTab,
  componentLibrary,
  pallets,
  invoices,
});

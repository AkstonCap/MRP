/**
 * Distordia_Standards — Standard Asset Format Definitions
 *
 * Distordia masterdata is the **Layer 0** foundation of the supply chain.
 * Every material/component is defined once on the Nexus blockchain as a
 * `material_master_data` asset with a unique address (the "art.nr").
 *
 * The MRP system never duplicates masterdata.  Internal processes
 * (warehouse, BOM, picking, invoicing) reference components solely by
 * their Distordia asset address.  All descriptive data (name, unit,
 * cost, type …) is resolved at query time from the chain.
 *
 * Standard asset formats defined here can be imported into any system
 * that follows the Distordia_Standards specification.
 *
 * All assets use the `distordia` field (1-5) for lifecycle status
 * and `assetType` to distinguish between asset kinds:
 *
 *   material_master_data  — Component/material catalog entries (Layer 0)
 *   warehouse_pallet      — Physical pallet inventory tracking
 *   sales_invoice         — Invoice issued on a sale
 *   picking_list          — BOM-based picking list for production/shipping
 */

import { DISTORDIA_STATUS } from './materialAssetTemplate';

// ─── Asset Type Constants ────────────────────────────────────────────────────

export const ASSET_TYPES = {
  MATERIAL: 'material_master_data',
  PALLET: 'warehouse_pallet',
  INVOICE: 'sales_invoice',
  PICKING_LIST: 'picking_list',
};

// ─── Pallet Status ───────────────────────────────────────────────────────────

export const PALLET_STATUS = {
  AVAILABLE: 'available',
  RESERVED: 'reserved',
  PICKED: 'picked',
  SHIPPED: 'shipped',
  EMPTY: 'empty',
};

export const PALLET_STATUS_LABELS = {
  [PALLET_STATUS.AVAILABLE]: 'Available',
  [PALLET_STATUS.RESERVED]: 'Reserved',
  [PALLET_STATUS.PICKED]: 'Picked',
  [PALLET_STATUS.SHIPPED]: 'Shipped',
  [PALLET_STATUS.EMPTY]: 'Empty',
};

// ─── Invoice Status ──────────────────────────────────────────────────────────

export const INVOICE_STATUS = {
  DRAFT: 'draft',
  ISSUED: 'issued',
  PAID: 'paid',
  CANCELLED: 'cancelled',
};

// ─── Asset Template Creators ─────────────────────────────────────────────────

/**
 * Create a warehouse pallet asset for on-chain registration.
 */
export const createPalletAssetTemplate = (pallet, distordiaStatus = DISTORDIA_STATUS.ACTIVE) => ({
  name: `mrp_pallet_${pallet.id}`,
  data: JSON.stringify({
    distordia: distordiaStatus,
    assetType: ASSET_TYPES.PALLET,
    palletId: pallet.id,
    materialId: pallet.materialId,
    materialName: pallet.materialName,
    quantity: pallet.quantity,
    unit: pallet.unit,
    location: pallet.location,
    palletStatus: pallet.status || PALLET_STATUS.AVAILABLE,
    receivedAt: pallet.receivedAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    reference: pallet.reference || '',
    version: '1.0',
    publishedBy: 'mrp_module',
    mrpModuleVersion: '1.0.0',
  }),
  format: 'JSON',
});

/**
 * Create a sales invoice asset for on-chain registration.
 */
export const createInvoiceAssetTemplate = (invoice, distordiaStatus = DISTORDIA_STATUS.ACTIVE) => ({
  name: `mrp_invoice_${invoice.id}`,
  data: JSON.stringify({
    distordia: distordiaStatus,
    assetType: ASSET_TYPES.INVOICE,
    invoiceId: invoice.id,
    invoiceNumber: invoice.invoiceNumber,
    customer: invoice.customer,
    items: invoice.items,
    subtotal: invoice.subtotal,
    tax: invoice.tax,
    total: invoice.total,
    currency: invoice.currency || 'USD',
    status: invoice.status || INVOICE_STATUS.ISSUED,
    issuedAt: invoice.issuedAt || new Date().toISOString(),
    dueDate: invoice.dueDate || '',
    notes: invoice.notes || '',
    version: '1.0',
    publishedBy: 'mrp_module',
    mrpModuleVersion: '1.0.0',
  }),
  format: 'JSON',
});

/**
 * Create a picking list asset for on-chain registration.
 */
export const createPickingListAssetTemplate = (pickingList, distordiaStatus = DISTORDIA_STATUS.ACTIVE) => ({
  name: `mrp_picklist_${pickingList.id}`,
  data: JSON.stringify({
    distordia: distordiaStatus,
    assetType: ASSET_TYPES.PICKING_LIST,
    pickingListId: pickingList.id,
    productId: pickingList.productId,
    productName: pickingList.productName,
    orderQuantity: pickingList.orderQuantity,
    lines: pickingList.lines,
    status: pickingList.status || 'open',
    createdAt: pickingList.createdAt || new Date().toISOString(),
    version: '1.0',
    publishedBy: 'mrp_module',
    mrpModuleVersion: '1.0.0',
  }),
  format: 'JSON',
});

/**
 * Parse any Distordia_Standards asset from on-chain data.
 */
export const parseDistordiaAsset = (asset) => {
  try {
    const data = typeof asset.data === 'string' ? JSON.parse(asset.data) : asset.data;
    return {
      ...asset,
      parsedData: data,
      assetType: data.assetType,
      distordiaStatus: data.distordia,
    };
  } catch (e) {
    return { ...asset, parsedData: null, assetType: null, distordiaStatus: null };
  }
};

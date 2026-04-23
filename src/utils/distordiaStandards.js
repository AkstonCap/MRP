/**
 * Distordia_Standards — Standard Asset Format Definitions
 *
 * Distordia masterdata is the **Layer 0** foundation of the supply chain.
 * Every material/product is defined once on the Nexus blockchain as a
 * `material_master_data` asset with a unique address (the "art.nr").
 * Every vendor is defined once as a `vendor_master_data` asset.
 *
 * The MRP system never duplicates masterdata.  Internal processes
 * (purchasing, stock, check-out) reference products and vendors solely
 * by their Distordia asset address.  All descriptive data is resolved
 * at query time from the chain.
 *
 * Standard asset formats defined here can be imported into any system
 * that follows the Distordia_Standards specification.
 *
 * All assets use the `distordia` field (1-5) for lifecycle status
 * and `assetType` to distinguish between asset kinds:
 *
 *   material_master_data  — Product/material catalog entries (Layer 0)
 *   vendor_master_data    — Vendor catalog entries (Layer 0)
 *   stock_balance         — Per-product on-chain stock balance + price
 *   warehouse_pallet      — (legacy) physical pallet inventory tracking
 *   sales_invoice         — (legacy) invoice issued on a sale
 *   picking_list          — (legacy) BOM-based picking list
 */

import { DISTORDIA_STATUS } from './materialAssetTemplate';

// ─── Asset Type Constants ────────────────────────────────────────────────────

export const ASSET_TYPES = {
  MATERIAL: 'material_master_data',
  VENDOR: 'vendor_master_data',
  STOCK_BALANCE: 'stock_balance',
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
 * Create a material_master_data asset for on-chain registration.
 * The resulting asset's address becomes the permanent product ID.
 */
export const createMaterialAssetTemplate = (product, distordiaStatus = DISTORDIA_STATUS.ACTIVE) => ({
  name: `mrp_product_${(product.materialId || product.id || Date.now()).toString()}`,
  data: JSON.stringify({
    distordia: distordiaStatus,
    assetType: ASSET_TYPES.MATERIAL,
    materialId: product.materialId || product.id || '',
    materialName: product.materialName || product.name || '',
    description: product.description || '',
    unit: product.unit || 'pcs',
    materialType: product.materialType || 'finished',
    baseCost: product.baseCost != null ? Number(product.baseCost) : 0,
    currency: product.currency || 'USD',
    vendorAddress: product.vendorAddress || '',
    vendorName: product.vendorName || '',
    barcode: product.barcode || '',
    publishedAt: new Date().toISOString(),
    version: '1.0',
    publishedBy: 'mrp_module',
    mrpModuleVersion: '1.0.0',
  }),
  format: 'JSON',
});

/**
 * Create a vendor_master_data asset for on-chain registration.
 * The resulting asset's address becomes the permanent vendor ID.
 */
export const createVendorAssetTemplate = (vendor, distordiaStatus = DISTORDIA_STATUS.ACTIVE) => ({
  name: `mrp_vendor_${(vendor.vendorId || vendor.id || Date.now()).toString()}`,
  data: JSON.stringify({
    distordia: distordiaStatus,
    assetType: ASSET_TYPES.VENDOR,
    vendorId: vendor.vendorId || vendor.id || '',
    vendorName: vendor.vendorName || vendor.name || '',
    description: vendor.description || '',
    contact: vendor.contact || '',
    email: vendor.email || '',
    phone: vendor.phone || '',
    location: vendor.location || '',
    notes: vendor.notes || '',
    publishedAt: new Date().toISOString(),
    version: '1.0',
    publishedBy: 'mrp_module',
    mrpModuleVersion: '1.0.0',
  }),
  format: 'JSON',
});

/**
 * Create a stock_balance asset for on-chain registration.
 * One stock_balance asset per product.  Holds the modifiable sale price
 * and the current on-hand quantity.
 */
export const createStockBalanceAssetTemplate = (stock, distordiaStatus = DISTORDIA_STATUS.ACTIVE) => ({
  name: `mrp_stock_${(stock.productAddress || stock.id || Date.now()).toString()}`,
  data: JSON.stringify({
    distordia: distordiaStatus,
    assetType: ASSET_TYPES.STOCK_BALANCE,
    productAddress: stock.productAddress || '',
    productName: stock.productName || '',
    quantity: stock.quantity != null ? Number(stock.quantity) : 0,
    unit: stock.unit || 'pcs',
    unitPrice: stock.unitPrice != null ? Number(stock.unitPrice) : 0,
    currency: stock.currency || 'USD',
    location: stock.location || '',
    lastMovementAt: stock.lastMovementAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    version: '1.0',
    publishedBy: 'mrp_module',
    mrpModuleVersion: '1.0.0',
  }),
  format: 'JSON',
});

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

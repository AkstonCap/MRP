import { DISTORDIA_STATUS_LABELS } from './materialAssetTemplate';

/**
 * Material Reference Manager — Distordia Masterdata as Layer 0
 *
 * The Distordia masterdata on the Nexus blockchain is the single source of
 * truth for component/material information.  The internal component library
 * stores ONLY the Distordia asset address (the reference number).  All
 * material details (name, unit, cost, type …) are resolved at query time
 * from the cached chain assets — zero data duplication.
 *
 * Resolution order:
 *   1. Chain asset by address  (authoritative — Distordia masterdata)
 *   2. Local material by ID    (offline / legacy fallback)
 */

// ─── Resolve a single chain asset address into a material object ─────────────

const resolveChainAsset = (address, chainAssets) => {
  const asset = chainAssets.find((a) => a.address === address);
  if (!asset || !asset.parsedData) return null;
  const d = asset.parsedData;
  return {
    id: asset.address,
    address: asset.address,
    name: d.materialName,
    description: d.description,
    unit: d.unit,
    cost: d.baseCost || 0,
    type: d.materialType,
    source: 'chain',
    distordiaStatus: d.distordia,
    statusLabel: DISTORDIA_STATUS_LABELS[d.distordia] || asset.statusLabel,
    createdAt: d.publishedAt,
  };
};

// ─── Public helpers ──────────────────────────────────────────────────────────

/**
 * Resolve a material reference (address or local ID) to a material object.
 * Chain assets are checked first (authoritative), then local materials.
 */
export const getMaterialFromReference = (reference, chainAssets, localMaterials) => {
  if (reference) {
    const resolved = resolveChainAsset(reference, chainAssets);
    if (resolved) return resolved;
  }

  const localMaterial = localMaterials.find((m) => m.id === reference);
  if (localMaterial) {
    return { ...localMaterial, source: 'local' };
  }

  return null;
};

/**
 * Resolve the component library (address-only entries) into full material
 * objects by querying the cached chain assets.
 */
export const resolveLibrary = (componentLibrary, chainAssets) => {
  return componentLibrary
    .map((entry) => resolveChainAsset(entry.address, chainAssets))
    .filter(Boolean);
};

/**
 * Get the combined list of materials available to the MRP system.
 *
 * When a componentLibrary is provided its addresses are resolved first
 * (these are the Distordia masterdata components the business has chosen
 * to use).  Local-only materials are appended for offline / legacy support.
 */
export const getAllMaterials = (chainAssets, localMaterials, componentLibrary) => {
  const materials = [];
  const seenAddresses = new Set();

  if (componentLibrary && componentLibrary.length > 0) {
    // Primary path — resolve library addresses from chain
    componentLibrary.forEach((entry) => {
      const resolved = resolveChainAsset(entry.address, chainAssets);
      if (resolved) {
        materials.push(resolved);
        seenAddresses.add(resolved.address);
      }
    });
  } else {
    // Fallback — include every chain asset of type material_master_data
    chainAssets.forEach((asset) => {
      if (asset.parsedData && asset.parsedData.assetType === 'material_master_data') {
        const resolved = resolveChainAsset(asset.address, chainAssets);
        if (resolved) {
          materials.push(resolved);
          seenAddresses.add(resolved.address);
        }
      }
    });
  }

  // Append local-only materials that aren't already covered
  const chainNames = materials.map((m) => m.name && m.name.toLowerCase());
  localMaterials.forEach((material) => {
    if (
      !seenAddresses.has(material.id) &&
      !chainNames.includes(material.name && material.name.toLowerCase())
    ) {
      materials.push({ ...material, source: 'local' });
    }
  });

  return materials;
};

// Get inventory / BOM key — always prefer asset address
export const getInventoryKey = (material) => material.address || material.id;
export const getBomKey = (material) => material.address || material.id;

// Check if material is on chain
export const isMaterialOnChain = (material) =>
  material.source === 'chain' && !!material.address;

// Get material display name with source indicator
export const getMaterialDisplayName = (material) => {
  if (!material) return 'Unknown Material';
  const sourceIcon = material.source === 'chain' ? '🔗' : '📝';
  return `${sourceIcon} ${material.name}`;
};

// ─── Vendor resolution (vendor_master_data assets) ───────────────────────────

const resolveVendorAsset = (address, chainAssets) => {
  const asset = chainAssets.find((a) => a.address === address);
  if (!asset || !asset.parsedData) return null;
  if (asset.parsedData.assetType !== 'vendor_master_data') return null;
  const d = asset.parsedData;
  return {
    id: asset.address,
    address: asset.address,
    name: d.vendorName,
    description: d.description,
    contact: d.contact,
    email: d.email,
    phone: d.phone,
    location: d.location,
    notes: d.notes,
    distordiaStatus: d.distordia,
    statusLabel: DISTORDIA_STATUS_LABELS[d.distordia] || 'Unknown',
    source: 'chain',
  };
};

export const getVendorFromReference = (address, chainAssets) =>
  address ? resolveVendorAsset(address, chainAssets) : null;

export const resolveVendorLibrary = (vendorLibrary, chainAssets) =>
  vendorLibrary
    .map((entry) => resolveVendorAsset(entry.address, chainAssets))
    .filter(Boolean);

export const getAllVendors = (chainAssets, vendorLibrary) => {
  if (vendorLibrary && vendorLibrary.length > 0) {
    return resolveVendorLibrary(vendorLibrary, chainAssets);
  }
  return chainAssets
    .filter((a) => a.parsedData && a.parsedData.assetType === 'vendor_master_data')
    .map((a) => resolveVendorAsset(a.address, chainAssets))
    .filter(Boolean);
};


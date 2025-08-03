import { parseMaterialAsset } from './materialAssetTemplate';

/**
 * Utility functions for managing the transition from local materials to chain assets
 * as the global reference point for the MRP system
 */

// Get material data from chain assets or fallback to local materials
export const getMaterialFromReference = (reference, chainAssets, localMaterials) => {
  // First try to find by asset address
  if (reference && reference.startsWith && (reference.startsWith('0x') || reference.length > 20)) {
    const chainAsset = chainAssets.find(asset => asset.address === reference);
    if (chainAsset && chainAsset.parsedData) {
      return {
        id: chainAsset.address,
        address: chainAsset.address,
        name: chainAsset.parsedData.materialName,
        description: chainAsset.parsedData.description,
        unit: chainAsset.parsedData.unit,
        cost: chainAsset.parsedData.baseCost || 0,
        type: chainAsset.parsedData.materialType,
        source: 'chain',
        distordiaStatus: chainAsset.parsedData.distordia,
        statusLabel: chainAsset.statusLabel,
        createdAt: chainAsset.parsedData.publishedAt,
      };
    }
  }
  
  // Fallback to local material by ID
  const localMaterial = localMaterials.find(m => m.id === reference);
  if (localMaterial) {
    return {
      ...localMaterial,
      source: 'local',
    };
  }
  
  return null;
};

// Get all materials (chain assets first, then local materials not on chain)
export const getAllMaterials = (chainAssets, localMaterials) => {
  const materials = [];
  
  // Add all chain assets first
  chainAssets.forEach(asset => {
    if (asset.parsedData && asset.parsedData.assetType === 'material_master_data') {
      materials.push({
        id: asset.address,
        address: asset.address,
        name: asset.parsedData.materialName,
        description: asset.parsedData.description,
        unit: asset.parsedData.unit,
        cost: asset.parsedData.baseCost || 0,
        type: asset.parsedData.materialType,
        source: 'chain',
        distordiaStatus: asset.parsedData.distordia,
        statusLabel: asset.statusLabel,
        createdAt: asset.parsedData.publishedAt,
      });
    }
  });
  
  // Add local materials that aren't already on chain
  const chainMaterialNames = materials.map(m => m.name.toLowerCase());
  localMaterials.forEach(material => {
    if (!chainMaterialNames.includes(material.name.toLowerCase())) {
      materials.push({
        ...material,
        source: 'local',
      });
    }
  });
  
  return materials;
};

// Get inventory key (prefer asset address over material ID)
export const getInventoryKey = (material) => {
  return material.address || material.id;
};

// Get BOM key (prefer asset address over material ID)
export const getBomKey = (material) => {
  return material.address || material.id;
};

// Check if material is on chain
export const isMaterialOnChain = (material) => {
  return material.source === 'chain' && material.address;
};

// Get material display name with source indicator
export const getMaterialDisplayName = (material) => {
  if (!material) return 'Unknown Material';
  
  const sourceIcon = material.source === 'chain' ? '🔗' : '📝';
  return `${sourceIcon} ${material.name}`;
};

// Convert local material to chain asset for publishing
export const prepareLocalMaterialForChain = (localMaterial) => {
  return {
    ...localMaterial,
    // Add any additional fields needed for chain publishing
    qualityGrade: localMaterial.qualityGrade || 'Standard',
    certifications: localMaterial.certifications || [],
    specifications: localMaterial.specifications || {},
  };
};

// Update inventory and BOM references when material moves to chain
export const updateReferencesToChainAsset = (localMaterialId, chainAssetAddress, inventory, bom) => {
  const updatedInventory = { ...inventory };
  const updatedBom = { ...bom };
  
  // Update inventory reference
  if (updatedInventory[localMaterialId]) {
    updatedInventory[chainAssetAddress] = {
      ...updatedInventory[localMaterialId],
      assetAddress: chainAssetAddress,
    };
    delete updatedInventory[localMaterialId];
  }
  
  // Update BOM references
  if (updatedBom[localMaterialId]) {
    updatedBom[chainAssetAddress] = updatedBom[localMaterialId];
    delete updatedBom[localMaterialId];
  }
  
  // Update BOM items that reference this material
  Object.keys(updatedBom).forEach(bomKey => {
    updatedBom[bomKey] = updatedBom[bomKey].map(bomItem => ({
      ...bomItem,
      childMaterialId: bomItem.childMaterialId === localMaterialId ? chainAssetAddress : bomItem.childMaterialId,
      childAssetAddress: bomItem.childMaterialId === localMaterialId ? chainAssetAddress : bomItem.childAssetAddress,
    }));
  });
  
  return { updatedInventory, updatedBom };
};

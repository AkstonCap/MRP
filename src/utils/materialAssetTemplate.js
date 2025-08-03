// Material Master Data Asset Template for Nexus Blockchain
export const DISTORDIA_STATUS = {
  ACTIVE: 1,
  SOLD_OUT: 2,
  PLANNED: 3,
  DISCONTINUED: 4,
  PENDING_APPROVAL: 5,
};

export const DISTORDIA_STATUS_LABELS = {
  [DISTORDIA_STATUS.ACTIVE]: 'Active',
  [DISTORDIA_STATUS.SOLD_OUT]: 'Sold Out',
  [DISTORDIA_STATUS.PLANNED]: 'Planned for Future',
  [DISTORDIA_STATUS.DISCONTINUED]: 'Discontinued',
  [DISTORDIA_STATUS.PENDING_APPROVAL]: 'Pending Approval',
};

export const createMaterialAssetTemplate = (material, status = DISTORDIA_STATUS.ACTIVE) => {
  return {
    // Asset basic information
    name: `mrp_material_${material.name.toLowerCase().replace(/\s+/g, '_')}_${material.id}`,
    
    // Asset data - this is what gets stored on-chain
    data: JSON.stringify({
      // MRP identification flag
      distordia: status,
      
      // Material master data
      materialId: material.id,
      materialName: material.name,
      description: material.description,
      unit: material.unit,
      materialType: material.type,
      
      // Cost information (optional - might be sensitive)
      baseCost: material.cost,
      currency: 'USD',
      
      // Metadata
      version: '1.0',
      publishedAt: new Date().toISOString(),
      publishedBy: 'mrp_module', // In real implementation, this would be user's address
      
      // Quality and compliance data
      qualityGrade: material.qualityGrade || 'Standard',
      certifications: material.certifications || [],
      safetyDataSheet: material.safetyDataSheet || null,
      
      // Supplier information (if public)
      preferredSuppliers: material.preferredSuppliers || [],
      
      // Technical specifications
      specifications: material.specifications || {},
      
      // Blockchain provenance
      chainId: 'nexus_testnet', // or 'nexus_mainnet'
      assetType: 'material_master_data',
      mrpModuleVersion: '1.0.0',
    }),
    
    // Asset format (JSON data)
    format: 'JSON',
  };
};

export const parseMaterialAsset = (asset) => {
  try {
    const data = JSON.parse(asset.data);
    return {
      ...asset,
      parsedData: data,
      distordiaStatus: data.distordia,
      statusLabel: DISTORDIA_STATUS_LABELS[data.distordia] || 'Unknown',
    };
  } catch (error) {
    console.error('Error parsing material asset:', error);
    return {
      ...asset,
      parsedData: null,
      distordiaStatus: null,
      statusLabel: 'Parse Error',
    };
  }
};

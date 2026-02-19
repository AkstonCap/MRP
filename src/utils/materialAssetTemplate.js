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

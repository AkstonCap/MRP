export const sampleMaterials = [
  {
    id: '1',
    name: 'Steel Rod 12mm',
    description: '12mm diameter steel reinforcement rod',
    unit: 'm',
    cost: 2.50,
    type: 'raw',
    createdAt: '2025-08-01T10:00:00.000Z',
  },
  {
    id: '2',
    name: 'Concrete Mix',
    description: 'Ready-mix concrete Grade 25',
    unit: 'm³',
    cost: 85.00,
    type: 'raw',
    createdAt: '2025-08-01T10:05:00.000Z',
  },
  {
    id: '3',
    name: 'Wooden Beam 200x50',
    description: '200mm x 50mm treated pine beam',
    unit: 'm',
    cost: 12.50,
    type: 'raw',
    createdAt: '2025-08-01T10:10:00.000Z',
  },
  {
    id: '4',
    name: 'Prefab Wall Panel',
    description: 'Standard 3m x 2.4m wall panel',
    unit: 'pcs',
    cost: 450.00,
    type: 'semi',
    createdAt: '2025-08-01T10:15:00.000Z',
  },
  {
    id: '5',
    name: 'Modular House Kit',
    description: 'Complete 3-bedroom modular house kit',
    unit: 'kit',
    cost: 25000.00,
    type: 'finished',
    createdAt: '2025-08-01T10:20:00.000Z',
  },
];

export const sampleInventory = {
  '1': {
    onHand: 500,
    reserved: 50,
    available: 450,
    transactions: [
      {
        id: 'inv1',
        materialId: '1',
        quantity: 1000,
        type: 'receipt',
        reference: 'PO-2025-001',
        timestamp: '2025-08-01T09:00:00.000Z',
      },
      {
        id: 'inv2',
        materialId: '1',
        quantity: -500,
        type: 'issue',
        reference: 'WO-2025-001',
        timestamp: '2025-08-02T14:30:00.000Z',
      },
    ],
  },
  '2': {
    onHand: 15,
    reserved: 5,
    available: 10,
    transactions: [
      {
        id: 'inv3',
        materialId: '2',
        quantity: 20,
        type: 'receipt',
        reference: 'PO-2025-002',
        timestamp: '2025-08-01T11:00:00.000Z',
      },
      {
        id: 'inv4',
        materialId: '2',
        quantity: -5,
        type: 'issue',
        reference: 'WO-2025-002',
        timestamp: '2025-08-02T16:00:00.000Z',
      },
    ],
  },
  '3': {
    onHand: 100,
    reserved: 20,
    available: 80,
    transactions: [
      {
        id: 'inv5',
        materialId: '3',
        quantity: 150,
        type: 'receipt',
        reference: 'PO-2025-003',
        timestamp: '2025-08-01T13:00:00.000Z',
      },
      {
        id: 'inv6',
        materialId: '3',
        quantity: -50,
        type: 'issue',
        reference: 'WO-2025-003',
        timestamp: '2025-08-02T10:00:00.000Z',
      },
    ],
  },
  '4': {
    onHand: 8,
    reserved: 0,
    available: 8,
    transactions: [
      {
        id: 'inv7',
        materialId: '4',
        quantity: 10,
        type: 'receipt',
        reference: 'PO-2025-004',
        timestamp: '2025-08-01T15:00:00.000Z',
      },
      {
        id: 'inv8',
        materialId: '4',
        quantity: -2,
        type: 'issue',
        reference: 'WO-2025-004',
        timestamp: '2025-08-02T12:00:00.000Z',
      },
    ],
  },
  '5': {
    onHand: 2,
    reserved: 1,
    available: 1,
    transactions: [
      {
        id: 'inv9',
        materialId: '5',
        quantity: 3,
        type: 'receipt',
        reference: 'PRODUCTION-001',
        timestamp: '2025-08-02T18:00:00.000Z',
      },
      {
        id: 'inv10',
        materialId: '5',
        quantity: -1,
        type: 'issue',
        reference: 'SO-2025-001',
        timestamp: '2025-08-03T09:00:00.000Z',
      },
    ],
  },
};

export const sampleBOM = {
  '4': [ // Prefab Wall Panel components
    {
      id: 'bom1',
      childMaterialId: '1', // Steel Rod 12mm
      quantity: 8, // 8 meters per panel
    },
    {
      id: 'bom2',
      childMaterialId: '2', // Concrete Mix
      quantity: 0.5, // 0.5 m³ per panel
    },
    {
      id: 'bom3',
      childMaterialId: '3', // Wooden Beam
      quantity: 4, // 4 meters per panel
    },
  ],
  '5': [ // Modular House Kit components
    {
      id: 'bom4',
      childMaterialId: '4', // Prefab Wall Panel
      quantity: 20, // 20 panels per house
    },
    {
      id: 'bom5',
      childMaterialId: '3', // Additional wooden beams
      quantity: 50, // 50 meters for roof structure
    },
  ],
};

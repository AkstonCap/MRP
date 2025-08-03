# Chain Assets Architecture Implementation

## Overview
This document describes the architectural changes made to implement blockchain assets as the foundational reference point for the MRP system, as requested.

## Key Changes Made

### 1. Material Reference Manager (`src/utils/materialReferenceManager.js`)
- **Purpose**: Utility functions to manage the transition from local materials to chain assets
- **Key Functions**:
  - `getMaterialFromReference()`: Resolves material data from either asset address or local ID
  - `getAllMaterials()`: Combines chain assets and local materials with chain assets taking priority
  - `getMaterialDisplayName()`: Shows material name with chain/local indicator (🔗/📝)
  - `updateReferencesToChainAsset()`: Migrates local references to chain asset addresses

### 2. Redux State Structure Updates

#### Action Types (`src/actions/types.js`)
- Added chain asset action types:
  - `SET_CHAIN_ASSETS`
  - `ADD_CHAIN_ASSET`
  - `UPDATE_CHAIN_ASSET`
  - `REMOVE_CHAIN_ASSET`

#### Action Creators (`src/actions/actionCreators.js`)
- Added chain asset action creators
- Updated inventory and BOM actions to support asset addresses alongside material IDs

#### New Reducer (`src/reducers/chainAssets.js`)
- Manages chain assets state
- Handles asset operations (add, update, remove, set all)

#### Updated Reducers
- **`inventory.js`**: Now accepts `assetAddress` parameter alongside `materialId`
- **`bom.js`**: Now supports `parentAssetAddress` and `childAssetAddress` for blockchain references

### 3. Component Updates

#### Main Interface (`src/components/MRPInterface.js`)
- **Data Source**: Now uses `getAllMaterials(chainAssets, localMaterials)` instead of just local materials
- **Material Dropdowns**: Updated to show chain assets first with visual indicators (🔗/📝)
- **Transaction Handling**: 
  - Inventory transactions now include asset addresses
  - BOM items now reference both material IDs and asset addresses
- **Display**: Shows distordia status for chain assets in material listings

#### Production Planning (`src/components/ProductionPlanning.js`)
- **Material Selection**: Uses chain assets as primary data source
- **BOM Calculations**: Works with both asset addresses and legacy material IDs
- **Requirements Display**: Shows chain asset indicators in material names

### 4. Backward Compatibility Strategy
- **Dual Reference System**: All operations support both legacy material IDs and new asset addresses
- **Graceful Fallback**: If chain asset not found, falls back to local material data
- **Migration Support**: Utilities provided to migrate existing data to chain assets

## Data Flow Architecture

### Before (Local-First)
```
Materials → Inventory → BOM → Production Planning
    ↓
Local Redux State Only
```

### After (Chain-First)
```
Chain Assets ← API Query → Blockchain
    ↓
Combined Materials (Chain + Local)
    ↓
Inventory/BOM (Asset Address + Material ID)
    ↓
Production Planning (Chain-Aware)
```

## Visual Indicators
- **🔗**: Chain asset (blockchain-backed material)
- **📝**: Local material (local-only data)
- **Distordia Status**: Lifecycle indicators (Active, Sold Out, Planned, etc.)

## Benefits Achieved
1. **Global Reference Point**: Chain assets now serve as the authoritative source
2. **Interoperability**: System works across multiple applications using same chain assets
3. **Traceability**: Full blockchain audit trail for material lifecycle
4. **Standardization**: Distordia status system provides consistent material states
5. **Backward Compatibility**: Existing local data continues to work during transition

## Next Steps for Full Implementation
1. **Data Migration**: Create tools to publish existing local materials to chain
2. **Chain Sync**: Implement automatic sync between local state and blockchain
3. **Advanced Features**: Add chain-specific features like provenance tracking
4. **Performance**: Implement caching strategies for chain data queries

## Technical Notes
- All material keys now use `material.address || material.id` pattern
- Chain assets take precedence in material listings and calculations
- Legacy material ID support maintained for smooth transition
- Display names include source indicators for user clarity

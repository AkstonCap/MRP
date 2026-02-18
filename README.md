# MRP Module

A Nexus Wallet Module for small-business Material Resource Planning (MRP). Built with React and Redux, it uses the **Distordia_Standards** on-chain masterdata as the single source of truth for component/material information — the **Layer 0** foundation for supply chains.

## Architecture — Distordia Masterdata as Layer 0

```
┌──────────────────────────────────────────────────────────┐
│                  Nexus Blockchain                         │
│  ┌────────────────────────────────────────────────────┐  │
│  │  Distordia Masterdata (Layer 0)                    │  │
│  │  material_master_data assets — the global catalog  │  │
│  │  Each asset has a unique address (art.nr)          │  │
│  └────────────────────────────────────────────────────┘  │
│  ┌────────────┐ ┌──────────────┐ ┌──────────────────┐   │
│  │  Pallet    │ │  Invoice     │ │  Picking List    │   │
│  │  Assets    │ │  Assets      │ │  Assets          │   │
│  └────────────┘ └──────────────┘ └──────────────────┘   │
└──────────────────────────────────────────────────────────┘
        ▲ resolve by address              ▲ publish
        │                                 │
┌──────────────────────────────────────────────────────────┐
│                    MRP Module                             │
│                                                          │
│  Component Library ─── [ address, address, … ]           │
│        │  (address-only references, no data duplication)  │
│        ▼                                                 │
│  Warehouse ─── Pallets reference materialId (address)    │
│  Inventory ─── Transactions keyed by address             │
│  BOM       ─── Parent/child linked by address            │
│  Picking   ─── Allocates pallet → BOM line by address    │
│  Invoicing ─── Line items reference address              │
└──────────────────────────────────────────────────────────┘
```

**Key principle:** The internal component library stores **only the Distordia asset address** (the reference number / art.nr). All descriptive information — name, unit, cost, type, status — is resolved at query time from the blockchain. This means:

- Zero data duplication between your MRP and the global masterdata
- Any update to the masterdata is immediately visible
- Every downstream process (warehouse, picking, invoicing) traces back to the same canonical reference

## Features

### Component Search & Library
- Search the on-chain Distordia masterdata by name, type, and lifecycle status
- Add components to your internal library (stores address reference only)
- Library entries are resolved live from the chain — always up to date

### Warehouse Pallet Inventory
- Receive, adjust, move, and track physical pallets
- Each pallet references a Distordia masterdata address — no material data stored locally
- Publish pallet assets on-chain for supply chain visibility

### Bill of Materials (BOM)
- Define component relationships for manufactured items
- Multi-level BOM support for complex assemblies
- All references use Distordia asset addresses

### Picking BOM
- Generate picking lists from a product's BOM and an order quantity
- Greedy pallet allocation — system assigns specific pallets per component
- Confirm pick to automatically deduct inventory from pallets
- Publish picking lists on-chain

### Invoicing
- Create multi-line invoices with tax calculation
- Issuing an invoice automatically deducts sold quantities from inventory
- Mark invoices as paid
- Publish invoices on-chain for auditable proof of transaction

### Production Planning (MRP Calculation)
- Calculate material requirements from BOM and planned production
- Shortfall analysis against current inventory
- Procurement recommendations

### On-Chain Asset Management
- Publish material specifications as blockchain assets with standardized `distordia` status
- Query and filter blockchain assets by lifecycle status
- Distordia Status System: 1=Active, 2=Sold Out, 3=Planned, 4=Discontinued, 5=Pending Approval

## Distordia_Standards Asset Formats

All on-chain assets follow the Distordia_Standards specification. They share a common envelope:

```json
{
  "name": "mrp_<type>_<id>",
  "data": {
    "distordia": 1,
    "assetType": "<type>",
    ...
  },
  "format": "JSON"
}
```

### material_master_data (Layer 0)
The global component catalog. Every other asset type references materials by their `material_master_data` asset address.

| Field          | Type   | Description                        |
|----------------|--------|------------------------------------|
| distordia      | number | Lifecycle status (1-5)             |
| assetType      | string | `"material_master_data"`           |
| materialId     | string | Internal identifier                |
| materialName   | string | Human-readable name                |
| description    | string | Detailed description               |
| unit           | string | Unit of measure (kg, pcs, m, etc.) |
| materialType   | string | `raw` / `semi` / `finished`        |
| baseCost       | number | Cost per unit                      |
| currency       | string | Currency code                      |

### warehouse_pallet
Tracks a physical warehouse pallet. References `material_master_data` by address.

| Field          | Type   | Description                           |
|----------------|--------|---------------------------------------|
| distordia      | number | Lifecycle status (1-5)                |
| assetType      | string | `"warehouse_pallet"`                  |
| palletId       | string | Unique pallet identifier              |
| materialId     | string | **Distordia masterdata asset address** |
| quantity       | number | Units on pallet                       |
| unit           | string | Unit of measure                       |
| location       | string | Warehouse location code               |
| palletStatus   | string | available/reserved/picked/shipped/empty |

### sales_invoice
An issued invoice. Line items reference materials by Distordia address.

| Field          | Type   | Description                           |
|----------------|--------|---------------------------------------|
| distordia      | number | Lifecycle status (1-5)                |
| assetType      | string | `"sales_invoice"`                     |
| invoiceNumber  | string | Human-readable invoice number         |
| customer       | string | Customer name                         |
| items          | array  | Line items (materialId = address)     |
| subtotal       | number | Pre-tax total                         |
| tax            | number | Tax amount                            |
| total          | number | Grand total                           |
| status         | string | draft/issued/paid/cancelled           |

### picking_list
A BOM-based picking list for production or shipping.

| Field          | Type   | Description                           |
|----------------|--------|---------------------------------------|
| distordia      | number | Lifecycle status (1-5)                |
| assetType      | string | `"picking_list"`                      |
| productId      | string | Product asset address                 |
| orderQuantity  | number | Units to produce                      |
| lines          | array  | Components with pallet allocations    |
| status         | string | open/picked                           |

## How to test this module

1. Download and install the [latest version of Nexus Wallet](https://github.com/Nexusoft/NexusInterface/releases/latest) if you haven't.
2. Download [this template module's zip file](https://github.com/AkstonCap/MRP/releases/latest).
3. Open Nexus Wallet, go to Settings/Modules, drag and drop the zip file you've downloaded into the "Add module" section and click "Install module" when prompted.
4. After the wallet refreshes, an item for this template module will be added into the bottom navigation bar. Click on it to open the module.

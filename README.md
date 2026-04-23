# MRP Module — Local Vendor Store

A Nexus Wallet Module tailored for a small retail store that continuously
buys products from local vendors, registers them on Nexus in the Distordia
master data (asset address = product ID), tracks stock on-chain, and reports
on income. Invoicing and payment are intentionally out of scope.

Built with React + Redux on top of **Distordia_Standards** as the Layer 0
master data on the Nexus blockchain.

## Architecture — Distordia master data as Layer 0

```
┌──────────────────────────────────────────────────────────┐
│                  Nexus Blockchain                         │
│  ┌────────────────────────────────────────────────────┐  │
│  │  Distordia master data (Layer 0)                   │  │
│  │    material_master_data   — products (address=ID)  │  │
│  │    vendor_master_data     — vendors  (address=ID)  │  │
│  │    stock_balance          — per-product balance    │  │
│  │                             + modifiable price      │  │
│  └────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────┘
        ▲ resolve by address                ▲ publish
        │                                   │
┌──────────────────────────────────────────────────────────┐
│                    MRP Store Module                       │
│  Products    — address-only references to master data     │
│  Vendors     — address-only references to vendor master   │
│  Purchasing  — buy from vendor → increment stock          │
│  Stock       — balance + modifiable price per product     │
│  Check-out   — "scan" + qty → decrement stock, record sale│
│  Income      — aggregated sales report                    │
└──────────────────────────────────────────────────────────┘
```

**Key principle:** the module stores **only asset addresses**. All
product, vendor, and stock details are resolved at query time from the
chain — zero duplication. Every purchase, stock change, and sale ties
back to the same canonical Distordia addresses.

## Store workflows

### 1. Register a vendor
*Vendors tab* → fill in the form → **Publish vendor on-chain**. A
`vendor_master_data` asset is created; its address is the vendor's
permanent unique ID and is added to your vendor list.

### 2. Buy from a vendor (new product)
*Purchasing tab* → mode: **New product from vendor** → pick the vendor,
enter the new product's name/unit/barcode, quantity, unit cost, and an
optional initial sale price.

On submit:
1. A `material_master_data` asset is published on-chain (address becomes
   the product's permanent ID, with a reference to the vendor address).
2. The product is added to your product list.
3. A purchase record is logged and the product's stock balance is
   incremented.
4. If an initial sale price was provided, it is set on the stock balance.

### 3. Buy from a vendor (existing product)
*Purchasing tab* → mode: **Existing product** → pick vendor + product,
enter qty and unit cost. Stock is incremented; a purchase record is
logged.

### 4. Manage stock & price
*Stock tab* — one row per product, keyed by product address. You can:
- Edit the unit sale price inline (source of truth for check-out).
- Manually adjust on-hand (shrinkage, correction, etc.) with a reason.
- **Publish** a `stock_balance` asset on-chain for audit.

### 5. Check out a customer
*Check-out tab* → "scan" (for now: type/paste) a product address,
barcode, or exact name + qty → **Add to cart**. Price is pulled from the
product's stock balance and can be overridden per line. **Complete
check-out** decrements stock for every line, snapshots the sale for the
income report, and updates the stock-balance price if edited.

### 6. Report on income
*Income tab* — revenue, units sold, receipts, and an indicative gross
profit (revenue minus last-known unit cost from purchase records), with a
per-product breakdown. Presets for today / 7 / 30 days / YTD or a custom
date range.

## Distordia_Standards asset formats used by the store

All assets share the common envelope:

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

### `material_master_data` — product catalog (Layer 0)

| Field           | Type   | Description                            |
|-----------------|--------|----------------------------------------|
| distordia       | number | Lifecycle status (1-5)                 |
| assetType       | string | `"material_master_data"`               |
| materialId      | string | Internal identifier                    |
| materialName    | string | Product name                           |
| description     | string | Details                                |
| unit            | string | Unit of measure (pcs, kg, L, …)        |
| materialType    | string | `raw` / `semi` / `finished`            |
| baseCost        | number | Last known purchase cost per unit      |
| currency        | string | Currency code                          |
| vendorAddress   | string | Distordia `vendor_master_data` address |
| vendorName      | string | Vendor name (snapshot)                 |
| barcode         | string | Optional barcode for check-out lookup  |

### `vendor_master_data` — vendor catalog (Layer 0)

| Field       | Type   | Description                    |
|-------------|--------|--------------------------------|
| distordia   | number | Lifecycle status (1-5)         |
| assetType   | string | `"vendor_master_data"`         |
| vendorId    | string | Internal identifier            |
| vendorName  | string | Vendor name                    |
| contact     | string | Contact person                 |
| email       | string |                                |
| phone       | string |                                |
| location    | string | City / address                 |
| notes       | string |                                |

### `stock_balance` — per-product balance + price

One asset per product, referenced by `productAddress`.

| Field           | Type   | Description                              |
|-----------------|--------|------------------------------------------|
| distordia       | number | Lifecycle status (1-5)                   |
| assetType       | string | `"stock_balance"`                        |
| productAddress  | string | `material_master_data` asset address     |
| productName     | string | Snapshot for display                     |
| quantity        | number | Units on hand                            |
| unit            | string | Unit of measure                          |
| unitPrice       | number | **Modifiable** sale price per unit       |
| currency        | string | Currency code                            |
| location        | string | Physical location (optional)             |
| lastMovementAt  | string | ISO timestamp of last movement           |

## Legacy manufacturing modules

The repo still contains the original manufacturing features (BOM,
warehouse pallets, picking lists, invoicing, production planning). They
are hidden in store mode. Flip `SHOW_LEGACY_MANUFACTURING` in
`src/components/MRPInterface.js` to re-enable their tabs.

Additional architecture docs:

- `docs/chain-assets-architecture.md`
- `docs/state-machines.md`
- `docs/store-mode.md`

## How to run the module

1. Install the [latest Nexus Wallet](https://github.com/Nexusoft/NexusInterface/releases/latest).
2. Download the latest [MRP release zip](https://github.com/AkstonCap/MRP/releases/latest)
   (or build locally with `npm run build` and zip `dist/` + `nxs_package.json`).
3. In Nexus Wallet open *Settings → Modules*, drag the zip into **Add
   module**, click **Install module**.
4. Open the module from the bottom nav bar.

## Development

```
npm install
npm run dev        # webpack dev server
npm run build      # production bundle in dist/
```

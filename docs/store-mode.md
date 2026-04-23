# Store Mode — Local Vendor Setup

This document describes the module's store configuration: a small retail
operation that buys products from local vendors and resells them.

## Scope

In:
- Vendor master data on Nexus (`vendor_master_data`)
- Product master data on Nexus (`material_master_data`) — address = permanent product ID
- Stock balance per product, on-chain (`stock_balance`), with modifiable unit price
- Purchase log from vendors (increments stock)
- Check-out flow (scan product + quantity, decrements stock, records sale)
- Income report (revenue + indicative gross profit)

Out (explicitly):
- Invoicing and payments
- Manufacturing BOM / picking (legacy modules are kept in the build but hidden)
- Hardware barcode scanner integration — for now the check-out view accepts
  manual entry of asset address, barcode, or exact product name

## Redux state (store mode)

```
state.mrp
├── chainAssets        // cached on-chain assets (read-through)
├── componentLibrary   // [{ address, addedAt }] → products
├── vendors            // [{ address, addedAt }] → vendor master data
├── stockBalances      // { [productAddress]: {quantity, unitPrice, currency, unit,
│                      //                      stockAssetAddress?, movements[]} }
├── purchases          // [{ id, timestamp, vendorAddress, productAddress,
│                      //    quantity, unit, unitCost, currency, reference }]
├── sales              // [{ id, timestamp, productAddress, quantity, unit,
│                      //    unitPrice, currency, total, reference, expediter }]
└── activeTab          // 'products' | 'vendors' | 'purchasing' | 'stock' |
                       // 'checkout' | 'income'
```

All on-chain references are asset addresses. The reducers never duplicate
master data — details come from `chainAssets` at query time.

## Asset lifecycle

```
vendor_master_data  →  created once per vendor  (Vendors tab)
                            ▼
material_master_data →  created once per product (Purchasing tab, new-product mode)
                            ▼
stock_balance        →  created/updated per product (Stock tab "Publish")
                            ▼
  purchases  (increment local stock balance + cost history)
  sales      (decrement local stock balance + income ledger)
```

The on-chain `stock_balance` asset is a snapshot for audit purposes;
real-time balance is maintained in the Redux store and can be re-published
on demand.

## Tab → Component map

| Tab         | Component                       |
|-------------|---------------------------------|
| Products    | `src/components/ComponentSearch.js` |
| Vendors     | `src/components/Vendors.js`         |
| Purchasing  | `src/components/Purchasing.js`      |
| Stock       | `src/components/Stock.js`           |
| Check-out   | `src/components/Checkout.js`        |
| Income      | `src/components/IncomeReport.js`    |

## Check-out price resolution

1. Scan value is matched against, in order:
   - product asset address (exact)
   - barcode (exact)
   - product name (exact, case-insensitive)
2. Matched product's `stockBalances[address].unitPrice` is used as the line
   price.
3. The expediter can override the line price before completing check-out.
   An override updates the stock balance so the new price sticks.

## Gross profit in the income report

Gross profit is indicative only: `revenue − quantity × last_known_unit_cost`.
The unit cost comes from the most recent purchase for that product; it is
not an accounting FIFO/LIFO figure.

## Re-enabling legacy manufacturing tabs

`src/components/MRPInterface.js` has `SHOW_LEGACY_MANUFACTURING = false`.
Flip to `true` to bring back the Warehouse / BOM / Picking / Invoicing /
Planning tabs and their original components.

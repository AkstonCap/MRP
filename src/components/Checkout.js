import { useMemo, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import styled from '@emotion/styled';
import {
  Button,
  TextField,
  showSuccessDialog,
  showErrorDialog,
} from 'nexus-module';

import {
  recordSale,
  adjustStockBalance,
  setStockPrice,
} from 'actions/actionCreators';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHeaderCell,
  TableCell,
} from './StyledTable';
import {
  getAllMaterials,
} from '../utils/materialReferenceManager';

const Section = styled.div({ marginTop: '10px' });

const ScanRow = styled.div({
  display: 'grid',
  gridTemplateColumns: '2fr 1fr auto',
  gap: '10px',
  marginBottom: '15px',
  padding: '15px',
  border: '1px solid #ccc',
  borderRadius: '5px',
});

const Totals = styled.div(({ theme }) => ({
  marginTop: '15px',
  padding: '15px',
  backgroundColor: theme.mixer ? theme.mixer(0.0625) : '#f5f5f5',
  borderRadius: '5px',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  fontSize: '18px',
  fontWeight: 'bold',
}));

const PriceInput = styled.input({
  width: 80,
  padding: '4px 6px',
});

export default function Checkout() {
  const dispatch = useDispatch();
  const chainAssets = useSelector((state) => state.mrp.chainAssets || []);
  const componentLibrary = useSelector((state) => state.mrp.componentLibrary || []);
  const localMaterials = useSelector((state) => state.mrp.materials);
  const stockBalances = useSelector((state) => state.mrp.stockBalances || {});
  const sales = useSelector((state) => state.mrp.sales || []);

  const products = useMemo(
    () => getAllMaterials(chainAssets, localMaterials, componentLibrary),
    [chainAssets, localMaterials, componentLibrary]
  );

  // Index by address, barcode, lowercase name — supports manual "scan"
  const productIndex = useMemo(() => {
    const idx = { byAddr: {}, byBarcode: {}, byName: {} };
    products.forEach((p) => {
      const addr = p.address || p.id;
      if (addr) idx.byAddr[addr] = p;
      const barcode = p.barcode || p.parsedData?.barcode;
      if (barcode) idx.byBarcode[barcode] = p;
      if (p.name) idx.byName[p.name.toLowerCase()] = p;
    });
    return idx;
  }, [products]);

  const [scanValue, setScanValue] = useState('');
  const [scanQty, setScanQty] = useState('1');
  const [cart, setCart] = useState([]); // [{ productAddress, name, unit, unitPrice, currency, quantity }]
  const [expediter, setExpediter] = useState('');

  const findProduct = (raw) => {
    if (!raw) return null;
    const v = raw.trim();
    return (
      productIndex.byAddr[v] ||
      productIndex.byBarcode[v] ||
      productIndex.byName[v.toLowerCase()] ||
      null
    );
  };

  const handleScan = () => {
    const product = findProduct(scanValue);
    if (!product) {
      showErrorDialog({
        message: 'Product not found',
        note: 'Enter a product asset address, barcode, or exact name.',
      });
      return;
    }
    const addr = product.address || product.id;
    const sb = stockBalances[addr];
    if (!sb || !sb.unitPrice || Number(sb.unitPrice) <= 0) {
      showErrorDialog({
        message: `No sale price set for "${product.name}"`,
        note: 'Set a price on the stock balance before selling.',
      });
      return;
    }
    const qty = Number(scanQty);
    if (!qty || qty <= 0) {
      showErrorDialog({ message: 'Quantity must be greater than zero' });
      return;
    }
    if (Number(sb.quantity) < qty) {
      showErrorDialog({
        message: `Insufficient stock for "${product.name}"`,
        note: `On hand: ${sb.quantity} ${sb.unit || product.unit || ''}`,
      });
      return;
    }

    setCart((prev) => {
      const existing = prev.find((l) => l.productAddress === addr);
      if (existing) {
        return prev.map((l) =>
          l.productAddress === addr
            ? { ...l, quantity: Number(l.quantity) + qty }
            : l
        );
      }
      return [
        ...prev,
        {
          productAddress: addr,
          name: product.name,
          unit: sb.unit || product.unit || 'pcs',
          unitPrice: Number(sb.unitPrice),
          currency: sb.currency || 'USD',
          quantity: qty,
        },
      ];
    });

    setScanValue('');
    setScanQty('1');
  };

  const updateLinePrice = (productAddress, newPrice) => {
    const v = Number(newPrice);
    if (!Number.isFinite(v) || v < 0) return;
    setCart((prev) =>
      prev.map((l) =>
        l.productAddress === productAddress ? { ...l, unitPrice: v } : l
      )
    );
  };

  const removeLine = (productAddress) =>
    setCart((prev) => prev.filter((l) => l.productAddress !== productAddress));

  const cartTotal = cart.reduce(
    (t, l) => t + Number(l.quantity) * Number(l.unitPrice),
    0
  );
  const cartCurrency = cart[0]?.currency || 'USD';

  const handleComplete = () => {
    if (cart.length === 0) {
      showErrorDialog({ message: 'Cart is empty' });
      return;
    }

    // Final stock check (someone may have edited prices but not qty)
    for (const line of cart) {
      const sb = stockBalances[line.productAddress];
      if (!sb || Number(sb.quantity) < Number(line.quantity)) {
        showErrorDialog({
          message: `Insufficient stock for "${line.name}"`,
          note: `On hand: ${sb ? sb.quantity : 0}`,
        });
        return;
      }
    }

    const receiptRef = `r_${Date.now()}`;
    const ts = new Date().toISOString();

    cart.forEach((line) => {
      const sb = stockBalances[line.productAddress];
      const snapshotPrice = Number(line.unitPrice);
      if (sb && Number(sb.unitPrice) !== snapshotPrice) {
        dispatch(
          setStockPrice(line.productAddress, snapshotPrice, line.currency)
        );
      }
      dispatch(
        recordSale({
          id: `s_${Date.now()}_${line.productAddress.slice(-6)}`,
          timestamp: ts,
          productAddress: line.productAddress,
          productName: line.name,
          quantity: Number(line.quantity),
          unit: line.unit,
          unitPrice: snapshotPrice,
          currency: line.currency,
          total: Number(line.quantity) * snapshotPrice,
          reference: receiptRef,
          expediter,
        })
      );
      dispatch(
        adjustStockBalance(line.productAddress, -Number(line.quantity), {
          timestamp: ts,
          kind: 'sale',
          ref: receiptRef,
        })
      );
    });

    showSuccessDialog({
      message: 'Check-out complete',
      note: `Receipt ${receiptRef}\nTotal: ${cartTotal.toFixed(2)} ${cartCurrency}`,
    });
    setCart([]);
    setExpediter(expediter); // preserve
  };

  const recentSales = [...sales].slice(-10).reverse();

  return (
    <Section>
      <h3>Check-out</h3>
      <p>
        Scan or enter products to build a receipt. The price comes from each
        product's on-chain stock balance (editable per line). Completing the
        check-out decrements stock and records the sale for the income report.
      </p>

      <div style={{ marginBottom: '10px' }}>
        <TextField
          label="Expediter"
          value={expediter}
          onChange={(e) => setExpediter(e.target.value)}
          placeholder="Store assistant name"
        />
      </div>

      <ScanRow>
        <TextField
          label="Scan / enter product"
          value={scanValue}
          onChange={(e) => setScanValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleScan();
          }}
          placeholder="Asset address, barcode, or exact name"
          autoFocus
        />
        <TextField
          label="Qty"
          type="number"
          value={scanQty}
          onChange={(e) => setScanQty(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleScan();
          }}
        />
        <Button onClick={handleScan}>Add to cart</Button>
      </ScanRow>

      <h4>Cart ({cart.length} line{cart.length === 1 ? '' : 's'})</h4>
      {cart.length === 0 ? (
        <p style={{ color: '#888', fontSize: 14 }}>Cart is empty.</p>
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHeaderCell>Product</TableHeaderCell>
                <TableHeaderCell>Qty</TableHeaderCell>
                <TableHeaderCell>Unit price</TableHeaderCell>
                <TableHeaderCell>Line total</TableHeaderCell>
                <TableHeaderCell>Actions</TableHeaderCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cart.map((line) => (
                <TableRow key={line.productAddress}>
                  <TableCell>{line.name}</TableCell>
                  <TableCell>
                    {line.quantity} {line.unit}
                  </TableCell>
                  <TableCell>
                    <PriceInput
                      type="number"
                      step="0.01"
                      value={line.unitPrice}
                      onChange={(e) =>
                        updateLinePrice(line.productAddress, e.target.value)
                      }
                    />{' '}
                    {line.currency}
                  </TableCell>
                  <TableCell>
                    {(Number(line.quantity) * Number(line.unitPrice)).toFixed(2)}{' '}
                    {line.currency}
                  </TableCell>
                  <TableCell>
                    <Button
                      size="small"
                      skin="danger"
                      onClick={() => removeLine(line.productAddress)}
                    >
                      Remove
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <Totals>
            <span>Total</span>
            <span>
              {cartTotal.toFixed(2)} {cartCurrency}
            </span>
          </Totals>

          <div style={{ marginTop: '15px', textAlign: 'right' }}>
            <Button onClick={handleComplete}>Complete check-out</Button>
          </div>
        </>
      )}

      <h4 style={{ marginTop: '30px' }}>Recent sales</h4>
      {recentSales.length === 0 ? (
        <p style={{ color: '#888', fontSize: 14 }}>No sales recorded yet.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHeaderCell>When</TableHeaderCell>
              <TableHeaderCell>Product</TableHeaderCell>
              <TableHeaderCell>Qty</TableHeaderCell>
              <TableHeaderCell>Unit price</TableHeaderCell>
              <TableHeaderCell>Total</TableHeaderCell>
              <TableHeaderCell>Receipt</TableHeaderCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {recentSales.map((s) => (
              <TableRow key={s.id}>
                <TableCell>{new Date(s.timestamp).toLocaleString()}</TableCell>
                <TableCell>{s.productName}</TableCell>
                <TableCell>
                  {s.quantity} {s.unit}
                </TableCell>
                <TableCell>
                  {Number(s.unitPrice).toFixed(2)} {s.currency}
                </TableCell>
                <TableCell>
                  {Number(s.total).toFixed(2)} {s.currency}
                </TableCell>
                <TableCell>{s.reference}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </Section>
  );
}

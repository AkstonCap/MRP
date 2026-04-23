import { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import styled from '@emotion/styled';
import {
  Button,
  TextField,
  showSuccessDialog,
  showErrorDialog,
  apiCall,
} from 'nexus-module';

import {
  recordPurchase,
  adjustStockBalance,
  setStockPrice,
  addToLibrary,
  addChainAsset,
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
  ASSET_TYPES,
  createMaterialAssetTemplate,
} from '../utils/distordiaStandards';
import {
  getAllMaterials,
  getVendorFromReference,
  resolveVendorLibrary,
} from '../utils/materialReferenceManager';

const Section = styled.div({ marginTop: '10px' });

const FormGrid = styled.div({
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
  gap: '12px',
  marginBottom: '20px',
  padding: '15px',
  border: '1px solid #ccc',
  borderRadius: '5px',
});

const ModeTabs = styled.div({
  display: 'flex',
  gap: '8px',
  marginBottom: '12px',
});

const ModeTab = styled.button(({ active, theme }) => ({
  padding: '6px 12px',
  border: `1px solid ${theme.mixer ? theme.mixer(0.25) : '#aaa'}`,
  backgroundColor: active ? theme.primary : 'transparent',
  color: active ? theme.primaryAccent : theme.foreground,
  cursor: 'pointer',
  borderRadius: '4px',
  fontSize: '12px',
}));

const AddressCell = styled.span({
  fontFamily: 'monospace',
  fontSize: '11px',
  opacity: 0.7,
});

const truncAddr = (addr) =>
  addr ? `${addr.substring(0, 8)}…${addr.substring(addr.length - 6)}` : '—';

export default function Purchasing() {
  const dispatch = useDispatch();
  const userStatus = useSelector((state) => state.nexus.userStatus);
  const chainAssets = useSelector((state) => state.mrp.chainAssets || []);
  const componentLibrary = useSelector((state) => state.mrp.componentLibrary || []);
  const localMaterials = useSelector((state) => state.mrp.materials);
  const vendors = useSelector((state) => state.mrp.vendors || []);
  const stockBalances = useSelector((state) => state.mrp.stockBalances || {});
  const purchases = useSelector((state) => state.mrp.purchases || []);

  const resolvedVendors = resolveVendorLibrary(vendors, chainAssets);
  const products = getAllMaterials(chainAssets, localMaterials, componentLibrary);

  const [mode, setMode] = useState('existing'); // 'existing' | 'new'

  const [form, setForm] = useState({
    vendorAddress: '',
    productAddress: '',
    quantity: '',
    unit: 'pcs',
    unitCost: '',
    currency: 'USD',
    reference: '',
    notes: '',
    // new-product fields
    newProductName: '',
    newProductDescription: '',
    newProductUnit: 'pcs',
    newProductBarcode: '',
    initialSalePrice: '',
  });
  const [busy, setBusy] = useState(false);

  const resetForm = () =>
    setForm({
      vendorAddress: '',
      productAddress: '',
      quantity: '',
      unit: 'pcs',
      unitCost: '',
      currency: 'USD',
      reference: '',
      notes: '',
      newProductName: '',
      newProductDescription: '',
      newProductUnit: 'pcs',
      newProductBarcode: '',
      initialSalePrice: '',
    });

  const recordReceipt = (productAddress, productName, unit) => {
    const qty = Number(form.quantity);
    const cost = Number(form.unitCost) || 0;
    const timestamp = new Date().toISOString();

    const purchase = {
      id: `p_${Date.now()}`,
      timestamp,
      vendorAddress: form.vendorAddress,
      productAddress,
      productName,
      quantity: qty,
      unit: unit || form.unit,
      unitCost: cost,
      currency: form.currency,
      reference: form.reference,
      notes: form.notes,
    };

    dispatch(recordPurchase(purchase));
    dispatch(
      adjustStockBalance(productAddress, qty, {
        timestamp,
        kind: 'purchase',
        ref: purchase.id,
      })
    );

    if (form.initialSalePrice && Number(form.initialSalePrice) > 0) {
      dispatch(
        setStockPrice(
          productAddress,
          Number(form.initialSalePrice),
          form.currency
        )
      );
    }
  };

  const handleSubmitExisting = () => {
    if (!form.vendorAddress) {
      showErrorDialog({ message: 'Select a vendor' });
      return;
    }
    if (!form.productAddress) {
      showErrorDialog({ message: 'Select a product' });
      return;
    }
    if (!form.quantity || Number(form.quantity) <= 0) {
      showErrorDialog({ message: 'Quantity must be greater than zero' });
      return;
    }
    const product = products.find(
      (p) => (p.address || p.id) === form.productAddress
    );
    recordReceipt(form.productAddress, product?.name || '', product?.unit);
    showSuccessDialog({
      message: 'Purchase recorded',
      note: `+${form.quantity} ${product?.unit || form.unit} of ${
        product?.name || 'product'
      } on hand`,
    });
    resetForm();
  };

  const handleSubmitNew = async () => {
    if (!userStatus) {
      showErrorDialog({ message: 'Please log in to publish a new product on-chain' });
      return;
    }
    if (!form.vendorAddress) {
      showErrorDialog({ message: 'Select a vendor' });
      return;
    }
    if (!form.newProductName.trim()) {
      showErrorDialog({ message: 'New product name is required' });
      return;
    }
    if (!form.quantity || Number(form.quantity) <= 0) {
      showErrorDialog({ message: 'Quantity must be greater than zero' });
      return;
    }

    try {
      setBusy(true);
      const vendor = getVendorFromReference(form.vendorAddress, chainAssets);
      const template = createMaterialAssetTemplate({
        materialId: `m_${Date.now()}`,
        materialName: form.newProductName,
        description: form.newProductDescription,
        unit: form.newProductUnit,
        materialType: 'finished',
        baseCost: Number(form.unitCost) || 0,
        currency: form.currency,
        vendorAddress: form.vendorAddress,
        vendorName: vendor?.name || '',
        barcode: form.newProductBarcode,
      });
      const result = await apiCall('assets/create/asset', {
        name: template.name,
        data: template.data,
        format: template.format,
      });
      const address = result?.address;
      if (!address) {
        showErrorDialog({
          message: 'Product was submitted but no address returned',
          note: 'Cannot update stock without the product address. Refresh chain assets and retry.',
        });
        return;
      }

      dispatch(
        addChainAsset({
          address,
          name: template.name,
          data: template.data,
          parsedData: JSON.parse(template.data),
          assetType: ASSET_TYPES.MATERIAL,
          distordiaStatus: JSON.parse(template.data).distordia,
        })
      );
      dispatch(addToLibrary({ address }));

      recordReceipt(address, form.newProductName, form.newProductUnit);

      showSuccessDialog({
        message: 'New product published & purchase recorded',
        note: `Address: ${address}`,
      });
      resetForm();
    } catch (e) {
      showErrorDialog({
        message: 'Failed to publish new product',
        note: e?.message || '',
      });
    } finally {
      setBusy(false);
    }
  };

  const recentPurchases = [...purchases].slice(-20).reverse();

  return (
    <Section>
      <h3>Purchasing / Receiving</h3>
      <p>
        Record a buy from a local vendor. Existing products: pick from your
        library and increment stock. New products: publish a{' '}
        <code>material_master_data</code> asset on-chain first — its address
        becomes the permanent product ID — then stock is incremented.
      </p>

      <ModeTabs>
        <ModeTab active={mode === 'existing'} onClick={() => setMode('existing')}>
          Existing product
        </ModeTab>
        <ModeTab active={mode === 'new'} onClick={() => setMode('new')}>
          New product from vendor
        </ModeTab>
      </ModeTabs>

      <FormGrid>
        <div>
          <label style={{ fontSize: 12 }}>Vendor *</label>
          <select
            value={form.vendorAddress}
            onChange={(e) => setForm({ ...form, vendorAddress: e.target.value })}
            style={{ padding: '8px', width: '100%' }}
          >
            <option value="">Select vendor</option>
            {resolvedVendors.map((v) => (
              <option key={v.address} value={v.address}>
                {v.name} {v.location ? `— ${v.location}` : ''}
              </option>
            ))}
          </select>
        </div>

        {mode === 'existing' ? (
          <div>
            <label style={{ fontSize: 12 }}>Product *</label>
            <select
              value={form.productAddress}
              onChange={(e) => setForm({ ...form, productAddress: e.target.value })}
              style={{ padding: '8px', width: '100%' }}
            >
              <option value="">Select product</option>
              {products.map((p) => {
                const key = p.address || p.id;
                return (
                  <option key={key} value={key}>
                    {p.name} ({p.unit})
                  </option>
                );
              })}
            </select>
          </div>
        ) : (
          <>
            <TextField
              label="New Product Name *"
              value={form.newProductName}
              onChange={(e) =>
                setForm({ ...form, newProductName: e.target.value })
              }
            />
            <TextField
              label="Description"
              value={form.newProductDescription}
              onChange={(e) =>
                setForm({ ...form, newProductDescription: e.target.value })
              }
            />
            <TextField
              label="Unit"
              value={form.newProductUnit}
              onChange={(e) =>
                setForm({ ...form, newProductUnit: e.target.value })
              }
              placeholder="pcs, kg, L, …"
            />
            <TextField
              label="Barcode (optional)"
              value={form.newProductBarcode}
              onChange={(e) =>
                setForm({ ...form, newProductBarcode: e.target.value })
              }
            />
            <TextField
              label="Initial sale price"
              type="number"
              value={form.initialSalePrice}
              onChange={(e) =>
                setForm({ ...form, initialSalePrice: e.target.value })
              }
              placeholder="per unit"
            />
          </>
        )}

        <TextField
          label="Quantity received *"
          type="number"
          value={form.quantity}
          onChange={(e) => setForm({ ...form, quantity: e.target.value })}
        />
        <TextField
          label="Unit cost"
          type="number"
          value={form.unitCost}
          onChange={(e) => setForm({ ...form, unitCost: e.target.value })}
          placeholder="per unit"
        />
        <TextField
          label="Currency"
          value={form.currency}
          onChange={(e) => setForm({ ...form, currency: e.target.value })}
        />
        <TextField
          label="Reference"
          value={form.reference}
          onChange={(e) => setForm({ ...form, reference: e.target.value })}
          placeholder="Vendor receipt #"
        />
        <TextField
          label="Notes"
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
        />
        <Button
          onClick={mode === 'existing' ? handleSubmitExisting : handleSubmitNew}
          disabled={busy}
        >
          {busy ? 'Publishing…' : 'Record purchase'}
        </Button>
      </FormGrid>

      <h4>Recent purchases</h4>
      {recentPurchases.length === 0 ? (
        <p style={{ color: '#888', fontSize: 14 }}>No purchases recorded yet.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHeaderCell>When</TableHeaderCell>
              <TableHeaderCell>Vendor</TableHeaderCell>
              <TableHeaderCell>Product</TableHeaderCell>
              <TableHeaderCell>Qty</TableHeaderCell>
              <TableHeaderCell>Unit cost</TableHeaderCell>
              <TableHeaderCell>Total</TableHeaderCell>
              <TableHeaderCell>Ref</TableHeaderCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {recentPurchases.map((p) => {
              const v = getVendorFromReference(p.vendorAddress, chainAssets);
              const sb = stockBalances[p.productAddress];
              const total = (Number(p.quantity) || 0) * (Number(p.unitCost) || 0);
              return (
                <TableRow key={p.id}>
                  <TableCell>{new Date(p.timestamp).toLocaleString()}</TableCell>
                  <TableCell>{v?.name || truncAddr(p.vendorAddress)}</TableCell>
                  <TableCell>
                    {p.productName || truncAddr(p.productAddress)}{' '}
                    <AddressCell>({truncAddr(p.productAddress)})</AddressCell>
                  </TableCell>
                  <TableCell>
                    {p.quantity} {p.unit || sb?.unit || ''}
                  </TableCell>
                  <TableCell>
                    {(Number(p.unitCost) || 0).toFixed(2)} {p.currency}
                  </TableCell>
                  <TableCell>
                    {total.toFixed(2)} {p.currency}
                  </TableCell>
                  <TableCell>{p.reference || '-'}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}
    </Section>
  );
}

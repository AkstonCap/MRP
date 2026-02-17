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

import { addInvoice, updateInvoice, addInventoryTransaction } from 'actions/actionCreators';
import { Table, TableHeader, TableBody, TableRow, TableHeaderCell, TableCell } from './StyledTable';
import { getAllMaterials, getMaterialDisplayName } from '../utils/materialReferenceManager';
import {
  INVOICE_STATUS,
  createInvoiceAssetTemplate,
} from '../utils/distordiaStandards';

const FormContainer = styled.div({
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
  gap: '12px',
  marginBottom: '15px',
  padding: '15px',
  border: '1px solid #ccc',
  borderRadius: '5px',
});

const LineItemRow = styled.div({
  display: 'grid',
  gridTemplateColumns: '2fr 1fr 1fr 1fr auto',
  gap: '8px',
  alignItems: 'center',
  marginBottom: '8px',
});

const InvoiceBox = styled.div(({ theme }) => ({
  padding: '20px',
  border: `1px solid ${theme.mixer ? theme.mixer(0.125) : '#ddd'}`,
  borderRadius: '5px',
  marginBottom: '20px',
  backgroundColor: theme.mixer ? theme.mixer(0.03125) : '#fafafa',
}));

const StatusBadge = styled.span(({ status }) => {
  const colors = {
    [INVOICE_STATUS.DRAFT]: { bg: '#e2e3e5', color: '#383d41' },
    [INVOICE_STATUS.ISSUED]: { bg: '#cce5ff', color: '#004085' },
    [INVOICE_STATUS.PAID]: { bg: '#d4edda', color: '#155724' },
    [INVOICE_STATUS.CANCELLED]: { bg: '#f8d7da', color: '#721c24' },
  };
  const c = colors[status] || colors[INVOICE_STATUS.DRAFT];
  return {
    padding: '3px 8px',
    borderRadius: '10px',
    fontSize: '11px',
    fontWeight: 'bold',
    backgroundColor: c.bg,
    color: c.color,
  };
});

export default function Invoicing() {
  const dispatch = useDispatch();
  const userStatus = useSelector((state) => state.nexus.userStatus);
  const invoices = useSelector((state) => state.mrp.invoices || []);
  const localMaterials = useSelector((state) => state.mrp.materials);
  const chainAssets = useSelector((state) => state.mrp.chainAssets || []);
  const inventory = useSelector((state) => state.mrp.inventory);

  const materials = getAllMaterials(chainAssets, localMaterials);

  const [customer, setCustomer] = useState('');
  const [notes, setNotes] = useState('');
  const [taxRate, setTaxRate] = useState('0');
  const [lineItems, setLineItems] = useState([
    { materialId: '', quantity: '', unitPrice: '' },
  ]);

  // ─── Line Item Helpers ──────────────────────────────────────────────────────

  const updateLineItem = (index, field, value) => {
    const updated = [...lineItems];
    updated[index] = { ...updated[index], [field]: value };

    // Auto-fill unit price from material cost
    if (field === 'materialId' && value) {
      const mat = materials.find((m) => (m.address || m.id) === value);
      if (mat && !updated[index].unitPrice) {
        updated[index].unitPrice = String(mat.cost || 0);
      }
    }

    setLineItems(updated);
  };

  const addLineItem = () => {
    setLineItems([...lineItems, { materialId: '', quantity: '', unitPrice: '' }]);
  };

  const removeLineItem = (index) => {
    if (lineItems.length <= 1) return;
    setLineItems(lineItems.filter((_, i) => i !== index));
  };

  const getSubtotal = () => {
    return lineItems.reduce((sum, li) => {
      const q = parseFloat(li.quantity) || 0;
      const p = parseFloat(li.unitPrice) || 0;
      return sum + q * p;
    }, 0);
  };

  // ─── Create Invoice ─────────────────────────────────────────────────────────

  const handleCreateInvoice = () => {
    if (!customer.trim()) {
      showErrorDialog({ message: 'Customer name is required' });
      return;
    }

    const validLines = lineItems.filter(
      (li) => li.materialId && li.quantity && li.unitPrice
    );
    if (validLines.length === 0) {
      showErrorDialog({ message: 'Add at least one line item' });
      return;
    }

    const subtotal = getSubtotal();
    const tax = subtotal * (parseFloat(taxRate) / 100);
    const total = subtotal + tax;
    const invoiceNumber = `INV-${Date.now().toString(36).toUpperCase()}`;

    const items = validLines.map((li) => {
      const mat = materials.find((m) => (m.address || m.id) === li.materialId);
      return {
        materialId: li.materialId,
        materialName: mat ? mat.name : li.materialId,
        unit: mat ? mat.unit : 'pcs',
        quantity: parseFloat(li.quantity),
        unitPrice: parseFloat(li.unitPrice),
        lineTotal: parseFloat(li.quantity) * parseFloat(li.unitPrice),
      };
    });

    const invoice = {
      id: invoiceNumber,
      invoiceNumber,
      customer: customer.trim(),
      items,
      subtotal,
      taxRate: parseFloat(taxRate),
      tax,
      total,
      currency: 'USD',
      status: INVOICE_STATUS.ISSUED,
      issuedAt: new Date().toISOString(),
      dueDate: '',
      notes: notes.trim(),
    };

    dispatch(addInvoice(invoice));

    // Deduct inventory for each line item (sales issue)
    items.forEach((item) => {
      dispatch(
        addInventoryTransaction({
          materialId: item.materialId,
          transaction: {
            id: `txn_sale_${Date.now()}_${item.materialId}`,
            materialId: item.materialId,
            quantity: -item.quantity,
            type: 'issue',
            reference: `Sale ${invoiceNumber}`,
            timestamp: new Date().toISOString(),
          },
        })
      );
    });

    // Reset form
    setCustomer('');
    setNotes('');
    setTaxRate('0');
    setLineItems([{ materialId: '', quantity: '', unitPrice: '' }]);
    showSuccessDialog({ message: `Invoice ${invoiceNumber} issued — total $${total.toFixed(2)}` });
  };

  // ─── Mark as Paid ───────────────────────────────────────────────────────────

  const markPaid = (invoiceId) => {
    dispatch(updateInvoice(invoiceId, { status: INVOICE_STATUS.PAID }));
    showSuccessDialog({ message: 'Invoice marked as paid' });
  };

  // ─── Publish Invoice On-Chain ───────────────────────────────────────────────

  const publishInvoice = async (invoice) => {
    if (!userStatus) {
      showErrorDialog({ message: 'Log in to Nexus Wallet to publish invoices on-chain' });
      return;
    }
    try {
      const template = createInvoiceAssetTemplate(invoice);
      await apiCall('register/create/asset', template);
      showSuccessDialog({ message: `Invoice ${invoice.invoiceNumber} published on-chain` });
    } catch (error) {
      showErrorDialog({ message: 'Failed to publish invoice on-chain' });
    }
  };

  return (
    <div>
      <h3>Invoicing</h3>
      <p>
        Create invoices when selling goods. Issuing an invoice automatically
        deducts sold quantities from inventory.
      </p>

      {/* Create Invoice Form */}
      <h4>New Invoice</h4>
      <FormContainer>
        <TextField
          label="Customer"
          value={customer}
          onChange={(e) => setCustomer(e.target.value)}
          placeholder="Customer name"
        />
        <TextField
          label="Tax Rate (%)"
          type="number"
          value={taxRate}
          onChange={(e) => setTaxRate(e.target.value)}
          placeholder="0"
        />
        <TextField
          label="Notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Optional notes"
        />
      </FormContainer>

      <h4>Line Items</h4>
      {lineItems.map((li, idx) => (
        <LineItemRow key={idx}>
          <select
            value={li.materialId}
            onChange={(e) => updateLineItem(idx, 'materialId', e.target.value)}
            style={{ padding: '8px' }}
          >
            <option value="">Select Item</option>
            {materials.map((m) => {
              const key = m.address || m.id;
              return (
                <option key={key} value={key}>
                  {getMaterialDisplayName(m)}
                </option>
              );
            })}
          </select>
          <TextField
            label="Qty"
            type="number"
            value={li.quantity}
            onChange={(e) => updateLineItem(idx, 'quantity', e.target.value)}
            placeholder="0"
          />
          <TextField
            label="Unit Price"
            type="number"
            value={li.unitPrice}
            onChange={(e) => updateLineItem(idx, 'unitPrice', e.target.value)}
            placeholder="0.00"
          />
          <div style={{ fontSize: '14px', textAlign: 'right' }}>
            ${((parseFloat(li.quantity) || 0) * (parseFloat(li.unitPrice) || 0)).toFixed(2)}
          </div>
          <Button
            size="small"
            skin="danger"
            onClick={() => removeLineItem(idx)}
            disabled={lineItems.length <= 1}
          >
            X
          </Button>
        </LineItemRow>
      ))}

      <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
        <Button size="small" onClick={addLineItem}>
          + Add Line
        </Button>
      </div>

      <div
        style={{
          textAlign: 'right',
          padding: '10px',
          borderTop: '1px solid #ccc',
          marginBottom: '15px',
        }}
      >
        <div>Subtotal: <strong>${getSubtotal().toFixed(2)}</strong></div>
        <div>
          Tax ({taxRate}%): <strong>${(getSubtotal() * (parseFloat(taxRate) / 100)).toFixed(2)}</strong>
        </div>
        <div style={{ fontSize: '18px', marginTop: '5px' }}>
          Total:{' '}
          <strong>
            ${(getSubtotal() * (1 + parseFloat(taxRate) / 100)).toFixed(2)}
          </strong>
        </div>
      </div>

      <Button onClick={handleCreateInvoice}>Issue Invoice</Button>

      {/* Invoice History */}
      {invoices.length > 0 && (
        <>
          <h4 style={{ marginTop: '30px' }}>Invoice History ({invoices.length})</h4>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHeaderCell>Invoice #</TableHeaderCell>
                <TableHeaderCell>Customer</TableHeaderCell>
                <TableHeaderCell>Items</TableHeaderCell>
                <TableHeaderCell>Total</TableHeaderCell>
                <TableHeaderCell>Status</TableHeaderCell>
                <TableHeaderCell>Issued</TableHeaderCell>
                <TableHeaderCell>Actions</TableHeaderCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.map((inv) => (
                <TableRow key={inv.id}>
                  <TableCell style={{ fontFamily: 'monospace' }}>
                    {inv.invoiceNumber}
                  </TableCell>
                  <TableCell>{inv.customer}</TableCell>
                  <TableCell>
                    {inv.items.map((item, i) => (
                      <div key={i} style={{ fontSize: '12px' }}>
                        {item.materialName} x{item.quantity}
                      </div>
                    ))}
                  </TableCell>
                  <TableCell>
                    <strong>${inv.total.toFixed(2)}</strong>
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={inv.status}>
                      {inv.status.toUpperCase()}
                    </StatusBadge>
                  </TableCell>
                  <TableCell style={{ fontSize: '12px' }}>
                    {new Date(inv.issuedAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                      {inv.status === INVOICE_STATUS.ISSUED && (
                        <Button size="small" onClick={() => markPaid(inv.id)}>
                          Mark Paid
                        </Button>
                      )}
                      <Button size="small" onClick={() => publishInvoice(inv)}>
                        On-Chain
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </>
      )}
    </div>
  );
}

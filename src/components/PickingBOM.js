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

import { updatePallet, addInventoryTransaction } from 'actions/actionCreators';
import { Table, TableHeader, TableBody, TableRow, TableHeaderCell, TableCell } from './StyledTable';
import { getAllMaterials, getMaterialFromReference, getMaterialDisplayName } from '../utils/materialReferenceManager';
import { PALLET_STATUS, createPickingListAssetTemplate } from '../utils/distordiaStandards';

const FormRow = styled.div({
  display: 'grid',
  gridTemplateColumns: '1fr 1fr 1fr',
  gap: '12px',
  marginBottom: '20px',
  padding: '15px',
  border: '1px solid #ccc',
  borderRadius: '5px',
});

const PickCard = styled.div(({ theme, ok }) => ({
  padding: '12px',
  margin: '8px 0',
  borderRadius: '5px',
  border: `1px solid ${ok ? '#28a745' : '#dc3545'}`,
  backgroundColor: ok ? '#f0fff4' : '#fff5f5',
}));

export default function PickingBOM() {
  const dispatch = useDispatch();
  const userStatus = useSelector((state) => state.nexus.userStatus);
  const localMaterials = useSelector((state) => state.mrp.materials);
  const chainAssets = useSelector((state) => state.mrp.chainAssets || []);
  const componentLibrary = useSelector((state) => state.mrp.componentLibrary || []);
  const bom = useSelector((state) => state.mrp.bom);
  const pallets = useSelector((state) => state.mrp.pallets || []);

  const materials = getAllMaterials(chainAssets, localMaterials, componentLibrary);

  const [productId, setProductId] = useState('');
  const [orderQty, setOrderQty] = useState('');
  const [pickingList, setPickingList] = useState(null);

  // ─── Generate Picking List ──────────────────────────────────────────────────

  const generatePickingList = () => {
    if (!productId || !orderQty) {
      showErrorDialog({ message: 'Select a product and enter order quantity' });
      return;
    }

    const qty = parseFloat(orderQty);
    const bomItems = bom[productId];
    if (!bomItems || bomItems.length === 0) {
      showErrorDialog({ message: 'No BOM defined for this product' });
      return;
    }

    const product = getMaterialFromReference(productId, chainAssets, localMaterials);

    const lines = bomItems.map((bomItem) => {
      const childRef = bomItem.childAssetAddress || bomItem.childMaterialId;
      const child = getMaterialFromReference(childRef, chainAssets, localMaterials);
      const required = bomItem.quantity * qty;

      // Find pallets that can fulfil this component
      const candidatePallets = pallets.filter(
        (p) =>
          p.materialId === childRef &&
          p.status === PALLET_STATUS.AVAILABLE &&
          p.quantity > 0
      );

      // Greedy allocation across pallets
      let remaining = required;
      const picks = [];
      for (const p of candidatePallets) {
        if (remaining <= 0) break;
        const take = Math.min(remaining, p.quantity);
        picks.push({ palletId: p.id, location: p.location, quantity: take });
        remaining -= take;
      }

      return {
        materialId: childRef,
        materialName: child ? child.name : childRef,
        materialDisplayName: child ? getMaterialDisplayName(child) : childRef,
        unit: child ? child.unit : '',
        requiredQty: required,
        allocatedQty: required - remaining,
        shortfall: Math.max(0, remaining),
        picks,
      };
    });

    setPickingList({
      id: `PICK-${Date.now().toString(36).toUpperCase()}`,
      productId,
      productName: product ? product.name : productId,
      orderQuantity: qty,
      lines,
      createdAt: new Date().toISOString(),
      status: 'open',
    });

    showSuccessDialog({ message: 'Picking list generated' });
  };

  // ─── Confirm Pick (deduct from pallets + record issue) ──────────────────────

  const confirmPick = () => {
    if (!pickingList) return;

    const hasShortfall = pickingList.lines.some((l) => l.shortfall > 0);
    if (hasShortfall) {
      showErrorDialog({
        message: 'Cannot confirm pick - some items have shortfall. Resolve inventory first.',
      });
      return;
    }

    // Deduct from each pallet
    pickingList.lines.forEach((line) => {
      line.picks.forEach((pick) => {
        const pallet = pallets.find((p) => p.id === pick.palletId);
        if (!pallet) return;

        const newQty = pallet.quantity - pick.quantity;
        dispatch(
          updatePallet(pick.palletId, {
            quantity: newQty,
            status: newQty === 0 ? PALLET_STATUS.EMPTY : PALLET_STATUS.AVAILABLE,
            updatedAt: new Date().toISOString(),
          })
        );
      });

      // Record inventory issue
      dispatch(
        addInventoryTransaction({
          materialId: line.materialId,
          transaction: {
            id: `txn_${Date.now()}_${line.materialId}`,
            materialId: line.materialId,
            quantity: -line.requiredQty,
            type: 'issue',
            reference: `Pick ${pickingList.id}`,
            timestamp: new Date().toISOString(),
          },
        })
      );
    });

    setPickingList({ ...pickingList, status: 'picked' });
    showSuccessDialog({ message: `Picking list ${pickingList.id} confirmed - inventory updated` });
  };

  // ─── Publish Picking List On-Chain ──────────────────────────────────────────

  const publishPickingList = async () => {
    if (!userStatus) {
      showErrorDialog({ message: 'Log in to publish on-chain' });
      return;
    }
    if (!pickingList) return;

    try {
      const template = createPickingListAssetTemplate(pickingList);
      await apiCall('register/create/asset', template);
      showSuccessDialog({ message: `Picking list ${pickingList.id} published on-chain` });
    } catch (error) {
      showErrorDialog({ message: 'Failed to publish picking list' });
    }
  };

  // Products that have a BOM defined
  const productsWithBom = materials.filter((m) => {
    const key = m.address || m.id;
    return bom[key] && bom[key].length > 0;
  });

  return (
    <div>
      <h3>Picking BOM</h3>
      <p>
        Generate a picking list from a product BOM. The system allocates
        required components to specific warehouse pallets for fulfillment.
      </p>

      <FormRow>
        <select
          value={productId}
          onChange={(e) => setProductId(e.target.value)}
          style={{ padding: '8px' }}
        >
          <option value="">Select Product</option>
          {productsWithBom.map((m) => {
            const key = m.address || m.id;
            return (
              <option key={key} value={key}>
                {getMaterialDisplayName(m)}
              </option>
            );
          })}
        </select>
        <TextField
          label="Order Quantity"
          type="number"
          value={orderQty}
          onChange={(e) => setOrderQty(e.target.value)}
          placeholder="Units to produce"
        />
        <Button onClick={generatePickingList}>Generate Picking List</Button>
      </FormRow>

      {/* Picking List Output */}
      {pickingList && (
        <div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '10px',
            }}
          >
            <h4>
              Picking List: {pickingList.id} — {pickingList.productName} x{' '}
              {pickingList.orderQuantity}
            </h4>
            <div style={{ display: 'flex', gap: '8px' }}>
              {pickingList.status === 'open' && (
                <Button onClick={confirmPick}>Confirm Pick</Button>
              )}
              <Button onClick={publishPickingList}>Publish On-Chain</Button>
            </div>
          </div>

          <div
            style={{
              padding: '6px 12px',
              marginBottom: '12px',
              borderRadius: '4px',
              backgroundColor:
                pickingList.status === 'picked' ? '#d4edda' : '#fff3cd',
              fontSize: '13px',
            }}
          >
            Status: <strong>{pickingList.status.toUpperCase()}</strong>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHeaderCell>Component</TableHeaderCell>
                <TableHeaderCell>Required</TableHeaderCell>
                <TableHeaderCell>Allocated</TableHeaderCell>
                <TableHeaderCell>Shortfall</TableHeaderCell>
                <TableHeaderCell>Pick From</TableHeaderCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pickingList.lines.map((line, idx) => (
                <TableRow key={idx}>
                  <TableCell>{line.materialDisplayName || line.materialName}</TableCell>
                  <TableCell>
                    {line.requiredQty} {line.unit}
                  </TableCell>
                  <TableCell>
                    {line.allocatedQty} {line.unit}
                  </TableCell>
                  <TableCell
                    style={{
                      color: line.shortfall > 0 ? '#dc3545' : '#28a745',
                      fontWeight: 'bold',
                    }}
                  >
                    {line.shortfall > 0
                      ? `${line.shortfall} ${line.unit} SHORT`
                      : 'OK'}
                  </TableCell>
                  <TableCell>
                    {line.picks.length > 0
                      ? line.picks.map((pick, pi) => (
                          <div key={pi} style={{ fontSize: '12px' }}>
                            {pick.palletId} @ {pick.location}: {pick.quantity}{' '}
                            {line.unit}
                          </div>
                        ))
                      : '-'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {!pickingList && productsWithBom.length === 0 && (
        <div
          style={{
            textAlign: 'center',
            padding: '30px',
            color: '#666',
            border: '2px dashed #ccc',
            borderRadius: '5px',
          }}
        >
          No products with BOMs found. Define a Bill of Materials first to use
          picking.
        </div>
      )}
    </div>
  );
}

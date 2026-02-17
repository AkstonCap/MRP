import { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import styled from '@emotion/styled';
import {
  Button,
  TextField,
  showSuccessDialog,
  showErrorDialog,
  apiCall,
  confirm,
} from 'nexus-module';

import {
  addPallet,
  updatePallet,
  removePallet,
  addInventoryTransaction,
} from 'actions/actionCreators';
import { Table, TableHeader, TableBody, TableRow, TableHeaderCell, TableCell } from './StyledTable';
import { getAllMaterials, getMaterialDisplayName } from '../utils/materialReferenceManager';
import {
  PALLET_STATUS,
  PALLET_STATUS_LABELS,
  createPalletAssetTemplate,
} from '../utils/distordiaStandards';

const FormContainer = styled.div({
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
  gap: '12px',
  marginBottom: '20px',
  padding: '15px',
  border: '1px solid #ccc',
  borderRadius: '5px',
});

const StatsRow = styled.div({
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
  gap: '12px',
  marginBottom: '20px',
});

const StatCard = styled.div(({ theme }) => ({
  padding: '12px',
  border: `1px solid ${theme.mixer ? theme.mixer(0.125) : '#ddd'}`,
  borderRadius: '5px',
  textAlign: 'center',
  backgroundColor: theme.mixer ? theme.mixer(0.0625) : '#f9f9f9',
}));

const StatusDot = styled.span(({ status }) => {
  const colors = {
    [PALLET_STATUS.AVAILABLE]: '#28a745',
    [PALLET_STATUS.RESERVED]: '#ffc107',
    [PALLET_STATUS.PICKED]: '#17a2b8',
    [PALLET_STATUS.SHIPPED]: '#6c757d',
    [PALLET_STATUS.EMPTY]: '#dc3545',
  };
  return {
    display: 'inline-block',
    width: '10px',
    height: '10px',
    borderRadius: '50%',
    backgroundColor: colors[status] || '#999',
    marginRight: '6px',
  };
});

export default function WarehouseInventory() {
  const dispatch = useDispatch();
  const userStatus = useSelector((state) => state.nexus.userStatus);
  const pallets = useSelector((state) => state.mrp.pallets || []);
  const localMaterials = useSelector((state) => state.mrp.materials);
  const chainAssets = useSelector((state) => state.mrp.chainAssets || []);
  const inventory = useSelector((state) => state.mrp.inventory);

  const materials = getAllMaterials(chainAssets, localMaterials);

  const [palletForm, setPalletForm] = useState({
    materialId: '',
    quantity: '',
    location: '',
    reference: '',
  });

  const [updateForm, setUpdateForm] = useState({
    palletId: '',
    action: 'adjust', // adjust | move | status
    quantity: '',
    location: '',
    status: '',
  });

  // ─── Create Pallet ──────────────────────────────────────────────────────────

  const handleCreatePallet = () => {
    if (!palletForm.materialId || !palletForm.quantity || !palletForm.location) {
      showErrorDialog({ message: 'Material, quantity, and location are required' });
      return;
    }

    const material = materials.find(
      (m) => (m.address || m.id) === palletForm.materialId
    );
    if (!material) {
      showErrorDialog({ message: 'Material not found' });
      return;
    }

    const palletId = `PLT-${Date.now().toString(36).toUpperCase()}`;
    const qty = parseFloat(palletForm.quantity);

    const pallet = {
      id: palletId,
      materialId: palletForm.materialId,
      materialName: material.name,
      unit: material.unit,
      quantity: qty,
      location: palletForm.location,
      status: PALLET_STATUS.AVAILABLE,
      reference: palletForm.reference || '',
      receivedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    dispatch(addPallet(pallet));

    // Also record as inventory receipt
    dispatch(
      addInventoryTransaction({
        materialId: palletForm.materialId,
        assetAddress: material.address || null,
        transaction: {
          id: `txn_${Date.now()}`,
          materialId: palletForm.materialId,
          quantity: qty,
          type: 'receipt',
          reference: `Pallet ${palletId}`,
          timestamp: new Date().toISOString(),
        },
      })
    );

    setPalletForm({ materialId: '', quantity: '', location: '', reference: '' });
    showSuccessDialog({ message: `Pallet ${palletId} created at ${pallet.location}` });
  };

  // ─── Update Pallet ──────────────────────────────────────────────────────────

  const handleUpdatePallet = () => {
    if (!updateForm.palletId) {
      showErrorDialog({ message: 'Select a pallet to update' });
      return;
    }

    const pallet = pallets.find((p) => p.id === updateForm.palletId);
    if (!pallet) return;

    const updates = { updatedAt: new Date().toISOString() };

    if (updateForm.action === 'adjust' && updateForm.quantity) {
      const delta = parseFloat(updateForm.quantity);
      const newQty = pallet.quantity + delta;
      if (newQty < 0) {
        showErrorDialog({ message: 'Quantity cannot go below zero' });
        return;
      }
      updates.quantity = newQty;
      if (newQty === 0) updates.status = PALLET_STATUS.EMPTY;

      // Record inventory transaction
      dispatch(
        addInventoryTransaction({
          materialId: pallet.materialId,
          transaction: {
            id: `txn_${Date.now()}`,
            materialId: pallet.materialId,
            quantity: delta,
            type: delta > 0 ? 'receipt' : 'issue',
            reference: `Pallet ${pallet.id} adjustment`,
            timestamp: new Date().toISOString(),
          },
        })
      );
    }

    if (updateForm.action === 'move' && updateForm.location) {
      updates.location = updateForm.location;
    }

    if (updateForm.action === 'status' && updateForm.status) {
      updates.status = updateForm.status;
    }

    dispatch(updatePallet(pallet.id, updates));
    setUpdateForm({ palletId: '', action: 'adjust', quantity: '', location: '', status: '' });
    showSuccessDialog({ message: `Pallet ${pallet.id} updated` });
  };

  // ─── Publish Pallet On-Chain ────────────────────────────────────────────────

  const handlePublishPallet = async (pallet) => {
    if (!userStatus) {
      showErrorDialog({ message: 'Log in to Nexus Wallet to publish pallet assets' });
      return;
    }
    try {
      const template = createPalletAssetTemplate(pallet);
      await apiCall('register/create/asset', template);
      showSuccessDialog({ message: `Pallet ${pallet.id} published on-chain` });
    } catch (error) {
      showErrorDialog({ message: 'Failed to publish pallet asset' });
    }
  };

  // ─── Remove Pallet ──────────────────────────────────────────────────────────

  const handleRemovePallet = async (palletId) => {
    const agreed = await confirm({
      question: `Remove pallet ${palletId}?`,
      note: 'This removes the pallet record from your local warehouse.',
    });
    if (agreed) {
      dispatch(removePallet(palletId));
      showSuccessDialog({ message: `Pallet ${palletId} removed` });
    }
  };

  // ─── Stats ──────────────────────────────────────────────────────────────────

  const totalPallets = pallets.length;
  const activePallets = pallets.filter((p) => p.status === PALLET_STATUS.AVAILABLE).length;
  const uniqueLocations = [...new Set(pallets.map((p) => p.location))].length;
  const totalUnits = pallets.reduce((sum, p) => sum + (p.quantity || 0), 0);

  return (
    <div>
      <h3>Warehouse Pallet Inventory</h3>
      <p>
        Track physical pallet inventory in your warehouse. Each pallet is an
        individually trackable unit that can be published on-chain.
      </p>

      <StatsRow>
        <StatCard>
          <div style={{ fontSize: '22px', fontWeight: 'bold' }}>{totalPallets}</div>
          <div>Total Pallets</div>
        </StatCard>
        <StatCard>
          <div style={{ fontSize: '22px', fontWeight: 'bold' }}>{activePallets}</div>
          <div>Available</div>
        </StatCard>
        <StatCard>
          <div style={{ fontSize: '22px', fontWeight: 'bold' }}>{uniqueLocations}</div>
          <div>Locations</div>
        </StatCard>
        <StatCard>
          <div style={{ fontSize: '22px', fontWeight: 'bold' }}>{totalUnits.toFixed(0)}</div>
          <div>Total Units</div>
        </StatCard>
      </StatsRow>

      {/* Create Pallet */}
      <h4>Receive New Pallet</h4>
      <FormContainer>
        <select
          value={palletForm.materialId}
          onChange={(e) => setPalletForm({ ...palletForm, materialId: e.target.value })}
          style={{ padding: '8px' }}
        >
          <option value="">Select Material</option>
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
          label="Quantity"
          type="number"
          value={palletForm.quantity}
          onChange={(e) => setPalletForm({ ...palletForm, quantity: e.target.value })}
          placeholder="Qty on pallet"
        />
        <TextField
          label="Location"
          value={palletForm.location}
          onChange={(e) => setPalletForm({ ...palletForm, location: e.target.value })}
          placeholder="e.g., A-01-03"
        />
        <TextField
          label="Reference"
          value={palletForm.reference}
          onChange={(e) => setPalletForm({ ...palletForm, reference: e.target.value })}
          placeholder="PO# / GRN#"
        />
        <Button onClick={handleCreatePallet}>Create Pallet</Button>
      </FormContainer>

      {/* Update Pallet */}
      {pallets.length > 0 && (
        <>
          <h4>Update Pallet</h4>
          <FormContainer>
            <select
              value={updateForm.palletId}
              onChange={(e) => setUpdateForm({ ...updateForm, palletId: e.target.value })}
              style={{ padding: '8px' }}
            >
              <option value="">Select Pallet</option>
              {pallets.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.id} - {p.materialName} ({p.quantity} {p.unit})
                </option>
              ))}
            </select>
            <select
              value={updateForm.action}
              onChange={(e) => setUpdateForm({ ...updateForm, action: e.target.value })}
              style={{ padding: '8px' }}
            >
              <option value="adjust">Adjust Quantity</option>
              <option value="move">Move Location</option>
              <option value="status">Change Status</option>
            </select>

            {updateForm.action === 'adjust' && (
              <TextField
                label="Quantity (+/-)"
                type="number"
                value={updateForm.quantity}
                onChange={(e) => setUpdateForm({ ...updateForm, quantity: e.target.value })}
                placeholder="+10 or -5"
              />
            )}
            {updateForm.action === 'move' && (
              <TextField
                label="New Location"
                value={updateForm.location}
                onChange={(e) => setUpdateForm({ ...updateForm, location: e.target.value })}
                placeholder="e.g., B-02-01"
              />
            )}
            {updateForm.action === 'status' && (
              <select
                value={updateForm.status}
                onChange={(e) => setUpdateForm({ ...updateForm, status: e.target.value })}
                style={{ padding: '8px' }}
              >
                <option value="">Select Status</option>
                {Object.entries(PALLET_STATUS_LABELS).map(([s, label]) => (
                  <option key={s} value={s}>
                    {label}
                  </option>
                ))}
              </select>
            )}

            <Button onClick={handleUpdatePallet}>Update</Button>
          </FormContainer>
        </>
      )}

      {/* Pallet Table */}
      <h4>Pallet Inventory ({pallets.length})</h4>
      {pallets.length > 0 ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHeaderCell>Pallet ID</TableHeaderCell>
              <TableHeaderCell>Material</TableHeaderCell>
              <TableHeaderCell>Qty</TableHeaderCell>
              <TableHeaderCell>Location</TableHeaderCell>
              <TableHeaderCell>Status</TableHeaderCell>
              <TableHeaderCell>Received</TableHeaderCell>
              <TableHeaderCell>Actions</TableHeaderCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pallets.map((p) => (
              <TableRow key={p.id}>
                <TableCell style={{ fontFamily: 'monospace', fontSize: '13px' }}>
                  {p.id}
                </TableCell>
                <TableCell>{p.materialName}</TableCell>
                <TableCell>
                  {p.quantity} {p.unit}
                </TableCell>
                <TableCell>{p.location}</TableCell>
                <TableCell>
                  <StatusDot status={p.status} />
                  {PALLET_STATUS_LABELS[p.status] || p.status}
                </TableCell>
                <TableCell style={{ fontSize: '12px' }}>
                  {new Date(p.receivedAt).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <Button
                      size="small"
                      onClick={() => handlePublishPallet(p)}
                    >
                      On-Chain
                    </Button>
                    <Button
                      size="small"
                      skin="danger"
                      onClick={() => handleRemovePallet(p.id)}
                    >
                      Remove
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <p style={{ color: '#888', textAlign: 'center', padding: '20px' }}>
          No pallets registered. Receive a pallet above to get started.
        </p>
      )}
    </div>
  );
}

import { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import styled from '@emotion/styled';
import { 
  Panel, 
  TextField, 
  Button, 
  confirm,
  showSuccessDialog,
  showErrorDialog,
} from 'nexus-module';

import { 
  setActiveTab,
  addMaterial, 
  updateMaterial, 
  deleteMaterial,
  addInventoryTransaction,
  addBomItem,
  removeBomItem,
  setMaterials,
  setInventory,
  setBom,
} from 'actions/actionCreators';

import { sampleMaterials, sampleInventory, sampleBOM } from '../utils/sampleData';
import BlockchainFeatures from './BlockchainFeatures';
import ProductionPlanning from './ProductionPlanning';
import { Table, TableHeader, TableBody, TableRow, TableHeaderCell, TableCell } from './StyledTable';

const TabContainer = styled.div({
  display: 'flex',
  borderBottom: '1px solid #ccc',
  marginBottom: '20px',
});

const TabButton = styled.button(({ active, theme }) => ({
  padding: '10px 20px',
  border: 'none',
  backgroundColor: active ? theme.primary : 'transparent',
  color: active ? theme.primaryAccent : theme.foreground,
  cursor: 'pointer',
  borderBottom: active ? `2px solid ${theme.primary}` : 'none',
  '&:hover': {
    backgroundColor: active ? theme.primary : theme.mixer(0.125),
  },
}));

const FormContainer = styled.div({
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
  gap: '15px',
  marginBottom: '20px',
  padding: '15px',
  border: '1px solid #ccc',
  borderRadius: '5px',
});

const StatsContainer = styled.div({
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
  gap: '15px',
  marginBottom: '20px',
});

const StatCard = styled.div(({ theme }) => ({
  padding: '15px',
  border: `1px solid ${theme.mixer(0.125)}`,
  borderRadius: '5px',
  textAlign: 'center',
  backgroundColor: theme.mixer(0.0625),
}));

export default function MRPInterface() {
  const dispatch = useDispatch();
  const activeTab = useSelector(state => state.mrp.activeTab);
  const materials = useSelector(state => state.mrp.materials);
  const inventory = useSelector(state => state.mrp.inventory);
  const bom = useSelector(state => state.mrp.bom);

  // Form states
  const [materialForm, setMaterialForm] = useState({
    name: '',
    description: '',
    unit: '',
    cost: '',
    type: 'raw',
  });

  const [inventoryForm, setInventoryForm] = useState({
    materialId: '',
    quantity: '',
    type: 'receipt',
    reference: '',
  });

  const [bomForm, setBomForm] = useState({
    parentMaterialId: '',
    childMaterialId: '',
    quantity: '',
  });

  const handleTabChange = (tabName) => {
    dispatch(setActiveTab(tabName));
  };

  const handleAddMaterial = () => {
    if (!materialForm.name || !materialForm.unit) {
      showErrorDialog({ message: 'Material name and unit are required' });
      return;
    }

    const newMaterial = {
      id: Date.now().toString(),
      ...materialForm,
      cost: parseFloat(materialForm.cost) || 0,
      createdAt: new Date().toISOString(),
    };

    dispatch(addMaterial(newMaterial));
    setMaterialForm({ name: '', description: '', unit: '', cost: '', type: 'raw' });
    showSuccessDialog({ message: 'Material added successfully' });
  };

  const handleDeleteMaterial = async (materialId) => {
    const material = materials.find(m => m.id === materialId);
    const agreed = await confirm({ 
      question: `Delete material "${material?.name}"?`,
      note: 'This action cannot be undone.'
    });
    
    if (agreed) {
      dispatch(deleteMaterial(materialId));
      showSuccessDialog({ message: 'Material deleted successfully' });
    }
  };

  const handleAddInventoryTransaction = () => {
    if (!inventoryForm.materialId || !inventoryForm.quantity) {
      showErrorDialog({ message: 'Material and quantity are required' });
      return;
    }

    const transaction = {
      id: Date.now().toString(),
      materialId: inventoryForm.materialId,
      quantity: inventoryForm.type === 'issue' 
        ? -Math.abs(parseFloat(inventoryForm.quantity))
        : Math.abs(parseFloat(inventoryForm.quantity)),
      type: inventoryForm.type,
      reference: inventoryForm.reference,
      timestamp: new Date().toISOString(),
    };

    dispatch(addInventoryTransaction({ 
      materialId: inventoryForm.materialId, 
      transaction 
    }));
    setInventoryForm({ materialId: '', quantity: '', type: 'receipt', reference: '' });
    showSuccessDialog({ message: 'Inventory transaction recorded' });
  };

  const handleAddBomItem = () => {
    if (!bomForm.parentMaterialId || !bomForm.childMaterialId || !bomForm.quantity) {
      showErrorDialog({ message: 'All BOM fields are required' });
      return;
    }

    const bomItem = {
      id: Date.now().toString(),
      childMaterialId: bomForm.childMaterialId,
      quantity: parseFloat(bomForm.quantity),
    };

    dispatch(addBomItem(bomForm.parentMaterialId, bomItem));
    setBomForm({ parentMaterialId: '', childMaterialId: '', quantity: '' });
    showSuccessDialog({ message: 'BOM item added successfully' });
  };

  const getMaterialName = (materialId) => {
    const material = materials.find(m => m.id === materialId);
    return material ? material.name : 'Unknown Material';
  };

  const getTotalMaterials = () => materials.length;
  const getTotalInventoryValue = () => {
    return materials.reduce((total, material) => {
      const inv = inventory[material.id];
      return total + (inv ? inv.onHand * material.cost : 0);
    }, 0);
  };
  const getLowStockItems = () => {
    return materials.filter(material => {
      const inv = inventory[material.id];
      return inv && inv.onHand < 10; // Arbitrary low stock threshold
    }).length;
  };

  const loadSampleData = () => {
    dispatch(setMaterials(sampleMaterials));
    dispatch(setInventory(sampleInventory));
    dispatch(setBom(sampleBOM));
    showSuccessDialog({ message: 'Sample data loaded successfully' });
  };

  return (
    <Panel title="MRP - Material Resource Planning" icon={{ url: 'react.svg', id: 'icon' }}>
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <p style={{ marginBottom: '10px' }}>
          This MRP module demonstrates material master data management, inventory tracking, 
          and bill of materials for small businesses using blockchain technology.
        </p>
        <Button onClick={loadSampleData}>Load Sample Data</Button>
      </div>

      <StatsContainer>
        <StatCard>
          <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{getTotalMaterials()}</div>
          <div>Total Materials</div>
        </StatCard>
        <StatCard>
          <div style={{ fontSize: '24px', fontWeight: 'bold' }}>
            ${getTotalInventoryValue().toFixed(2)}
          </div>
          <div>Inventory Value</div>
        </StatCard>
        <StatCard>
          <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{getLowStockItems()}</div>
          <div>Low Stock Items</div>
        </StatCard>
      </StatsContainer>

      <TabContainer>
        <TabButton 
          active={activeTab === 'materials'} 
          onClick={() => handleTabChange('materials')}
        >
          Materials Master
        </TabButton>
        <TabButton 
          active={activeTab === 'inventory'} 
          onClick={() => handleTabChange('inventory')}
        >
          Inventory
        </TabButton>
        <TabButton 
          active={activeTab === 'bom'} 
          onClick={() => handleTabChange('bom')}
        >
          Bill of Materials
        </TabButton>
        <TabButton 
          active={activeTab === 'planning'} 
          onClick={() => handleTabChange('planning')}
        >
          Production Planning
        </TabButton>
        <TabButton 
          active={activeTab === 'blockchain'} 
          onClick={() => handleTabChange('blockchain')}
        >
          Blockchain Features
        </TabButton>
      </TabContainer>

      {activeTab === 'materials' && (
        <div>
          <h3>Add New Material</h3>
          <FormContainer>
            <TextField
              label="Material Name"
              value={materialForm.name}
              onChange={(e) => setMaterialForm({...materialForm, name: e.target.value})}
              placeholder="Enter material name"
            />
            <TextField
              label="Description"
              value={materialForm.description}
              onChange={(e) => setMaterialForm({...materialForm, description: e.target.value})}
              placeholder="Enter description"
            />
            <TextField
              label="Unit of Measure"
              value={materialForm.unit}
              onChange={(e) => setMaterialForm({...materialForm, unit: e.target.value})}
              placeholder="e.g., kg, pcs, m"
            />
            <TextField
              label="Cost per Unit"
              type="number"
              value={materialForm.cost}
              onChange={(e) => setMaterialForm({...materialForm, cost: e.target.value})}
              placeholder="0.00"
            />
            <select 
              value={materialForm.type} 
              onChange={(e) => setMaterialForm({...materialForm, type: e.target.value})}
              style={{ padding: '8px' }}
            >
              <option value="raw">Raw Material</option>
              <option value="finished">Finished Good</option>
              <option value="semi">Semi-Finished</option>
            </select>
            <Button onClick={handleAddMaterial}>Add Material</Button>
          </FormContainer>

          <h3>Materials List</h3>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHeaderCell>Name</TableHeaderCell>
                <TableHeaderCell>Description</TableHeaderCell>
                <TableHeaderCell>Unit</TableHeaderCell>
                <TableHeaderCell>Cost</TableHeaderCell>
                <TableHeaderCell>Type</TableHeaderCell>
                <TableHeaderCell>On Hand</TableHeaderCell>
                <TableHeaderCell>Actions</TableHeaderCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {materials.map(material => {
                const inv = inventory[material.id];
                return (
                  <TableRow key={material.id}>
                    <TableCell>{material.name}</TableCell>
                    <TableCell>{material.description}</TableCell>
                    <TableCell>{material.unit}</TableCell>
                    <TableCell>${material.cost.toFixed(2)}</TableCell>
                    <TableCell>{material.type}</TableCell>
                    <TableCell>{inv ? inv.onHand : 0}</TableCell>
                    <TableCell>
                      <Button 
                        size="small" 
                        skin="danger"
                        onClick={() => handleDeleteMaterial(material.id)}
                      >
                        Delete
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {activeTab === 'inventory' && (
        <div>
          <h3>Record Inventory Transaction</h3>
          <FormContainer>
            <select 
              value={inventoryForm.materialId}
              onChange={(e) => setInventoryForm({...inventoryForm, materialId: e.target.value})}
              style={{ padding: '8px' }}
            >
              <option value="">Select Material</option>
              {materials.map(material => (
                <option key={material.id} value={material.id}>
                  {material.name}
                </option>
              ))}
            </select>
            <TextField
              label="Quantity"
              type="number"
              value={inventoryForm.quantity}
              onChange={(e) => setInventoryForm({...inventoryForm, quantity: e.target.value})}
              placeholder="Enter quantity"
            />
            <select 
              value={inventoryForm.type}
              onChange={(e) => setInventoryForm({...inventoryForm, type: e.target.value})}
              style={{ padding: '8px' }}
            >
              <option value="receipt">Receipt</option>
              <option value="issue">Issue</option>
              <option value="adjustment">Adjustment</option>
            </select>
            <TextField
              label="Reference"
              value={inventoryForm.reference}
              onChange={(e) => setInventoryForm({...inventoryForm, reference: e.target.value})}
              placeholder="PO#, WO#, etc."
            />
            <Button onClick={handleAddInventoryTransaction}>Record Transaction</Button>
          </FormContainer>

          <h3>Current Inventory</h3>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHeaderCell>Material</TableHeaderCell>
                <TableHeaderCell>On Hand</TableHeaderCell>
                <TableHeaderCell>Reserved</TableHeaderCell>
                <TableHeaderCell>Available</TableHeaderCell>
                <TableHeaderCell>Value</TableHeaderCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {materials.map(material => {
                const inv = inventory[material.id];
                const onHand = inv ? inv.onHand : 0;
                const reserved = inv ? inv.reserved : 0;
                const available = inv ? inv.available : 0;
                const value = onHand * material.cost;
                
                return (
                  <TableRow key={material.id}>
                    <TableCell>{material.name}</TableCell>
                    <TableCell>{onHand} {material.unit}</TableCell>
                    <TableCell>{reserved} {material.unit}</TableCell>
                    <TableCell>{available} {material.unit}</TableCell>
                    <TableCell>${value.toFixed(2)}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {activeTab === 'bom' && (
        <div>
          <h3>Add BOM Component</h3>
          <FormContainer>
            <select 
              value={bomForm.parentMaterialId}
              onChange={(e) => setBomForm({...bomForm, parentMaterialId: e.target.value})}
              style={{ padding: '8px' }}
            >
              <option value="">Select Parent Material</option>
              {materials.filter(m => m.type !== 'raw').map(material => (
                <option key={material.id} value={material.id}>
                  {material.name}
                </option>
              ))}
            </select>
            <select 
              value={bomForm.childMaterialId}
              onChange={(e) => setBomForm({...bomForm, childMaterialId: e.target.value})}
              style={{ padding: '8px' }}
            >
              <option value="">Select Component</option>
              {materials.map(material => (
                <option key={material.id} value={material.id}>
                  {material.name}
                </option>
              ))}
            </select>
            <TextField
              label="Quantity Required"
              type="number"
              value={bomForm.quantity}
              onChange={(e) => setBomForm({...bomForm, quantity: e.target.value})}
              placeholder="Quantity per unit"
            />
            <Button onClick={handleAddBomItem}>Add to BOM</Button>
          </FormContainer>

          <h3>Bill of Materials</h3>
          {materials.filter(m => bom[m.id] && bom[m.id].length > 0).map(material => (
            <div key={material.id} style={{ marginBottom: '20px' }}>
              <h4>{material.name} - Components:</h4>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHeaderCell>Component</TableHeaderCell>
                    <TableHeaderCell>Quantity Required</TableHeaderCell>
                    <TableHeaderCell>Actions</TableHeaderCell>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(bom[material.id] || []).map(bomItem => (
                    <TableRow key={bomItem.id}>
                      <TableCell>{getMaterialName(bomItem.childMaterialId)}</TableCell>
                      <TableCell>{bomItem.quantity}</TableCell>
                      <TableCell>
                        <Button 
                          size="small" 
                          skin="danger"
                          onClick={() => dispatch(removeBomItem(material.id, bomItem.id))}
                        >
                          Remove
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'planning' && <ProductionPlanning />}

      {activeTab === 'blockchain' && <BlockchainFeatures />}
    </Panel>
  );
}

import { useState } from 'react';
import { useSelector } from 'react-redux';
import styled from '@emotion/styled';
import { 
  Button, 
  TextField,
  showSuccessDialog,
  showErrorDialog,
} from 'nexus-module';

import { getAllMaterials, getMaterialFromReference, getMaterialDisplayName } from '../utils/materialReferenceManager';
import { Table, TableHeader, TableBody, TableRow, TableHeaderCell, TableCell } from './StyledTable';

const PlanningContainer = styled.div({
  marginTop: '20px',
});

const RequirementCard = styled.div(({ theme }) => ({
  padding: '15px',
  margin: '10px 0',
  border: `1px solid ${theme.mixer ? theme.mixer(0.125) : '#ddd'}`,
  borderRadius: '5px',
  backgroundColor: theme.mixer ? theme.mixer(0.03125) : '#f9f9f9',
}));

export default function ProductionPlanning() {
  const localMaterials = useSelector(state => state.mrp.materials);
  const chainAssets = useSelector(state => state.mrp.chainAssets || []);
  const componentLibrary = useSelector(state => state.mrp.componentLibrary || []);
  const inventory = useSelector(state => state.mrp.inventory);
  const bom = useSelector(state => state.mrp.bom);

  // Resolve materials — library addresses from chain, plus local fallback
  const materials = getAllMaterials(chainAssets, localMaterials, componentLibrary);
  
  const [planningForm, setPlanningForm] = useState({
    materialId: '',
    plannedQuantity: '',
  });
  
  const [materialRequirements, setMaterialRequirements] = useState([]);

  const calculateMaterialRequirements = () => {
    if (!planningForm.materialId || !planningForm.plannedQuantity) {
      showErrorDialog({ message: 'Please select a material and enter planned quantity' });
      return;
    }

    const parentMaterial = getMaterialFromReference(planningForm.materialId, chainAssets, localMaterials);
    if (!parentMaterial) return;

    const plannedQty = parseFloat(planningForm.plannedQuantity);
    const requirements = [];

    // Calculate direct material requirements
    const materialKey = parentMaterial.address || parentMaterial.id;
    const bomItems = bom[materialKey] || [];
    
    bomItems.forEach(bomItem => {
      const childReference = bomItem.childAssetAddress || bomItem.childMaterialId;
      const childMaterial = getMaterialFromReference(childReference, chainAssets, localMaterials);
      if (!childMaterial) return;

      const requiredQty = bomItem.quantity * plannedQty;
      const childKey = childMaterial.address || childMaterial.id;
      const currentInventory = inventory[childKey];
      const available = currentInventory ? currentInventory.available : 0;
      const shortfall = Math.max(0, requiredQty - available);

      requirements.push({
        materialId: childKey,
        materialName: childMaterial.name,
        materialDisplayName: getMaterialDisplayName(childMaterial),
        unit: childMaterial.unit,
        requiredQuantity: requiredQty,
        availableQuantity: available,
        shortfall: shortfall,
        cost: childMaterial.cost,
        totalCost: requiredQty * childMaterial.cost,
      });
    });

    // Calculate nested requirements for semi-finished goods
    requirements.forEach(req => {
      const nestedBom = bom[req.materialId] || [];
      if (nestedBom.length > 0) {
        nestedBom.forEach(nestedItem => {
          const nestedReference = nestedItem.childAssetAddress || nestedItem.childMaterialId;
          const nestedMaterial = getMaterialFromReference(nestedReference, chainAssets, localMaterials);
          if (!nestedMaterial) return;

          const nestedRequiredQty = nestedItem.quantity * req.requiredQuantity;
          const nestedKey = nestedMaterial.address || nestedMaterial.id;
          const nestedInventory = inventory[nestedKey];
          const nestedAvailable = nestedInventory ? nestedInventory.available : 0;
          const nestedShortfall = Math.max(0, nestedRequiredQty - nestedAvailable);

          // Check if this material is already in requirements
          const existingIndex = requirements.findIndex(r => r.materialId === nestedKey);
          if (existingIndex >= 0) {
            requirements[existingIndex].requiredQuantity += nestedRequiredQty;
            requirements[existingIndex].shortfall = Math.max(0, requirements[existingIndex].requiredQuantity - requirements[existingIndex].availableQuantity);
            requirements[existingIndex].totalCost = requirements[existingIndex].requiredQuantity * requirements[existingIndex].cost;
          } else {
            requirements.push({
              materialId: nestedKey,
              materialName: nestedMaterial.name,
              materialDisplayName: getMaterialDisplayName(nestedMaterial),
              unit: nestedMaterial.unit,
              requiredQuantity: nestedRequiredQty,
              availableQuantity: nestedAvailable,
              shortfall: nestedShortfall,
              cost: nestedMaterial.cost,
              totalCost: nestedRequiredQty * nestedMaterial.cost,
              nested: true,
            });
          }
        });
      }
    });

    setMaterialRequirements(requirements);
    const parentDisplayName = getMaterialDisplayName(parentMaterial);
    showSuccessDialog({ 
      message: 'Material requirements calculated',
      note: `Requirements calculated for ${plannedQty} units of ${parentDisplayName}`
    });
  };

  const getTotalCost = () => {
    return materialRequirements.reduce((total, req) => total + req.totalCost, 0);
  };

  const getTotalShortfall = () => {
    return materialRequirements.filter(req => req.shortfall > 0).length;
  };

  return (
    <PlanningContainer>
      <h3>🏭 Production Planning & MRP Calculation</h3>
      <p>
        Calculate material requirements for production planning. This shows what materials 
        you need to procure based on your planned production quantities and current inventory levels.
      </p>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
        gap: '15px',
        margin: '20px 0',
        padding: '15px',
        border: '1px solid #ccc',
        borderRadius: '5px'
      }}>
        <select 
          value={planningForm.materialId}
          onChange={(e) => setPlanningForm({...planningForm, materialId: e.target.value})}
          style={{ padding: '8px' }}
        >
          <option value="">Select Product to Produce</option>
          {materials.filter(material => {
            const materialKey = material.address || material.id;
            return bom[materialKey] && bom[materialKey].length > 0;
          }).map(material => {
            const materialKey = material.address || material.id;
            return (
              <option key={materialKey} value={materialKey}>
                {getMaterialDisplayName(material)}
              </option>
            );
          })}
        </select>

        <TextField
          label="Planned Quantity"
          type="number"
          value={planningForm.plannedQuantity}
          onChange={(e) => setPlanningForm({...planningForm, plannedQuantity: e.target.value})}
          placeholder="How many units?"
        />

        <Button onClick={calculateMaterialRequirements}>
          Calculate Requirements
        </Button>
      </div>

      {materialRequirements.length > 0 && (
        <div>
          <RequirementCard>
            <h4>📊 Planning Summary</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', textAlign: 'center' }}>
              <div>
                <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{materialRequirements.length}</div>
                <div>Materials Required</div>
              </div>
              <div>
                <div style={{ fontSize: '24px', fontWeight: 'bold' }}>${getTotalCost().toFixed(2)}</div>
                <div>Total Material Cost</div>
              </div>
              <div>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: getTotalShortfall() > 0 ? 'red' : 'green' }}>
                  {getTotalShortfall()}
                </div>
                <div>Items to Procure</div>
              </div>
            </div>
          </RequirementCard>

          <h4>Material Requirements</h4>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHeaderCell>Material</TableHeaderCell>
                <TableHeaderCell>Required</TableHeaderCell>
                <TableHeaderCell>Available</TableHeaderCell>
                <TableHeaderCell>Shortfall</TableHeaderCell>
                <TableHeaderCell>Unit Cost</TableHeaderCell>
                <TableHeaderCell>Total Cost</TableHeaderCell>
                <TableHeaderCell>Status</TableHeaderCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {materialRequirements.map((req, index) => (
                <TableRow key={index}>
                  <TableCell>
                    {req.nested && '↳ '}{req.materialDisplayName || req.materialName}
                  </TableCell>
                  <TableCell>{req.requiredQuantity.toFixed(2)} {req.unit}</TableCell>
                  <TableCell>{req.availableQuantity.toFixed(2)} {req.unit}</TableCell>
                  <TableCell style={{ color: req.shortfall > 0 ? 'red' : 'green' }}>
                    {req.shortfall.toFixed(2)} {req.unit}
                  </TableCell>
                  <TableCell>${req.cost.toFixed(2)}</TableCell>
                  <TableCell>${req.totalCost.toFixed(2)}</TableCell>
                  <TableCell>
                    {req.shortfall > 0 ? '⚠️ Need to Purchase' : '✅ In Stock'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <RequirementCard>
            <h4>🛒 Procurement Recommendations</h4>
            {materialRequirements.filter(req => req.shortfall > 0).length === 0 ? (
              <p style={{ color: 'green' }}>✅ All materials are available in stock for this production run!</p>
            ) : (
              <div>
                <p>The following materials need to be procured before production can begin:</p>
                <ul>
                  {materialRequirements
                    .filter(req => req.shortfall > 0)
                    .map((req, index) => (
                      <li key={index}>
                        <strong>{req.materialDisplayName || req.materialName}</strong>: Purchase {req.shortfall.toFixed(2)} {req.unit} 
                        (estimated cost: ${(req.shortfall * req.cost).toFixed(2)})
                      </li>
                    ))}
                </ul>
                <p style={{ marginTop: '10px' }}>
                  <strong>Total procurement cost: ${materialRequirements
                    .filter(req => req.shortfall > 0)
                    .reduce((total, req) => total + (req.shortfall * req.cost), 0)
                    .toFixed(2)}</strong>
                </p>
              </div>
            )}
          </RequirementCard>
        </div>
      )}
    </PlanningContainer>
  );
}

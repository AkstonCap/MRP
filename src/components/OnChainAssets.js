import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import styled from '@emotion/styled';
import { 
  Button, 
  TextField,
  showSuccessDialog,
  showErrorDialog,
  apiCall,
} from 'nexus-module';

import { Table, TableHeader, TableBody, TableRow, TableHeaderCell, TableCell } from './StyledTable';
import { 
  DISTORDIA_STATUS, 
  DISTORDIA_STATUS_LABELS, 
  createMaterialAssetTemplate,
  parseMaterialAsset 
} from '../utils/materialAssetTemplate';

const AssetContainer = styled.div({
  marginTop: '20px',
});

const FilterContainer = styled.div({
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
  gap: '15px',
  marginBottom: '20px',
  padding: '15px',
  border: '1px solid #ccc',
  borderRadius: '5px',
  backgroundColor: '#f9f9f9',
});

const StatusBadge = styled.span(({ status }) => {
  const colors = {
    [DISTORDIA_STATUS.ACTIVE]: { bg: '#d4edda', color: '#155724' },
    [DISTORDIA_STATUS.SOLD_OUT]: { bg: '#f8d7da', color: '#721c24' },
    [DISTORDIA_STATUS.PLANNED]: { bg: '#d1ecf1', color: '#0c5460' },
    [DISTORDIA_STATUS.DISCONTINUED]: { bg: '#e2e3e5', color: '#383d41' },
    [DISTORDIA_STATUS.PENDING_APPROVAL]: { bg: '#fff3cd', color: '#856404' },
  };
  
  const colorScheme = colors[status] || { bg: '#f8f9fa', color: '#6c757d' };
  
  return {
    padding: '4px 8px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: 'bold',
    backgroundColor: colorScheme.bg,
    color: colorScheme.color,
    border: `1px solid ${colorScheme.color}20`,
  };
});

const PublishContainer = styled.div({
  marginBottom: '20px',
  padding: '15px',
  border: '1px solid #007acc',
  borderRadius: '5px',
  backgroundColor: '#f0f8ff',
});

export default function OnChainAssets() {
  const materials = useSelector(state => state.mrp.materials);
  const userStatus = useSelector(state => state.nexus.userStatus);
  
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedMaterial, setSelectedMaterial] = useState('');
  const [selectedStatus, setSelectedStatus] = useState(DISTORDIA_STATUS.ACTIVE);

  const queryMaterialAssets = async () => {
    if (!userStatus) {
      showErrorDialog({ message: 'Please log in to Nexus Wallet to access blockchain assets' });
      return;
    }

    try {
      setLoading(true);
      
      // Query assets using the register/list/assets:asset API
      // This will get all assets, then we'll filter by distordia status
      const response = await apiCall('register/list/assets:asset/category,distordia,description,url,comment', {
        // You can add additional filters here if needed
        //limit: 100, // Limit results to prevent overwhelming the interface
        //where: `results.distordia=1`//${parseFloat(statusFilter)}`
      });

      if (response) {
        // Filter assets that have distordia attribute
        const materialAssets = response
          .map(asset => parseMaterialAsset(asset))
          .filter(asset => {
            // Only include assets with valid distordia status
            return asset.parsedData && 
                   asset.parsedData.distordia && 
                   asset.parsedData.assetType === 'material_master_data';
          })
          .filter(asset => {
            // Apply status filter if selected
            if (statusFilter && statusFilter !== '') {
              return asset.distordiaStatus === parseInt(statusFilter);
            }
            return true;
          });

        setAssets(materialAssets);
        if (materialAssets.length > 0) {
          showSuccessDialog({ 
            message: 'Material assets loaded',
            note: `Found ${materialAssets.length} material assets on blockchain`
          });
        }
      } else {
        setAssets([]);
      }
    } catch (error) {
      //console.error('Error querying assets:', error);
      /*showErrorDialog({
        message: 'Failed to query blockchain assets',
        note: error?.message || 'Unknown error occurred'
      });*/
      setAssets([]);
    } finally {
      setLoading(false);
    }
  };

  const publishMaterialAsset = async () => {
    if (!selectedMaterial) {
      showErrorDialog({ message: 'Please select a material to publish' });
      return;
    }

    if (!userStatus) {
      showErrorDialog({ message: 'Please log in to Nexus Wallet to publish assets' });
      return;
    }

    const material = materials.find(m => m.id === selectedMaterial);
    if (!material) return;

    try {
      setPublishing(true);
      
      // Create the asset template
      const assetTemplate = createMaterialAssetTemplate(material, selectedStatus);
      
      // Publish asset to blockchain using register/create/asset
      const response = await apiCall('register/create/asset', assetTemplate);
      
      if (response && response.result) {
        showSuccessDialog({ 
          message: 'Material asset published successfully',
          note: `Material "${material.name}" has been published to blockchain with distordia status ${DISTORDIA_STATUS_LABELS[selectedStatus]}. Asset address: ${response.result.address || 'N/A'}`
        });
        
        // Refresh the assets list
        await queryMaterialAssets();
        
        // Reset form
        setSelectedMaterial('');
        setSelectedStatus(DISTORDIA_STATUS.ACTIVE);
      } else {
        throw new Error('Invalid response from blockchain');
      }
    } catch (error) {
      console.error('Error publishing asset:', error);
      showErrorDialog({
        message: 'Failed to publish material asset',
        note: error?.message || 'Unknown error occurred'
      });
    } finally {
      setPublishing(false);
    }
  };

  const formatDate = (isoString) => {
    return new Date(isoString).toLocaleString();
  };

  const truncateAddress = (address) => {
    if (!address) return 'N/A';
    return `${address.substring(0, 10)}...${address.substring(address.length - 8)}`;
  };

  // Load assets on component mount
  useEffect(() => {
    if (userStatus) {
      queryMaterialAssets();
    }
  }, [userStatus]);

  return (
    <AssetContainer>
      <h3>🔗 On-Chain Material Assets</h3>
      <p>
        This tab displays all material master data assets published to the Nexus blockchain 
        with the "distordia" identifier. Each status represents different lifecycle stages 
        of materials in the MRP system.
      </p>

      {userStatus ? (
        <>
          <PublishContainer>
            <h4>📤 Publish Material to Blockchain</h4>
            <p>Select a material from your local database to publish as an on-chain asset:</p>
            
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
              gap: '15px',
              marginTop: '15px'
            }}>
              <select 
                value={selectedMaterial}
                onChange={(e) => setSelectedMaterial(e.target.value)}
                style={{ padding: '8px' }}
              >
                <option value="">Select Material to Publish</option>
                {materials.map(material => (
                  <option key={material.id} value={material.id}>
                    {material.name} ({material.type})
                  </option>
                ))}
              </select>

              <select 
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(parseInt(e.target.value))}
                style={{ padding: '8px' }}
              >
                {Object.entries(DISTORDIA_STATUS_LABELS).map(([status, label]) => (
                  <option key={status} value={status}>
                    {label} (distordia: {status})
                  </option>
                ))}
              </select>

              <Button 
                onClick={publishMaterialAsset}
                disabled={publishing || !selectedMaterial}
              >
                {publishing ? 'Publishing...' : 'Publish to Blockchain'}
              </Button>
            </div>
          </PublishContainer>

          <FilterContainer>
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ padding: '8px' }}
            >
              <option value="">All Distordia Status</option>
              {Object.entries(DISTORDIA_STATUS_LABELS).map(([status, label]) => (
                <option key={status} value={status}>
                  {label} (distordia: {status})
                </option>
              ))}
            </select>

            <Button onClick={queryMaterialAssets} disabled={loading}>
              {loading ? 'Loading...' : 'Refresh Assets'}
            </Button>
          </FilterContainer>

          {assets.length > 0 ? (
            <>
              <h4>Material Assets on Blockchain ({assets.length} found)</h4>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHeaderCell>Material Name</TableHeaderCell>
                    <TableHeaderCell>Description</TableHeaderCell>
                    <TableHeaderCell>Type</TableHeaderCell>
                    <TableHeaderCell>Unit</TableHeaderCell>
                    <TableHeaderCell>Status</TableHeaderCell>
                    <TableHeaderCell>Published</TableHeaderCell>
                    <TableHeaderCell>Asset Address</TableHeaderCell>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {assets.map((asset, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <strong>{asset.parsedData?.materialName || 'Unknown'}</strong>
                      </TableCell>
                      <TableCell>{asset.parsedData?.description || 'N/A'}</TableCell>
                      <TableCell>{asset.parsedData?.materialType || 'N/A'}</TableCell>
                      <TableCell>{asset.parsedData?.unit || 'N/A'}</TableCell>
                      <TableCell>
                        <StatusBadge status={asset.distordiaStatus}>
                          {asset.statusLabel}
                        </StatusBadge>
                      </TableCell>
                      <TableCell>
                        {asset.parsedData?.publishedAt ? 
                          formatDate(asset.parsedData.publishedAt) : 'N/A'}
                      </TableCell>
                      <TableCell style={{ fontFamily: 'monospace', fontSize: '12px' }}>
                        {truncateAddress(asset.address)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </>
          ) : (
            <div style={{ 
              textAlign: 'center', 
              padding: '40px', 
              color: '#666',
              border: '2px dashed #ccc',
              borderRadius: '5px',
              marginTop: '20px'
            }}>
              {loading ? (
                <div>
                  <div style={{ fontSize: '24px', marginBottom: '10px' }}>🔄</div>
                  <div>Loading material assets from blockchain...</div>
                </div>
              ) : (
                <div>
                  <div style={{ fontSize: '24px', marginBottom: '10px' }}>📭</div>
                  <div>No material assets found on blockchain</div>
                  <div style={{ fontSize: '14px', marginTop: '5px' }}>
                    Publish some materials to see them appear here
                  </div>
                </div>
              )}
            </div>
          )}

          <div style={{ 
            marginTop: '20px', 
            padding: '15px', 
            backgroundColor: '#f8f9fa', 
            border: '1px solid #dee2e6',
            borderRadius: '5px'
          }}>
            <h4>🏷️ Distordia Status Reference</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
              {Object.entries(DISTORDIA_STATUS_LABELS).map(([status, label]) => (
                <div key={status} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <StatusBadge status={parseInt(status)}>{label}</StatusBadge>
                  <span style={{ fontSize: '14px', color: '#666' }}>distordia: {status}</span>
                </div>
              ))}
            </div>
            <p style={{ marginTop: '15px', fontSize: '14px', color: '#666' }}>
              The "distordia" attribute serves as a standardized identifier for MRP-related assets 
              on the Nexus blockchain, allowing efficient filtering and lifecycle management.
            </p>
          </div>
        </>
      ) : (
        <div style={{ 
          textAlign: 'center', 
          padding: '40px', 
          color: '#666',
          border: '2px dashed #ffc107',
          borderRadius: '5px',
          backgroundColor: '#fff3cd'
        }}>
          <div style={{ fontSize: '24px', marginBottom: '10px' }}>🔐</div>
          <div style={{ fontSize: '18px', marginBottom: '10px' }}>Login Required</div>
          <div>Please log in to Nexus Wallet to access blockchain features</div>
        </div>
      )}
    </AssetContainer>
  );
}

import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import styled from '@emotion/styled';
import {
  Button,
  showSuccessDialog,
  showErrorDialog,
  apiCall,
} from 'nexus-module';

import { Table, TableHeader, TableBody, TableRow, TableHeaderCell, TableCell } from './StyledTable';
import {
  DISTORDIA_STATUS,
  DISTORDIA_STATUS_LABELS,
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

export default function OnChainAssets() {
  const userStatus = useSelector(state => state.nexus.userStatus);

  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');

  const queryMaterialAssets = async () => {
    if (!userStatus) {
      showErrorDialog({ message: 'Please log in to Nexus Wallet to access blockchain assets' });
      return;
    }

    try {
      setLoading(true);

      const response = await apiCall('register/list/assets:asset/category,distordia,description,url,comment', {});

      if (response) {
        const materialAssets = response
          .map(asset => parseMaterialAsset(asset))
          .filter(asset => {
            return asset.parsedData &&
                   asset.parsedData.distordia &&
                   asset.parsedData.assetType === 'material_master_data';
          })
          .filter(asset => {
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
      setAssets([]);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (isoString) => {
    return new Date(isoString).toLocaleString();
  };

  const truncateAddress = (address) => {
    if (!address) return 'N/A';
    return `${address.substring(0, 10)}...${address.substring(address.length - 8)}`;
  };

  useEffect(() => {
    if (userStatus) {
      queryMaterialAssets();
    }
  }, [userStatus]);

  return (
    <AssetContainer>
      <h3>On-Chain Material Assets</h3>
      <p>
        Browse Distordia masterdata assets published on the Nexus blockchain.
        Each asset represents a material in the global Layer 0 supply chain registry.
      </p>

      {userStatus ? (
        <>
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
                  <div style={{ marginBottom: '10px' }}>Loading...</div>
                  <div>Loading material assets from blockchain...</div>
                </div>
              ) : (
                <div>
                  <div style={{ marginBottom: '10px' }}>No assets found</div>
                  <div style={{ fontSize: '14px', marginTop: '5px' }}>
                    No Distordia masterdata assets found on blockchain
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
            <h4>Distordia Status Reference</h4>
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
          <div style={{ fontSize: '18px', marginBottom: '10px' }}>Login Required</div>
          <div>Please log in to Nexus Wallet to access blockchain features</div>
        </div>
      )}
    </AssetContainer>
  );
}

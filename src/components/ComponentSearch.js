import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import styled from '@emotion/styled';
import {
  Button,
  TextField,
  showSuccessDialog,
  showErrorDialog,
  apiCall,
} from 'nexus-module';

import { addToLibrary, removeFromLibrary, addMaterial } from 'actions/actionCreators';
import { Table, TableHeader, TableBody, TableRow, TableHeaderCell, TableCell } from './StyledTable';
import { DISTORDIA_STATUS, DISTORDIA_STATUS_LABELS, parseMaterialAsset } from '../utils/materialAssetTemplate';
import { ASSET_TYPES } from '../utils/distordiaStandards';

const SearchContainer = styled.div({
  marginTop: '10px',
});

const SearchBar = styled.div({
  display: 'grid',
  gridTemplateColumns: '1fr auto auto auto',
  gap: '10px',
  marginBottom: '20px',
  padding: '15px',
  border: '1px solid #ccc',
  borderRadius: '5px',
});

const Badge = styled.span(({ color }) => ({
  display: 'inline-block',
  padding: '2px 8px',
  borderRadius: '10px',
  fontSize: '11px',
  fontWeight: 'bold',
  backgroundColor: color || '#e2e3e5',
  color: '#333',
}));

const LibraryBadge = styled.span({
  display: 'inline-block',
  padding: '2px 6px',
  borderRadius: '4px',
  fontSize: '10px',
  fontWeight: 'bold',
  backgroundColor: '#d4edda',
  color: '#155724',
  marginLeft: '6px',
});

const SectionTitle = styled.h3({
  marginTop: '30px',
  marginBottom: '10px',
  borderBottom: '1px solid #ccc',
  paddingBottom: '5px',
});

export default function ComponentSearch() {
  const dispatch = useDispatch();
  const userStatus = useSelector((state) => state.nexus.userStatus);
  const componentLibrary = useSelector((state) => state.mrp.componentLibrary || []);
  const localMaterials = useSelector((state) => state.mrp.materials);

  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);

  // Check if a component is already in the library
  const isInLibrary = (asset) => {
    return componentLibrary.some(
      (c) => c.address === asset.address || c.id === asset.address
    );
  };

  // Search on-chain Distordia_Standards assets
  const handleSearch = async () => {
    if (!userStatus) {
      showErrorDialog({ message: 'Please log in to Nexus Wallet to search on-chain components' });
      return;
    }

    try {
      setLoading(true);
      const response = await apiCall(
        'register/list/assets:asset/category,distordia,description,url,comment',
        {}
      );

      if (response) {
        let results = response
          .map((asset) => parseMaterialAsset(asset))
          .filter((asset) => {
            if (!asset.parsedData) return false;
            // Only material master data
            if (asset.parsedData.assetType !== ASSET_TYPES.MATERIAL &&
                asset.parsedData.assetType !== 'material_master_data') return false;
            // Must have distordia status
            if (!asset.parsedData.distordia) return false;
            return true;
          });

        // Apply text search filter
        if (searchTerm.trim()) {
          const term = searchTerm.toLowerCase();
          results = results.filter((asset) => {
            const d = asset.parsedData;
            return (
              (d.materialName && d.materialName.toLowerCase().includes(term)) ||
              (d.description && d.description.toLowerCase().includes(term)) ||
              (d.materialType && d.materialType.toLowerCase().includes(term))
            );
          });
        }

        // Apply type filter
        if (typeFilter) {
          results = results.filter(
            (asset) => asset.parsedData.materialType === typeFilter
          );
        }

        // Apply status filter
        if (statusFilter) {
          results = results.filter(
            (asset) => asset.distordiaStatus === parseInt(statusFilter)
          );
        }

        setSearchResults(results);
      } else {
        setSearchResults([]);
      }
    } catch (error) {
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  // Add a found component to the internal library
  const handleAddToLibrary = (asset) => {
    const d = asset.parsedData;
    const component = {
      id: asset.address || `chain_${Date.now()}`,
      address: asset.address,
      name: d.materialName,
      description: d.description || '',
      unit: d.unit || 'pcs',
      cost: d.baseCost || 0,
      type: d.materialType || 'raw',
      source: 'chain',
      distordiaStatus: d.distordia,
      statusLabel: DISTORDIA_STATUS_LABELS[d.distordia] || 'Unknown',
      qualityGrade: d.qualityGrade || 'Standard',
      certifications: d.certifications || [],
      specifications: d.specifications || {},
      addedAt: new Date().toISOString(),
    };

    dispatch(addToLibrary(component));

    // Also add as a local material so it's available in inventory/BOM
    dispatch(
      addMaterial({
        id: component.id,
        name: component.name,
        description: component.description,
        unit: component.unit,
        cost: component.cost,
        type: component.type,
        createdAt: component.addedAt,
      })
    );

    showSuccessDialog({ message: `"${component.name}" added to your component library` });
  };

  const handleRemoveFromLibrary = (componentId) => {
    dispatch(removeFromLibrary(componentId));
  };

  return (
    <SearchContainer>
      <h3>Search Distordia Standards Components</h3>
      <p>
        Search the on-chain Distordia masterdata for components and add them to
        your internal library for use in inventory, BOMs, and production.
      </p>

      <SearchBar>
        <TextField
          label="Search components"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Name, description, or type..."
        />
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          style={{ padding: '8px' }}
        >
          <option value="">All Types</option>
          <option value="raw">Raw Material</option>
          <option value="semi">Semi-Finished</option>
          <option value="finished">Finished Good</option>
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{ padding: '8px' }}
        >
          <option value="">All Status</option>
          {Object.entries(DISTORDIA_STATUS_LABELS).map(([s, label]) => (
            <option key={s} value={s}>
              {label}
            </option>
          ))}
        </select>
        <Button onClick={handleSearch} disabled={loading}>
          {loading ? 'Searching...' : 'Search'}
        </Button>
      </SearchBar>

      {/* Search Results */}
      {searchResults.length > 0 && (
        <>
          <h4>Search Results ({searchResults.length})</h4>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHeaderCell>Name</TableHeaderCell>
                <TableHeaderCell>Description</TableHeaderCell>
                <TableHeaderCell>Type</TableHeaderCell>
                <TableHeaderCell>Unit</TableHeaderCell>
                <TableHeaderCell>Cost</TableHeaderCell>
                <TableHeaderCell>Status</TableHeaderCell>
                <TableHeaderCell>Actions</TableHeaderCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {searchResults.map((asset, idx) => {
                const d = asset.parsedData;
                const inLib = isInLibrary(asset);
                return (
                  <TableRow key={asset.address || idx}>
                    <TableCell>
                      {d.materialName || 'N/A'}
                      {inLib && <LibraryBadge>In Library</LibraryBadge>}
                    </TableCell>
                    <TableCell>{d.description || '-'}</TableCell>
                    <TableCell>{d.materialType || '-'}</TableCell>
                    <TableCell>{d.unit || '-'}</TableCell>
                    <TableCell>
                      {d.baseCost != null ? `$${Number(d.baseCost).toFixed(2)}` : '-'}
                    </TableCell>
                    <TableCell>
                      <Badge
                        color={
                          d.distordia === DISTORDIA_STATUS.ACTIVE
                            ? '#d4edda'
                            : d.distordia === DISTORDIA_STATUS.SOLD_OUT
                            ? '#f8d7da'
                            : '#e2e3e5'
                        }
                      >
                        {DISTORDIA_STATUS_LABELS[d.distordia] || 'Unknown'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {inLib ? (
                        <span style={{ color: '#155724', fontSize: '13px' }}>Added</span>
                      ) : (
                        <Button
                          size="small"
                          onClick={() => handleAddToLibrary(asset)}
                        >
                          + Add
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </>
      )}

      {searchResults.length === 0 && !loading && (
        <div
          style={{
            textAlign: 'center',
            padding: '30px',
            color: '#666',
            border: '2px dashed #ccc',
            borderRadius: '5px',
          }}
        >
          {userStatus
            ? 'Use the search bar above to find components in the Distordia Standards registry.'
            : 'Please log in to Nexus Wallet to search on-chain components.'}
        </div>
      )}

      {/* Internal Component Library */}
      <SectionTitle>Your Component Library ({componentLibrary.length})</SectionTitle>
      {componentLibrary.length > 0 ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHeaderCell>Name</TableHeaderCell>
              <TableHeaderCell>Description</TableHeaderCell>
              <TableHeaderCell>Type</TableHeaderCell>
              <TableHeaderCell>Unit</TableHeaderCell>
              <TableHeaderCell>Cost</TableHeaderCell>
              <TableHeaderCell>Added</TableHeaderCell>
              <TableHeaderCell>Actions</TableHeaderCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {componentLibrary.map((comp) => (
              <TableRow key={comp.id || comp.address}>
                <TableCell>{comp.name}</TableCell>
                <TableCell>{comp.description || '-'}</TableCell>
                <TableCell>{comp.type}</TableCell>
                <TableCell>{comp.unit}</TableCell>
                <TableCell>${Number(comp.cost || 0).toFixed(2)}</TableCell>
                <TableCell style={{ fontSize: '12px' }}>
                  {comp.addedAt
                    ? new Date(comp.addedAt).toLocaleDateString()
                    : '-'}
                </TableCell>
                <TableCell>
                  <Button
                    size="small"
                    skin="danger"
                    onClick={() => handleRemoveFromLibrary(comp.id || comp.address)}
                  >
                    Remove
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <p style={{ color: '#888', fontSize: '14px' }}>
          No components in library yet. Search above and add components to get
          started.
        </p>
      )}
    </SearchContainer>
  );
}

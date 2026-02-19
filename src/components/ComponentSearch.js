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

import { addToLibrary, removeFromLibrary } from 'actions/actionCreators';
import { Table, TableHeader, TableBody, TableRow, TableHeaderCell, TableCell } from './StyledTable';
import { DISTORDIA_STATUS, DISTORDIA_STATUS_LABELS, parseMaterialAsset } from '../utils/materialAssetTemplate';
import { ASSET_TYPES } from '../utils/distordiaStandards';
import { resolveLibrary } from '../utils/materialReferenceManager';

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

const AddressCell = styled.span({
  fontFamily: 'monospace',
  fontSize: '11px',
  opacity: 0.7,
});

export default function ComponentSearch() {
  const dispatch = useDispatch();
  const userStatus = useSelector((state) => state.nexus.userStatus);
  const componentLibrary = useSelector((state) => state.mrp.componentLibrary || []);
  const chainAssets = useSelector((state) => state.mrp.chainAssets || []);

  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);

  // Check if an asset address is already in the library
  const isInLibrary = (asset) =>
    componentLibrary.some((c) => c.address === asset.address);

  // ─── Search Distordia masterdata on-chain ──────────────────────────────────

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
            if (
              asset.parsedData.assetType !== ASSET_TYPES.MATERIAL &&
              asset.parsedData.assetType !== 'material_master_data'
            )
              return false;
            if (!asset.parsedData.distordia) return false;
            return true;
          });

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

        if (typeFilter) {
          results = results.filter(
            (asset) => asset.parsedData.materialType === typeFilter
          );
        }

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

  // ─── Add to library — store ONLY the address ──────────────────────────────

  const handleAddToLibrary = (asset) => {
    dispatch(addToLibrary({ address: asset.address }));
    const name = asset.parsedData?.materialName || asset.address;
    showSuccessDialog({ message: `"${name}" added to your component library (ref: ${asset.address})` });
  };

  const handleRemoveFromLibrary = (address) => {
    dispatch(removeFromLibrary(address));
  };

  // ─── Resolve library entries from chain for display ────────────────────────

  const resolvedLibrary = resolveLibrary(componentLibrary, chainAssets);

  // Truncate address for display
  const truncAddr = (addr) =>
    addr ? `${addr.substring(0, 8)}…${addr.substring(addr.length - 6)}` : '—';

  return (
    <SearchContainer>
      <h3>Search Distordia Standards Components</h3>
      <p>
        Search the on-chain Distordia masterdata for components.  Adding a
        component stores only its <strong>asset address</strong> as reference —
        all details are resolved live from the chain (no data duplication).
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
                <TableHeaderCell>Asset Address</TableHeaderCell>
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
                      <AddressCell>{truncAddr(asset.address)}</AddressCell>
                    </TableCell>
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
                        <Button size="small" onClick={() => handleAddToLibrary(asset)}>
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

      {/* ─── Internal Component Library (address-only references) ──────────── */}
      <SectionTitle>Your Component Library ({componentLibrary.length})</SectionTitle>
      <p style={{ fontSize: '13px', color: '#666', marginBottom: '10px' }}>
        Each entry is a reference to a Distordia masterdata asset address.
        Details below are resolved live from the Nexus blockchain.
      </p>

      {resolvedLibrary.length > 0 ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHeaderCell>Asset Address (Ref)</TableHeaderCell>
              <TableHeaderCell>Name</TableHeaderCell>
              <TableHeaderCell>Type</TableHeaderCell>
              <TableHeaderCell>Unit</TableHeaderCell>
              <TableHeaderCell>Cost</TableHeaderCell>
              <TableHeaderCell>Status</TableHeaderCell>
              <TableHeaderCell>Actions</TableHeaderCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {resolvedLibrary.map((comp) => (
              <TableRow key={comp.address}>
                <TableCell>
                  <AddressCell>{truncAddr(comp.address)}</AddressCell>
                </TableCell>
                <TableCell>{comp.name}</TableCell>
                <TableCell>{comp.type}</TableCell>
                <TableCell>{comp.unit}</TableCell>
                <TableCell>${Number(comp.cost || 0).toFixed(2)}</TableCell>
                <TableCell>{comp.statusLabel || '-'}</TableCell>
                <TableCell>
                  <Button
                    size="small"
                    skin="danger"
                    onClick={() => handleRemoveFromLibrary(comp.address)}
                  >
                    Remove
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : componentLibrary.length > 0 ? (
        <p style={{ color: '#c88', fontSize: '14px' }}>
          {componentLibrary.length} address(es) in library but chain data not
          yet cached. Query on-chain assets or search above to refresh.
        </p>
      ) : (
        <p style={{ color: '#888', fontSize: '14px' }}>
          No components in library yet. Search above and add components to get
          started.
        </p>
      )}
    </SearchContainer>
  );
}

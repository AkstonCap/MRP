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

import { addVendor, removeVendor, addChainAsset } from 'actions/actionCreators';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHeaderCell,
  TableCell,
} from './StyledTable';
import { parseMaterialAsset } from '../utils/materialAssetTemplate';
import { ASSET_TYPES, createVendorAssetTemplate } from '../utils/distordiaStandards';
import { resolveVendorLibrary } from '../utils/materialReferenceManager';

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

const SearchBar = styled.div({
  display: 'grid',
  gridTemplateColumns: '1fr auto auto',
  gap: '10px',
  marginBottom: '20px',
  padding: '15px',
  border: '1px solid #ccc',
  borderRadius: '5px',
});

const AddressCell = styled.span({
  fontFamily: 'monospace',
  fontSize: '11px',
  opacity: 0.7,
});

const SectionTitle = styled.h3({
  marginTop: '30px',
  marginBottom: '10px',
  borderBottom: '1px solid #ccc',
  paddingBottom: '5px',
});

const truncAddr = (addr) =>
  addr ? `${addr.substring(0, 8)}…${addr.substring(addr.length - 6)}` : '—';

export default function Vendors() {
  const dispatch = useDispatch();
  const userStatus = useSelector((state) => state.nexus.userStatus);
  const vendors = useSelector((state) => state.mrp.vendors || []);
  const chainAssets = useSelector((state) => state.mrp.chainAssets || []);

  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    vendorName: '',
    contact: '',
    email: '',
    phone: '',
    location: '',
    notes: '',
  });
  const [publishing, setPublishing] = useState(false);

  const inLibrary = (address) => vendors.some((v) => v.address === address);

  const handleSearch = async () => {
    if (!userStatus) {
      showErrorDialog({ message: 'Please log in to Nexus Wallet to query vendors' });
      return;
    }
    try {
      setLoading(true);
      const response = await apiCall(
        'register/list/assets:asset/category,distordia,description,url,comment',
        {}
      );
      const results = (response || [])
        .map(parseMaterialAsset)
        .filter(
          (a) =>
            a.parsedData &&
            a.parsedData.assetType === ASSET_TYPES.VENDOR &&
            a.parsedData.distordia
        );

      const filtered = searchTerm.trim()
        ? results.filter((a) => {
            const d = a.parsedData;
            const t = searchTerm.toLowerCase();
            return (
              (d.vendorName && d.vendorName.toLowerCase().includes(t)) ||
              (d.location && d.location.toLowerCase().includes(t)) ||
              (d.description && d.description.toLowerCase().includes(t))
            );
          })
        : results;

      setSearchResults(filtered);
    } catch (e) {
      setSearchResults([]);
      showErrorDialog({ message: 'Vendor search failed', note: e?.message || '' });
    } finally {
      setLoading(false);
    }
  };

  const handleAddFromChain = (asset) => {
    dispatch(addVendor({ address: asset.address }));
    showSuccessDialog({
      message: `Vendor "${asset.parsedData?.vendorName || asset.address}" added`,
    });
  };

  const handlePublish = async () => {
    if (!userStatus) {
      showErrorDialog({ message: 'Please log in to Nexus Wallet to publish a vendor' });
      return;
    }
    if (!form.vendorName.trim()) {
      showErrorDialog({ message: 'Vendor name is required' });
      return;
    }
    try {
      setPublishing(true);
      const template = createVendorAssetTemplate({
        vendorId: `v_${Date.now()}`,
        vendorName: form.vendorName,
        contact: form.contact,
        email: form.email,
        phone: form.phone,
        location: form.location,
        notes: form.notes,
      });
      const result = await apiCall('assets/create/asset', {
        name: template.name,
        data: template.data,
        format: template.format,
      });
      const address = result?.address;
      if (address) {
        dispatch(
          addChainAsset({
            address,
            name: template.name,
            data: template.data,
            parsedData: JSON.parse(template.data),
            assetType: ASSET_TYPES.VENDOR,
            distordiaStatus: JSON.parse(template.data).distordia,
          })
        );
        dispatch(addVendor({ address }));
        showSuccessDialog({
          message: 'Vendor published on-chain',
          note: `Address: ${address}`,
        });
      } else {
        showSuccessDialog({
          message: 'Vendor publish submitted',
          note: 'No address returned — refresh chain assets to see it.',
        });
      }
      setForm({
        vendorName: '',
        contact: '',
        email: '',
        phone: '',
        location: '',
        notes: '',
      });
    } catch (e) {
      showErrorDialog({ message: 'Failed to publish vendor', note: e?.message || '' });
    } finally {
      setPublishing(false);
    }
  };

  const resolved = resolveVendorLibrary(vendors, chainAssets);

  return (
    <Section>
      <h3>Vendors</h3>
      <p>
        Vendors are Distordia <code>vendor_master_data</code> assets on Nexus.
        Each vendor's asset address is its unique ID. Add existing vendors from
        the chain or publish a new one below.
      </p>

      <h4>Register a new local vendor</h4>
      <FormGrid>
        <TextField
          label="Vendor Name *"
          value={form.vendorName}
          onChange={(e) => setForm({ ...form, vendorName: e.target.value })}
          placeholder="e.g. Maria's Bakery"
        />
        <TextField
          label="Contact"
          value={form.contact}
          onChange={(e) => setForm({ ...form, contact: e.target.value })}
          placeholder="Contact person"
        />
        <TextField
          label="Email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />
        <TextField
          label="Phone"
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
        />
        <TextField
          label="Location"
          value={form.location}
          onChange={(e) => setForm({ ...form, location: e.target.value })}
          placeholder="City / address"
        />
        <TextField
          label="Notes"
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
        />
        <Button onClick={handlePublish} disabled={publishing}>
          {publishing ? 'Publishing…' : 'Publish vendor on-chain'}
        </Button>
      </FormGrid>

      <h4>Search existing vendors on-chain</h4>
      <SearchBar>
        <TextField
          label="Search vendors"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Name, location, description…"
        />
        <Button onClick={handleSearch} disabled={loading}>
          {loading ? 'Searching…' : 'Search'}
        </Button>
      </SearchBar>

      {searchResults.length > 0 && (
        <>
          <h4>Results ({searchResults.length})</h4>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHeaderCell>Address</TableHeaderCell>
                <TableHeaderCell>Name</TableHeaderCell>
                <TableHeaderCell>Location</TableHeaderCell>
                <TableHeaderCell>Contact</TableHeaderCell>
                <TableHeaderCell>Actions</TableHeaderCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {searchResults.map((a) => {
                const d = a.parsedData;
                const added = inLibrary(a.address);
                return (
                  <TableRow key={a.address}>
                    <TableCell>
                      <AddressCell>{truncAddr(a.address)}</AddressCell>
                    </TableCell>
                    <TableCell>{d.vendorName || 'N/A'}</TableCell>
                    <TableCell>{d.location || '-'}</TableCell>
                    <TableCell>{d.contact || '-'}</TableCell>
                    <TableCell>
                      {added ? (
                        <span style={{ fontSize: 13, color: '#155724' }}>Added</span>
                      ) : (
                        <Button size="small" onClick={() => handleAddFromChain(a)}>
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

      <SectionTitle>Your vendor list ({vendors.length})</SectionTitle>
      {resolved.length > 0 ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHeaderCell>Address</TableHeaderCell>
              <TableHeaderCell>Name</TableHeaderCell>
              <TableHeaderCell>Location</TableHeaderCell>
              <TableHeaderCell>Contact</TableHeaderCell>
              <TableHeaderCell>Email</TableHeaderCell>
              <TableHeaderCell>Phone</TableHeaderCell>
              <TableHeaderCell>Actions</TableHeaderCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {resolved.map((v) => (
              <TableRow key={v.address}>
                <TableCell>
                  <AddressCell>{truncAddr(v.address)}</AddressCell>
                </TableCell>
                <TableCell>{v.name}</TableCell>
                <TableCell>{v.location || '-'}</TableCell>
                <TableCell>{v.contact || '-'}</TableCell>
                <TableCell>{v.email || '-'}</TableCell>
                <TableCell>{v.phone || '-'}</TableCell>
                <TableCell>
                  <Button
                    size="small"
                    skin="danger"
                    onClick={() => dispatch(removeVendor(v.address))}
                  >
                    Remove
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : vendors.length > 0 ? (
        <p style={{ color: '#c88', fontSize: 14 }}>
          {vendors.length} vendor address(es) stored, but chain data not yet
          cached. Search above to refresh.
        </p>
      ) : (
        <p style={{ color: '#888', fontSize: 14 }}>
          No vendors yet. Publish a new one above or search the chain.
        </p>
      )}
    </Section>
  );
}

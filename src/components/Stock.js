import { useMemo, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import styled from '@emotion/styled';
import {
  Button,
  TextField,
  showSuccessDialog,
  showErrorDialog,
  apiCall,
} from 'nexus-module';

import {
  setStockPrice,
  setStockBalance,
  adjustStockBalance,
  addChainAsset,
} from 'actions/actionCreators';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHeaderCell,
  TableCell,
} from './StyledTable';
import {
  ASSET_TYPES,
  createStockBalanceAssetTemplate,
} from '../utils/distordiaStandards';
import { getAllMaterials } from '../utils/materialReferenceManager';

const Section = styled.div({ marginTop: '10px' });

const Controls = styled.div({
  display: 'grid',
  gridTemplateColumns: '1fr auto',
  gap: '10px',
  marginBottom: '15px',
});

const AddressCell = styled.span({
  fontFamily: 'monospace',
  fontSize: '11px',
  opacity: 0.7,
});

const Input = styled.input({
  padding: '4px 6px',
  width: 90,
});

const truncAddr = (addr) =>
  addr ? `${addr.substring(0, 8)}…${addr.substring(addr.length - 6)}` : '—';

export default function Stock() {
  const dispatch = useDispatch();
  const userStatus = useSelector((state) => state.nexus.userStatus);
  const chainAssets = useSelector((state) => state.mrp.chainAssets || []);
  const componentLibrary = useSelector((state) => state.mrp.componentLibrary || []);
  const localMaterials = useSelector((state) => state.mrp.materials);
  const stockBalances = useSelector((state) => state.mrp.stockBalances || {});

  const products = useMemo(
    () => getAllMaterials(chainAssets, localMaterials, componentLibrary),
    [chainAssets, localMaterials, componentLibrary]
  );

  const [filter, setFilter] = useState('');
  const [adjustDraft, setAdjustDraft] = useState({}); // { [productAddress]: { qty, reason } }
  const [publishing, setPublishing] = useState({}); // { [productAddress]: bool }

  const rows = useMemo(() => {
    const q = filter.trim().toLowerCase();
    return products
      .map((p) => {
        const addr = p.address || p.id;
        const sb = stockBalances[addr] || {
          productAddress: addr,
          quantity: 0,
          unitPrice: 0,
          currency: 'USD',
          unit: p.unit || 'pcs',
        };
        return { product: p, address: addr, balance: sb };
      })
      .filter((row) => {
        if (!q) return true;
        return (
          (row.product.name && row.product.name.toLowerCase().includes(q)) ||
          (row.address && row.address.toLowerCase().includes(q))
        );
      });
  }, [products, stockBalances, filter]);

  const handlePriceChange = (address, newPrice) => {
    const v = Number(newPrice);
    if (!Number.isFinite(v) || v < 0) return;
    const existing = stockBalances[address];
    dispatch(setStockPrice(address, v, existing?.currency || 'USD'));
  };

  const handleAdjust = (address) => {
    const d = adjustDraft[address] || {};
    const qty = Number(d.qty);
    if (!qty || !Number.isFinite(qty)) {
      showErrorDialog({ message: 'Enter a non-zero adjustment' });
      return;
    }
    dispatch(
      adjustStockBalance(address, qty, {
        timestamp: new Date().toISOString(),
        kind: 'adjust',
        ref: d.reason || 'manual',
      })
    );
    setAdjustDraft({ ...adjustDraft, [address]: { qty: '', reason: '' } });
  };

  const handlePublishOnChain = async (row) => {
    if (!userStatus) {
      showErrorDialog({ message: 'Log in to Nexus Wallet to publish stock on-chain' });
      return;
    }
    const { address, product, balance } = row;
    setPublishing({ ...publishing, [address]: true });
    try {
      const template = createStockBalanceAssetTemplate({
        productAddress: address,
        productName: product.name,
        quantity: balance.quantity,
        unit: balance.unit || product.unit || 'pcs',
        unitPrice: balance.unitPrice,
        currency: balance.currency || 'USD',
        location: balance.location || '',
      });
      const result = await apiCall('assets/create/asset', {
        name: template.name,
        data: template.data,
        format: template.format,
      });
      const stockAssetAddress = result?.address;
      if (stockAssetAddress) {
        const parsed = JSON.parse(template.data);
        dispatch(
          addChainAsset({
            address: stockAssetAddress,
            name: template.name,
            data: template.data,
            parsedData: parsed,
            assetType: ASSET_TYPES.STOCK_BALANCE,
            distordiaStatus: parsed.distordia,
          })
        );
        dispatch(
          setStockBalance(address, { ...balance, stockAssetAddress })
        );
        showSuccessDialog({
          message: 'Stock balance published on-chain',
          note: `Asset: ${stockAssetAddress}`,
        });
      } else {
        showSuccessDialog({
          message: 'Publish submitted',
          note: 'No address returned — refresh chain assets to see it.',
        });
      }
    } catch (e) {
      showErrorDialog({
        message: 'Failed to publish stock balance',
        note: e?.message || '',
      });
    } finally {
      setPublishing({ ...publishing, [address]: false });
    }
  };

  return (
    <Section>
      <h3>Stock balances</h3>
      <p>
        One balance per product, keyed by the product's Distordia asset
        address. Price is modifiable and is the source used at check-out.
        Publishing a balance creates a <code>stock_balance</code> asset
        on-chain for audit.
      </p>

      <Controls>
        <TextField
          label="Filter"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Product name or address…"
        />
        <div />
      </Controls>

      {rows.length === 0 ? (
        <p style={{ color: '#888', fontSize: 14 }}>
          No products yet. Register products via Purchasing or Products tabs.
        </p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHeaderCell>Product</TableHeaderCell>
              <TableHeaderCell>Address</TableHeaderCell>
              <TableHeaderCell>On hand</TableHeaderCell>
              <TableHeaderCell>Unit price</TableHeaderCell>
              <TableHeaderCell>Value</TableHeaderCell>
              <TableHeaderCell>Adjust</TableHeaderCell>
              <TableHeaderCell>On-chain</TableHeaderCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map(({ product, address, balance }) => {
              const unit = balance.unit || product.unit || 'pcs';
              const draft = adjustDraft[address] || { qty: '', reason: '' };
              return (
                <TableRow key={address}>
                  <TableCell>{product.name}</TableCell>
                  <TableCell>
                    <AddressCell>{truncAddr(address)}</AddressCell>
                  </TableCell>
                  <TableCell>
                    {Number(balance.quantity) || 0} {unit}
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      step="0.01"
                      value={balance.unitPrice || 0}
                      onChange={(e) => handlePriceChange(address, e.target.value)}
                    />{' '}
                    {balance.currency || 'USD'}
                  </TableCell>
                  <TableCell>
                    {((Number(balance.quantity) || 0) * (Number(balance.unitPrice) || 0)).toFixed(2)}{' '}
                    {balance.currency || 'USD'}
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      placeholder="Δ qty"
                      value={draft.qty}
                      onChange={(e) =>
                        setAdjustDraft({
                          ...adjustDraft,
                          [address]: { ...draft, qty: e.target.value },
                        })
                      }
                    />
                    <Input
                      placeholder="reason"
                      value={draft.reason}
                      onChange={(e) =>
                        setAdjustDraft({
                          ...adjustDraft,
                          [address]: { ...draft, reason: e.target.value },
                        })
                      }
                      style={{ marginLeft: 4 }}
                    />
                    <Button
                      size="small"
                      onClick={() => handleAdjust(address)}
                      style={{ marginLeft: 4 }}
                    >
                      Apply
                    </Button>
                  </TableCell>
                  <TableCell>
                    {balance.stockAssetAddress ? (
                      <AddressCell title={balance.stockAssetAddress}>
                        {truncAddr(balance.stockAssetAddress)}
                      </AddressCell>
                    ) : (
                      <Button
                        size="small"
                        onClick={() => handlePublishOnChain({ product, address, balance })}
                        disabled={!!publishing[address]}
                      >
                        {publishing[address] ? 'Publishing…' : 'Publish'}
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}
    </Section>
  );
}

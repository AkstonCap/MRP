import { useSelector, useDispatch } from 'react-redux';
import styled from '@emotion/styled';
import { Panel } from 'nexus-module';

import { setActiveTab } from 'actions/actionCreators';

import { getAllMaterials } from '../utils/materialReferenceManager';
import ComponentSearch from './ComponentSearch';
import Vendors from './Vendors';
import Purchasing from './Purchasing';
import Stock from './Stock';
import Checkout from './Checkout';
import IncomeReport from './IncomeReport';
import WarehouseInventory from './WarehouseInventory';
import PickingBOM from './PickingBOM';
import Invoicing from './Invoicing';
import ProductionPlanning from './ProductionPlanning';

// Store mode — tabs we show in the UI.  The hidden modules remain in the
// build (BOM / Warehouse / Picking / Invoicing / Planning) so they can be
// re-enabled by flipping the flag below.
const SHOW_LEGACY_MANUFACTURING = false;

const STORE_TABS = [
  { key: 'products', label: 'Products' },
  { key: 'vendors', label: 'Vendors' },
  { key: 'purchasing', label: 'Purchasing' },
  { key: 'stock', label: 'Stock' },
  { key: 'checkout', label: 'Check-out' },
  { key: 'income', label: 'Income' },
];

const LEGACY_TABS = [
  { key: 'warehouse', label: 'Warehouse' },
  { key: 'bom', label: 'BOM' },
  { key: 'picking', label: 'Picking' },
  { key: 'invoicing', label: 'Invoicing' },
  { key: 'planning', label: 'Planning' },
];

const TabContainer = styled.div({
  display: 'flex',
  flexWrap: 'wrap',
  borderBottom: '1px solid #ccc',
  marginBottom: '20px',
});

const TabButton = styled.button(({ active, theme }) => ({
  padding: '8px 14px',
  border: 'none',
  fontSize: '13px',
  backgroundColor: active ? theme.primary : 'transparent',
  color: active ? theme.primaryAccent : theme.foreground,
  cursor: 'pointer',
  borderBottom: active ? `2px solid ${theme.primary}` : 'none',
  '&:hover': {
    backgroundColor: active ? theme.primary : theme.mixer(0.125),
  },
}));

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

const DEFAULT_TAB = 'products';

export default function MRPInterface() {
  const dispatch = useDispatch();
  const activeTabRaw = useSelector((state) => state.mrp.activeTab);
  const tabs = SHOW_LEGACY_MANUFACTURING
    ? [...STORE_TABS, ...LEGACY_TABS]
    : STORE_TABS;
  const validKeys = new Set(tabs.map((t) => t.key));
  // Legacy state may have persisted an older tab key like 'search' — fall back.
  const activeTab = validKeys.has(activeTabRaw) ? activeTabRaw : DEFAULT_TAB;

  const localMaterials = useSelector((state) => state.mrp.materials);
  const chainAssets = useSelector((state) => state.mrp.chainAssets || []);
  const componentLibrary = useSelector((state) => state.mrp.componentLibrary || []);
  const vendors = useSelector((state) => state.mrp.vendors || []);
  const stockBalances = useSelector((state) => state.mrp.stockBalances || {});
  const sales = useSelector((state) => state.mrp.sales || []);

  const materials = getAllMaterials(chainAssets, localMaterials, componentLibrary);

  const totalProducts = materials.length;
  const totalStockValue = Object.values(stockBalances).reduce(
    (t, b) => t + (Number(b.quantity) || 0) * (Number(b.unitPrice) || 0),
    0
  );
  const lowStockItems = Object.values(stockBalances).filter(
    (b) => Number(b.quantity) > 0 && Number(b.quantity) < 10
  ).length;
  const stockCurrency =
    Object.values(stockBalances).find((b) => b.currency)?.currency || 'USD';

  const today = (() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  })();
  const todayRevenue = sales.reduce((t, s) => {
    return new Date(s.timestamp).getTime() >= today
      ? t + (Number(s.total) || 0)
      : t;
  }, 0);

  return (
    <Panel
      title="MRP — Local Vendor Store"
      icon={{ url: 'dist/icons/inventory.svg', id: 'mrp-icon' }}
    >
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <p>
          Register local-vendor products on Nexus (Distordia master data, asset
          address = product ID), track stock on-chain, and report on income.
        </p>
      </div>

      <StatsContainer>
        <StatCard>
          <div style={{ fontSize: '24px', fontWeight: 'bold' }}>
            {totalProducts}
          </div>
          <div>Products</div>
        </StatCard>
        <StatCard>
          <div style={{ fontSize: '24px', fontWeight: 'bold' }}>
            {vendors.length}
          </div>
          <div>Vendors</div>
        </StatCard>
        <StatCard>
          <div style={{ fontSize: '24px', fontWeight: 'bold' }}>
            {totalStockValue.toFixed(2)} {stockCurrency}
          </div>
          <div>Stock value</div>
        </StatCard>
        <StatCard>
          <div style={{ fontSize: '24px', fontWeight: 'bold' }}>
            {lowStockItems}
          </div>
          <div>Low stock</div>
        </StatCard>
        <StatCard>
          <div style={{ fontSize: '24px', fontWeight: 'bold' }}>
            {todayRevenue.toFixed(2)} {stockCurrency}
          </div>
          <div>Today's revenue</div>
        </StatCard>
      </StatsContainer>

      <TabContainer>
        {tabs.map((t) => (
          <TabButton
            key={t.key}
            active={activeTab === t.key}
            onClick={() => dispatch(setActiveTab(t.key))}
          >
            {t.label}
          </TabButton>
        ))}
      </TabContainer>

      {activeTab === 'products' && <ComponentSearch />}
      {activeTab === 'vendors' && <Vendors />}
      {activeTab === 'purchasing' && <Purchasing />}
      {activeTab === 'stock' && <Stock />}
      {activeTab === 'checkout' && <Checkout />}
      {activeTab === 'income' && <IncomeReport />}

      {SHOW_LEGACY_MANUFACTURING && (
        <>
          {activeTab === 'warehouse' && <WarehouseInventory />}
          {activeTab === 'picking' && <PickingBOM />}
          {activeTab === 'invoicing' && <Invoicing />}
          {activeTab === 'planning' && <ProductionPlanning />}
          {activeTab === 'bom' && (
            <div style={{ padding: 20 }}>
              BOM module is hidden in store mode. Toggle{' '}
              <code>SHOW_LEGACY_MANUFACTURING</code> in{' '}
              <code>MRPInterface.js</code> to re-enable.
            </div>
          )}
        </>
      )}
    </Panel>
  );
}

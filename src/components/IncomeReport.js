import { useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import styled from '@emotion/styled';
import { TextField } from 'nexus-module';

import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHeaderCell,
  TableCell,
} from './StyledTable';

const Section = styled.div({ marginTop: '10px' });

const Controls = styled.div({
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
  gap: '12px',
  marginBottom: '20px',
  padding: '15px',
  border: '1px solid #ccc',
  borderRadius: '5px',
  alignItems: 'end',
});

const Kpis = styled.div({
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
  gap: '12px',
  marginBottom: '20px',
});

const Kpi = styled.div(({ theme }) => ({
  padding: '15px',
  border: `1px solid ${theme.mixer ? theme.mixer(0.125) : '#ddd'}`,
  borderRadius: '5px',
  textAlign: 'center',
  backgroundColor: theme.mixer ? theme.mixer(0.0625) : '#f9f9f9',
}));

const KpiValue = styled.div({ fontSize: 22, fontWeight: 'bold' });
const KpiLabel = styled.div({ fontSize: 12, opacity: 0.7 });

const startOfDay = (d) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
};
const endOfDay = (d) => {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
};
const toIso = (d) => {
  const x = new Date(d);
  const pad = (n) => String(n).padStart(2, '0');
  return `${x.getFullYear()}-${pad(x.getMonth() + 1)}-${pad(x.getDate())}`;
};

const PERIODS = {
  today: () => {
    const now = new Date();
    return { from: startOfDay(now), to: endOfDay(now), label: 'Today' };
  },
  week: () => {
    const now = new Date();
    const from = new Date(now);
    from.setDate(now.getDate() - 6);
    return { from: startOfDay(from), to: endOfDay(now), label: 'Last 7 days' };
  },
  month: () => {
    const now = new Date();
    const from = new Date(now);
    from.setDate(now.getDate() - 29);
    return { from: startOfDay(from), to: endOfDay(now), label: 'Last 30 days' };
  },
  ytd: () => {
    const now = new Date();
    const from = new Date(now.getFullYear(), 0, 1);
    return { from, to: endOfDay(now), label: 'Year-to-date' };
  },
};

export default function IncomeReport() {
  const sales = useSelector((state) => state.mrp.sales || []);
  const purchases = useSelector((state) => state.mrp.purchases || []);

  const [preset, setPreset] = useState('month');
  const defaultWindow = PERIODS[preset]();
  const [fromDate, setFromDate] = useState(toIso(defaultWindow.from));
  const [toDate, setToDate] = useState(toIso(defaultWindow.to));

  const applyPreset = (key) => {
    setPreset(key);
    const w = PERIODS[key]();
    setFromDate(toIso(w.from));
    setToDate(toIso(w.to));
  };

  const from = startOfDay(fromDate).getTime();
  const to = endOfDay(toDate).getTime();

  // Last known unit cost per product, for crude margin estimate
  const costByProduct = useMemo(() => {
    const acc = {};
    purchases.forEach((p) => {
      if (!p.productAddress) return;
      const existing = acc[p.productAddress];
      if (!existing || new Date(p.timestamp) > new Date(existing.timestamp)) {
        acc[p.productAddress] = { unitCost: Number(p.unitCost) || 0, timestamp: p.timestamp };
      }
    });
    return acc;
  }, [purchases]);

  const filteredSales = useMemo(
    () =>
      sales.filter((s) => {
        const t = new Date(s.timestamp).getTime();
        return t >= from && t <= to;
      }),
    [sales, from, to]
  );

  const currencyOf = filteredSales[0]?.currency || 'USD';

  const totalRevenue = filteredSales.reduce(
    (t, s) => t + Number(s.total) || t,
    0
  );
  const totalUnits = filteredSales.reduce(
    (t, s) => t + (Number(s.quantity) || 0),
    0
  );
  const totalCost = filteredSales.reduce((t, s) => {
    const unitCost = costByProduct[s.productAddress]?.unitCost || 0;
    return t + unitCost * (Number(s.quantity) || 0);
  }, 0);
  const grossProfit = totalRevenue - totalCost;
  const receipts = new Set(filteredSales.map((s) => s.reference)).size;

  // Per-product breakdown
  const byProduct = useMemo(() => {
    const acc = {};
    filteredSales.forEach((s) => {
      const key = s.productAddress;
      if (!acc[key]) {
        acc[key] = {
          productAddress: key,
          productName: s.productName,
          quantity: 0,
          revenue: 0,
          cost: 0,
          currency: s.currency || 'USD',
        };
      }
      const qty = Number(s.quantity) || 0;
      const unitCost = costByProduct[key]?.unitCost || 0;
      acc[key].quantity += qty;
      acc[key].revenue += Number(s.total) || 0;
      acc[key].cost += unitCost * qty;
    });
    return Object.values(acc).sort((a, b) => b.revenue - a.revenue);
  }, [filteredSales, costByProduct]);

  return (
    <Section>
      <h3>Income report</h3>
      <p>
        Revenue is aggregated from recorded check-out sales. Cost is the last
        known unit cost from purchase records — gross profit is indicative, not
        an accounting figure.
      </p>

      <Controls>
        <div>
          <label style={{ fontSize: 12 }}>Period</label>
          <select
            value={preset}
            onChange={(e) => applyPreset(e.target.value)}
            style={{ padding: '8px', width: '100%' }}
          >
            <option value="today">Today</option>
            <option value="week">Last 7 days</option>
            <option value="month">Last 30 days</option>
            <option value="ytd">Year-to-date</option>
            <option value="custom">Custom</option>
          </select>
        </div>
        <TextField
          label="From"
          type="date"
          value={fromDate}
          onChange={(e) => {
            setFromDate(e.target.value);
            setPreset('custom');
          }}
        />
        <TextField
          label="To"
          type="date"
          value={toDate}
          onChange={(e) => {
            setToDate(e.target.value);
            setPreset('custom');
          }}
        />
      </Controls>

      <Kpis>
        <Kpi>
          <KpiValue>
            {totalRevenue.toFixed(2)} {currencyOf}
          </KpiValue>
          <KpiLabel>Revenue</KpiLabel>
        </Kpi>
        <Kpi>
          <KpiValue>
            {grossProfit.toFixed(2)} {currencyOf}
          </KpiValue>
          <KpiLabel>
            Gross profit{' '}
            {totalRevenue > 0
              ? `(${((grossProfit / totalRevenue) * 100).toFixed(1)}%)`
              : ''}
          </KpiLabel>
        </Kpi>
        <Kpi>
          <KpiValue>{totalUnits}</KpiValue>
          <KpiLabel>Units sold</KpiLabel>
        </Kpi>
        <Kpi>
          <KpiValue>{receipts}</KpiValue>
          <KpiLabel>Receipts</KpiLabel>
        </Kpi>
      </Kpis>

      <h4>By product</h4>
      {byProduct.length === 0 ? (
        <p style={{ color: '#888', fontSize: 14 }}>No sales in this period.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHeaderCell>Product</TableHeaderCell>
              <TableHeaderCell>Units</TableHeaderCell>
              <TableHeaderCell>Revenue</TableHeaderCell>
              <TableHeaderCell>Cost (est.)</TableHeaderCell>
              <TableHeaderCell>Gross profit</TableHeaderCell>
              <TableHeaderCell>Margin</TableHeaderCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {byProduct.map((row) => {
              const profit = row.revenue - row.cost;
              const margin =
                row.revenue > 0 ? (profit / row.revenue) * 100 : 0;
              return (
                <TableRow key={row.productAddress}>
                  <TableCell>{row.productName}</TableCell>
                  <TableCell>{row.quantity}</TableCell>
                  <TableCell>
                    {row.revenue.toFixed(2)} {row.currency}
                  </TableCell>
                  <TableCell>
                    {row.cost.toFixed(2)} {row.currency}
                  </TableCell>
                  <TableCell>
                    {profit.toFixed(2)} {row.currency}
                  </TableCell>
                  <TableCell>{margin.toFixed(1)}%</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}
    </Section>
  );
}

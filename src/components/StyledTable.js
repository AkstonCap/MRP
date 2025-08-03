import styled from '@emotion/styled';

export const Table = styled.table(({ theme }) => ({
  width: '100%',
  borderCollapse: 'collapse',
  marginTop: '10px',
  backgroundColor: theme.background || '#fff',
  border: `1px solid ${theme.mixer ? theme.mixer(0.125) : '#ddd'}`,
  borderRadius: '5px',
  overflow: 'hidden',
}));

export const TableHeader = styled.thead(({ theme }) => ({
  backgroundColor: theme.primary || '#007acc',
  color: theme.primaryAccent || '#fff',
}));

export const TableBody = styled.tbody({});

export const TableRow = styled.tr(({ theme }) => ({
  '&:nth-of-type(even)': {
    backgroundColor: theme.mixer ? theme.mixer(0.03125) : '#f9f9f9',
  },
  '&:hover': {
    backgroundColor: theme.mixer ? theme.mixer(0.0625) : '#f0f0f0',
  },
}));

export const TableHeaderCell = styled.th({
  padding: '12px 15px',
  textAlign: 'left',
  fontWeight: 'bold',
  borderBottom: '2px solid rgba(255,255,255,0.2)',
});

export const TableCell = styled.td(({ theme }) => ({
  padding: '10px 15px',
  borderBottom: `1px solid ${theme.mixer ? theme.mixer(0.125) : '#eee'}`,
  verticalAlign: 'middle',
}));

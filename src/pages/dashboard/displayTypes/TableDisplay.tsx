import {
  Box,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';

interface TableDisplayProps {
  data: Array<Record<string, unknown>>;
  columns?: string[];
  maxHeight?: number;
}

function formatCellValue(value: unknown): React.ReactNode {
  if (value == null) return '';
  if (typeof value === 'boolean') {
    return (
      <Chip
        size="small"
        label={value ? 'True' : 'False'}
        color={value ? 'success' : 'default'}
        variant="outlined"
      />
    );
  }
  if (typeof value === 'number') return new Intl.NumberFormat().format(value);
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

export function TableDisplay({ data, columns, maxHeight = 300 }: TableDisplayProps) {
  if (!data || data.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography variant="body2" color="text.secondary">
          No data
        </Typography>
      </Box>
    );
  }

  const resolvedColumns = columns ?? Object.keys(data[0]);

  return (
    <TableContainer sx={{ maxHeight }} role="table" aria-label="Data table">
      <Table size="small" stickyHeader>
        <TableHead>
          <TableRow>
            {resolvedColumns.map((col) => (
              <TableCell key={col} sx={{ fontWeight: 600, whiteSpace: 'nowrap' }}>
                {col}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {data.map((row, rowIndex) => (
            <TableRow key={rowIndex} hover>
              {resolvedColumns.map((col) => (
                <TableCell key={`${rowIndex}-${col}`} sx={{ whiteSpace: 'nowrap' }}>
                  {formatCellValue(row[col])}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
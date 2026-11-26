import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Box,
  Button,
  Paper,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import { EmptyState } from '@/components/shared/EmptyState';
import { fetchArpTable, systemQueryKeys } from '@/api/modules/system';

interface ArpTablePanelProps {
  panelId: string;
}

export function ArpTablePanel({ panelId }: ArpTablePanelProps) {
  const [searchText, setSearchText] = useState('');

  const {
    data: arpData,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: systemQueryKeys.arpTable,
    queryFn: fetchArpTable,
  });

  const entries = arpData?.data ?? [];

  const filteredEntries = useMemo(() => {
    if (!searchText.trim()) return entries;
    const lowerSearch = searchText.toLowerCase().trim();
    return entries.filter(
      (e) =>
        e.ip_address.toLowerCase().includes(lowerSearch) ||
        e.mac_address.toLowerCase().includes(lowerSearch) ||
        e.interface.toLowerCase().includes(lowerSearch),
    );
  }, [entries, searchText]);

  if (isLoading) {
    return (
      <Paper sx={{ p: 3 }} data-panel-id={panelId}>
        <Skeleton height={48} sx={{ mb: 2 }} />
        <Skeleton height={300} />
      </Paper>
    );
  }

  if (isError) {
    return (
      <Paper sx={{ p: 4, textAlign: 'center' }} data-panel-id={panelId}>
        <Typography color="error" sx={{ mb: 2 }}>
          Failed to load ARP table.
        </Typography>
        <Button variant="outlined" onClick={() => refetch()}>
          Retry
        </Button>
      </Paper>
    );
  }

  return (
    <Box data-panel-id={panelId}>
      {/* Search */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <TextField
            size="small"
            placeholder="Search by IP, MAC, or interface..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            sx={{ minWidth: 300 }}
            aria-label="Search ARP table"
          />
          <Button
            startIcon={<RefreshIcon />}
            onClick={() => refetch()}
            aria-label="Refresh ARP table"
          >
            Refresh
          </Button>
          <Typography variant="body2" color="text.secondary" sx={{ ml: 'auto' }}>
            {filteredEntries.length} of {entries.length} entries
          </Typography>
        </Box>
      </Paper>

      {/* Table */}
      <Paper>
        {filteredEntries.length === 0 ? (
          <EmptyState message="No ARP entries match your search." />
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>IP Address</TableCell>
                  <TableCell>MAC Address</TableCell>
                  <TableCell>Interface</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Expires</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredEntries.map((entry) => (
                  <TableRow key={`${entry.ip_address}-${entry.mac_address}`}>
                    <TableCell>{entry.ip_address}</TableCell>
                    <TableCell sx={{ fontFamily: 'monospace' }}>{entry.mac_address}</TableCell>
                    <TableCell>{entry.interface.toUpperCase()}</TableCell>
                    <TableCell>
                      {entry.type.charAt(0).toUpperCase() + entry.type.slice(1)}
                    </TableCell>
                    <TableCell>{entry.expires ?? '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>
    </Box>
  );
}
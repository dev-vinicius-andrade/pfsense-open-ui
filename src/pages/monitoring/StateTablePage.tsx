import { useState, useCallback } from 'react';
import {
  Box,
  Paper,
  TextField,
  IconButton,
  Typography,
  Alert,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import DeleteIcon from '@mui/icons-material/Delete';
import { fetchFirewallStates, killFirewallState } from '@/api/modules/monitoring';
import type { FirewallState } from '@/api/modules/monitoring';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';

const ROWS_PER_PAGE_OPTIONS = [25, 50, 100];

export function StateTablePage() {
  const [states, setStates] = useState<FirewallState[]>([]);
  const [page, setPage] = useState(0);
  const [perPage, setPerPage] = useState(25);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [killTarget, setKillTarget] = useState<FirewallState | null>(null);
  const [isKilling, setIsKilling] = useState(false);

  const loadStates = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetchFirewallStates({
        page: page + 1,
        perPage,
        search: search || undefined,
      });
      setStates(response.data ?? []);
      setTotal(response.total ?? 0);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch state table');
    } finally {
      setIsLoading(false);
    }
  }, [page, perPage, search]);

  // Load on mount and when filters change
  useState(() => {
    void loadStates();
  });

  const handleKillState = async () => {
    if (!killTarget) return;
    setIsKilling(true);
    try {
      await killFirewallState(killTarget.id);
      setStates((prev) => prev.filter((s) => s.id !== killTarget.id));
      setTotal((prev) => Math.max(0, prev - 1));
      setKillTarget(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to kill state');
    } finally {
      setIsKilling(false);
    }
  };

  const handlePageChange = (_: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handlePerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(0);
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Paper sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
        <TextField
          size="small"
          placeholder="Search states (IP, port, protocol)..."
          value={search}
          onChange={(e) => handleSearchChange(e.target.value)}
          sx={{ minWidth: 300 }}
        />

        <Box sx={{ flex: 1 }} />

        <IconButton onClick={loadStates} aria-label="Refresh state table" disabled={isLoading}>
          <RefreshIcon />
        </IconButton>
      </Paper>

      {error && (
        <Alert severity="error" onClose={() => setError(null)}>
          {error}
          <Button size="small" onClick={loadStates} sx={{ ml: 1 }}>
            Retry
          </Button>
        </Alert>
      )}

      <TableContainer component={Paper}>
        <Table stickyHeader size="small">
          <TableHead>
            <TableRow>
              <TableCell>Protocol</TableCell>
              <TableCell>Source</TableCell>
              <TableCell>Destination</TableCell>
              <TableCell>State</TableCell>
              <TableCell align="right">Age (s)</TableCell>
              <TableCell align="right">Expiry (s)</TableCell>
              <TableCell align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading && states.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  <Typography color="text.secondary" sx={{ py: 4 }}>
                    Loading state table...
                  </Typography>
                </TableCell>
              </TableRow>
            ) : states.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  <Typography color="text.secondary" sx={{ py: 4 }}>
                    No active states found
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              states.map((state) => (
                <TableRow key={state.id} hover>
                  <TableCell>
                    <Chip label={state.protocol.toUpperCase()} size="small" variant="outlined" />
                  </TableCell>
                  <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
                    {state.source}:{state['source-port']}
                  </TableCell>
                  <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
                    {state.destination}:{state['dest-port']}
                  </TableCell>
                  <TableCell>{state.state}</TableCell>
                  <TableCell align="right">{state.age}</TableCell>
                  <TableCell align="right">{state.expiry}</TableCell>
                  <TableCell align="center">
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => setKillTarget(state)}
                      aria-label={`Kill state ${state.id}`}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        <TablePagination
          component="div"
          count={total}
          page={page}
          onPageChange={handlePageChange}
          rowsPerPage={perPage}
          onRowsPerPageChange={handlePerPageChange}
          rowsPerPageOptions={ROWS_PER_PAGE_OPTIONS}
        />
      </TableContainer>

      <ConfirmDialog
        open={killTarget !== null}
        title="Kill Firewall State"
        message={
          killTarget
            ? `Are you sure you want to kill this ${killTarget.protocol.toUpperCase()} state from ${killTarget.source} to ${killTarget.destination}?`
            : ''
        }
        confirmLabel={isKilling ? 'Killing...' : 'Kill State'}
        cancelLabel="Cancel"
        onConfirm={handleKillState}
        onCancel={() => setKillTarget(null)}
        destructive
      />
    </Box>
  );
}
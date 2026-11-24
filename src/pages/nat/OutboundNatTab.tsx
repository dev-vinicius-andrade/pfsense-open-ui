import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import {
  Box,
  Button,
  Chip,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import RefreshIcon from '@mui/icons-material/Refresh';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { EmptyState } from '@/components/shared/EmptyState';
import { PendingChangesBanner } from '@/components/shared/PendingChangesBanner';
import { useApplyChanges } from '@/hooks/useApplyChanges';
import { getErrorMessage } from '@/utils/errorMessage';
import {
  fetchOutboundNatMappings,
  fetchOutboundNatMode,
  updateOutboundNatMode,
  deleteOutboundNatMapping,
  type OutboundNatMapping,
  type NatMode,
} from '@/api/modules/nat';
import { OutboundNatFormDialog } from './OutboundNatFormDialog';

const MAPPINGS_QUERY_KEY = ['nat', 'outbound-mappings'];
const MODE_QUERY_KEY = ['nat', 'outbound-mode'];

export function OutboundNatTab() {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  const [hasPendingChanges, setHasPendingChanges] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingMapping, setEditingMapping] = useState<OutboundNatMapping | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<OutboundNatMapping | null>(null);

  const { data: mappings, isLoading: mappingsLoading, isError: mappingsError, error: mappingsErr, refetch } = useQuery({
    queryKey: MAPPINGS_QUERY_KEY,
    queryFn: fetchOutboundNatMappings,
  });

  const { data: natMode, isLoading: modeLoading } = useQuery({
    queryKey: MODE_QUERY_KEY,
    queryFn: fetchOutboundNatMode,
  });

  const modeMutation = useMutation({
    mutationFn: (mode: NatMode) => updateOutboundNatMode(mode),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: MODE_QUERY_KEY });
      setHasPendingChanges(true);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteOutboundNatMapping(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: MAPPINGS_QUERY_KEY });
      setHasPendingChanges(true);
      setDeleteTarget(null);
    },
    onError: (error: unknown) => {
      enqueueSnackbar(getErrorMessage(error, 'Failed to delete outbound NAT mapping'), { variant: 'error' });
    },
  });

  const applyChanges = useApplyChanges({
    endpoint: '/firewall/apply',
    invalidateKeys: [MAPPINGS_QUERY_KEY, MODE_QUERY_KEY],
    onSuccess: () => setHasPendingChanges(false),
  });

  const handleCreate = () => {
    setEditingMapping(null);
    setDialogOpen(true);
  };

  const handleEdit = (mapping: OutboundNatMapping) => {
    setEditingMapping(mapping);
    setDialogOpen(true);
  };

  const handleModeChange = useCallback(
    (event: { target: { value: string } }) => {
      modeMutation.mutate(event.target.value as NatMode);
    },
    [modeMutation],
  );

  if (mappingsLoading || modeLoading) {
    return (
      <Paper sx={{ p: 2 }}>
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} height={48} sx={{ mb: 1 }} />
        ))}
      </Paper>
    );
  }

  if (mappingsError) {
    return (
      <Paper sx={{ p: 4, textAlign: 'center' }}>
        <Typography color="error" sx={{ mb: 2 }}>
          Failed to load outbound NAT:{' '}
          {mappingsErr instanceof Error ? mappingsErr.message : 'Unknown error'}
        </Typography>
        <Button variant="outlined" onClick={() => void refetch()}>
          Retry
        </Button>
      </Paper>
    );
  }

  const modeDescription: Record<NatMode, string> = {
    automatic: 'Outbound NAT is managed automatically by pfSense.',
    hybrid: 'Automatic rules apply first, then manual rules below.',
    manual: 'Only manually defined rules below are used for outbound NAT.',
  };

  return (
    <Box>
      <PendingChangesBanner
        hasChanges={hasPendingChanges}
        onApply={() => applyChanges.mutate()}
        isApplying={applyChanges.isPending}
      />

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <FormControl size="small" sx={{ minWidth: 180 }}>
          <InputLabel id="nat-mode-label">NAT Mode</InputLabel>
          <Select
            labelId="nat-mode-label"
            value={natMode ?? 'automatic'}
            label="NAT Mode"
            onChange={handleModeChange}
            disabled={modeMutation.isPending || applyChanges.isPending}
          >
            <MenuItem value="automatic">Automatic</MenuItem>
            <MenuItem value="hybrid">Hybrid</MenuItem>
            <MenuItem value="manual">Manual</MenuItem>
          </Select>
        </FormControl>
        <Typography variant="body2" color="text.secondary" sx={{ flex: 1 }}>
          {modeDescription[natMode ?? 'automatic']}
        </Typography>
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mb: 2 }}>
        <Button startIcon={<RefreshIcon />} onClick={() => void refetch()} disabled={mappingsLoading}>
          Refresh
        </Button>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleCreate}>
          Add Mapping
        </Button>
      </Box>

      {(mappings ?? []).length === 0 ? (
        <Paper>
          <EmptyState message="No outbound NAT mappings configured." />
        </Paper>
      ) : (
        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ width: 80 }}>Status</TableCell>
                <TableCell>Interface</TableCell>
                <TableCell>Protocol</TableCell>
                <TableCell>Source</TableCell>
                <TableCell>Destination</TableCell>
                <TableCell>Translation</TableCell>
                <TableCell>Description</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {(mappings ?? []).map((mapping) => (
                <TableRow key={mapping.id}>
                  <TableCell>
                    <Chip
                      label={mapping.disabled ? 'Disabled' : 'Enabled'}
                      color={mapping.disabled ? 'default' : 'success'}
                      size="small"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>{mapping.interface.toUpperCase()}</TableCell>
                  <TableCell>{mapping.protocol.toUpperCase()}</TableCell>
                  <TableCell>
                    <Typography variant="body2" noWrap sx={{ maxWidth: 150 }}>
                      {mapping.source || '*'}
                      {mapping.sourceport ? `:${mapping.sourceport}` : ''}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" noWrap sx={{ maxWidth: 150 }}>
                      {mapping.destination || '*'}
                      {mapping.destport ? `:${mapping.destport}` : ''}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" noWrap sx={{ maxWidth: 150 }}>
                      {mapping.nonat ? 'Do not NAT' : `${mapping.target}${mapping.targetport ? `:${mapping.targetport}` : ''}`}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" noWrap sx={{ maxWidth: 200 }} title={mapping.descr}>
                      {mapping.descr || '-'}
                    </Typography>
                  </TableCell>
                  <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                    <Tooltip title="Edit">
                      <IconButton size="small" onClick={() => handleEdit(mapping)} aria-label="Edit mapping">
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton size="small" color="error" onClick={() => setDeleteTarget(mapping)} aria-label="Delete mapping">
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <OutboundNatFormDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        initialValues={editingMapping}
        queryKeyToInvalidate={MAPPINGS_QUERY_KEY}
        onSaved={() => setHasPendingChanges(true)}
      />

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Delete Outbound NAT Mapping"
        message="Are you sure you want to delete this outbound NAT mapping?"
        confirmLabel="Delete"
        destructive
        onConfirm={() => {
          if (deleteTarget) deleteMutation.mutate(deleteTarget.id);
        }}
        onCancel={() => setDeleteTarget(null)}
      />
    </Box>
  );
}
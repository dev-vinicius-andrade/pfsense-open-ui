import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import {
  Box,
  Button,
  Chip,
  IconButton,
  Paper,
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
  fetchOneToOneNatMappings,
  deleteOneToOneNatMapping,
  type OneToOneNatMapping,
} from '@/api/modules/nat';
import { OneToOneNatFormDialog } from './OneToOneNatFormDialog';

const QUERY_KEY = ['nat', 'one-to-one-mappings'];

export function OneToOneNatTab() {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  const [hasPendingChanges, setHasPendingChanges] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingMapping, setEditingMapping] = useState<OneToOneNatMapping | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<OneToOneNatMapping | null>(null);

  const { data: mappings, isLoading, isError, error, refetch } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: fetchOneToOneNatMappings,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteOneToOneNatMapping(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      setHasPendingChanges(true);
      setDeleteTarget(null);
    },
    onError: (error: unknown) => {
      enqueueSnackbar(getErrorMessage(error, 'Failed to delete 1:1 NAT mapping'), { variant: 'error' });
    },
  });

  const applyChanges = useApplyChanges({
    endpoint: '/firewall/apply',
    invalidateKeys: [QUERY_KEY],
    onSuccess: () => setHasPendingChanges(false),
  });

  const handleCreate = () => {
    setEditingMapping(null);
    setDialogOpen(true);
  };

  const handleEdit = (mapping: OneToOneNatMapping) => {
    setEditingMapping(mapping);
    setDialogOpen(true);
  };

  return (
    <Box>
      <PendingChangesBanner
        hasChanges={hasPendingChanges}
        onApply={() => applyChanges.mutate()}
        isApplying={applyChanges.isPending}
      />

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mb: 2 }}>
        <Button startIcon={<RefreshIcon />} onClick={() => void refetch()} disabled={isLoading}>
          Refresh
        </Button>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleCreate}>
          Add Mapping
        </Button>
      </Box>

      {isLoading && (
        <Paper sx={{ p: 2 }}>
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} height={48} sx={{ mb: 1 }} />
          ))}
        </Paper>
      )}

      {isError && (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography color="error" sx={{ mb: 2 }}>
            Failed to load 1:1 NAT mappings:{' '}
            {error instanceof Error ? error.message : 'Unknown error'}
          </Typography>
          <Button variant="outlined" onClick={() => void refetch()}>
            Retry
          </Button>
        </Paper>
      )}

      {!isLoading && !isError && (mappings ?? []).length === 0 && (
        <Paper>
          <EmptyState message="No 1:1 NAT mappings configured. Add a mapping to get started." />
        </Paper>
      )}

      {!isLoading && !isError && (mappings ?? []).length > 0 && (
        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ width: 80 }}>Status</TableCell>
                <TableCell>Interface</TableCell>
                <TableCell>External IP</TableCell>
                <TableCell>Internal IP</TableCell>
                <TableCell>Destination</TableCell>
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
                  <TableCell>{mapping.external}</TableCell>
                  <TableCell>{mapping.source}</TableCell>
                  <TableCell>{mapping.destination || '*'}</TableCell>
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
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => setDeleteTarget(mapping)}
                        aria-label="Delete mapping"
                      >
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

      <OneToOneNatFormDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        initialValues={editingMapping}
        queryKeyToInvalidate={QUERY_KEY}
        onSaved={() => setHasPendingChanges(true)}
      />

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Delete 1:1 NAT Mapping"
        message={`Are you sure you want to delete the 1:1 NAT mapping for ${deleteTarget?.external}?`}
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
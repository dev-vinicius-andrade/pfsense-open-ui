import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
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
import { StatusChip } from '@/components/shared/StatusChip';
import { PendingChangesBanner } from '@/components/shared/PendingChangesBanner';
import { useApplyChanges } from '@/hooks/useApplyChanges';
import {
  fetchIpsecPhase1s,
  fetchIpsecPhase2s,
  fetchIpsecSaStatus,
  deleteIpsecPhase1,
  deleteIpsecPhase2,
  vpnQueryKeys,
  type IpsecPhase1,
  type IpsecSaStatus,
} from '@/api/modules/vpn';
import { IpsecPhase1Form, type IpsecPhase1FormData } from './IpsecPhase1Form';
import {
  createIpsecPhase1,
  updateIpsecPhase1,
} from '@/api/modules/vpn';

export function IpsecTab() {
  const queryClient = useQueryClient();
  const [hasPendingChanges, setHasPendingChanges] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPhase1, setEditingPhase1] = useState<IpsecPhase1 | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'phase1' | 'phase2'; id: number; label: string } | null>(null);

  const { data: phase1sData, isLoading: phase1sLoading, isError: phase1sError, refetch: refetchPhase1s } = useQuery({
    queryKey: vpnQueryKeys.ipsecPhase1s,
    queryFn: fetchIpsecPhase1s,
  });

  const { data: phase2sData, isLoading: phase2sLoading } = useQuery({
    queryKey: vpnQueryKeys.ipsecPhase2s,
    queryFn: fetchIpsecPhase2s,
  });

  const { data: saStatusData } = useQuery({
    queryKey: vpnQueryKeys.ipsecSaStatus,
    queryFn: fetchIpsecSaStatus,
    refetchInterval: 30000,
  });

  const phase1s = phase1sData?.data ?? [];
  const phase2s = phase2sData?.data ?? [];
  const saStatuses = saStatusData?.data ?? [];

  const getSaStatus = (ikeid: number): IpsecSaStatus | undefined =>
    saStatuses.find((s) => s.ikeid === ikeid && s.phase === 1);

  const deletePhase1Mutation = useMutation({
    mutationFn: deleteIpsecPhase1,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: vpnQueryKeys.ipsecPhase1s });
      setHasPendingChanges(true);
      setDeleteTarget(null);
    },
  });

  const deletePhase2Mutation = useMutation({
    mutationFn: deleteIpsecPhase2,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: vpnQueryKeys.ipsecPhase2s });
      setHasPendingChanges(true);
      setDeleteTarget(null);
    },
  });

  const createPhase1Mutation = useMutation({
    mutationFn: createIpsecPhase1,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: vpnQueryKeys.ipsecPhase1s });
      setHasPendingChanges(true);
      setDialogOpen(false);
      setEditingPhase1(null);
    },
  });

  const updatePhase1Mutation = useMutation({
    mutationFn: ({ id, input }: { id: number; input: Partial<IpsecPhase1FormData> }) =>
      updateIpsecPhase1(id, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: vpnQueryKeys.ipsecPhase1s });
      setHasPendingChanges(true);
      setDialogOpen(false);
      setEditingPhase1(null);
    },
  });

  const applyChanges = useApplyChanges({
    endpoint: '/vpn/ipsec/apply',
    invalidateKeys: [[...vpnQueryKeys.ipsecPhase1s], [...vpnQueryKeys.ipsecPhase2s], [...vpnQueryKeys.ipsecSaStatus]],
    onSuccess: () => setHasPendingChanges(false),
  });

  const handleDelete = () => {
    if (!deleteTarget) return;
    if (deleteTarget.type === 'phase1') {
      deletePhase1Mutation.mutate(deleteTarget.id);
    } else {
      deletePhase2Mutation.mutate(deleteTarget.id);
    }
  };

  const handleFormSubmit = (data: IpsecPhase1FormData) => {
    const apiInput = {
      ...data,
      description: data.description ?? '',
      pre_shared_key: data.pre_shared_key ?? undefined,
      certref: data.certref ?? undefined,
      caref: data.caref ?? undefined,
      lifetime: data.lifetime ?? undefined,
    };
    if (editingPhase1) {
      updatePhase1Mutation.mutate({ id: editingPhase1.ikeid, input: apiInput });
    } else {
      createPhase1Mutation.mutate(apiInput);
    }
  };

  const isLoading = phase1sLoading || phase2sLoading;

  return (
    <Box>
      <PendingChangesBanner
        hasChanges={hasPendingChanges}
        onApply={() => applyChanges.mutate()}
        isApplying={applyChanges.isPending}
      />

      {/* Phase 1 Section */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h6">IPsec Phase 1</Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button startIcon={<RefreshIcon />} onClick={() => refetchPhase1s()} size="small">
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => { setEditingPhase1(null); setDialogOpen(true); }}
            size="small"
          >
            Add Phase 1
          </Button>
        </Box>
      </Box>

      {phase1sLoading && (
        <Paper sx={{ p: 2, mb: 3 }}>
          {[...Array(3)].map((_, i) => <Skeleton key={i} height={48} sx={{ mb: 1 }} />)}
        </Paper>
      )}

      {phase1sError && (
        <Paper sx={{ p: 4, textAlign: 'center', mb: 3 }}>
          <Typography color="error" sx={{ mb: 2 }}>Failed to load IPsec Phase 1 entries</Typography>
          <Button variant="outlined" onClick={() => refetchPhase1s()}>Retry</Button>
        </Paper>
      )}

      {!isLoading && !phase1sError && phase1s.length === 0 && (
        <Paper sx={{ mb: 3 }}>
          <EmptyState message="No IPsec Phase 1 entries configured." />
        </Paper>
      )}

      {!isLoading && !phase1sError && phase1s.length > 0 && (
        <TableContainer component={Paper} sx={{ mb: 3 }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Status</TableCell>
                <TableCell>Description</TableCell>
                <TableCell>Remote Gateway</TableCell>
                <TableCell>IKE Version</TableCell>
                <TableCell>Encryption</TableCell>
                <TableCell>Auth</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {phase1s.map((p1) => {
                const saStatus = getSaStatus(p1.ikeid);
                return (
                  <TableRow key={p1.ikeid}>
                    <TableCell>
                      <StatusChip
                        status={p1.enabled ? (saStatus?.status === 'established' ? 'online' : saStatus?.status === 'connecting' ? 'warning' : 'offline') : 'unknown'}
                        label={p1.enabled ? (saStatus?.status ?? 'Unknown') : 'Disabled'}
                      />
                    </TableCell>
                    <TableCell>{p1.description || '-'}</TableCell>
                    <TableCell>{p1.remotegw}</TableCell>
                    <TableCell>{p1.iketype.toUpperCase()}</TableCell>
                    <TableCell>{p1.encryption_algorithm.toUpperCase()}</TableCell>
                    <TableCell>{p1.authentication_method.replace(/_/g, ' ')}</TableCell>
                    <TableCell align="right">
                      <Tooltip title="Edit">
                        <IconButton size="small" onClick={() => { setEditingPhase1(p1); setDialogOpen(true); }}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton size="small" color="error" onClick={() => setDeleteTarget({ type: 'phase1', id: p1.ikeid, label: p1.description || `Phase 1 ${p1.ikeid}` })}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Phase 2 Section */}
      <Typography variant="h6" sx={{ mb: 2 }}>IPsec Phase 2</Typography>

      {!isLoading && !phase1sError && phase2s.length === 0 && (
        <Paper sx={{ mb: 3 }}>
          <EmptyState message="No IPsec Phase 2 entries configured." />
        </Paper>
      )}

      {!isLoading && !phase1sError && phase2s.length > 0 && (
        <TableContainer component={Paper} sx={{ mb: 3 }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Status</TableCell>
                <TableCell>Description</TableCell>
                <TableCell>Phase 1</TableCell>
                <TableCell>Mode</TableCell>
                <TableCell>Protocol</TableCell>
                <TableCell>Encryption</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {phase2s.map((p2) => {
                const parentPhase1 = phase1s.find((p1) => p1.ikeid === p2.ikeid);
                const saStatus = saStatuses.find((s) => s.ikeid === p2.ikeid && s.phase === 2);
                return (
                  <TableRow key={p2.uniqid}>
                    <TableCell>
                      <StatusChip
                        status={p2.enabled ? (saStatus?.status === 'established' ? 'online' : 'offline') : 'unknown'}
                        label={p2.enabled ? (saStatus?.status ?? 'Unknown') : 'Disabled'}
                      />
                    </TableCell>
                    <TableCell>{p2.description || '-'}</TableCell>
                    <TableCell>{parentPhase1?.description ?? p2.ikeid}</TableCell>
                    <TableCell>{p2.mode}</TableCell>
                    <TableCell>{p2.protocol.toUpperCase()}</TableCell>
                    <TableCell>{p2.encryption_algorithm.toUpperCase()}</TableCell>
                    <TableCell align="right">
                      <Tooltip title="Delete">
                        <IconButton size="small" color="error" onClick={() => setDeleteTarget({ type: 'phase2', id: p2.uniqid, label: p2.description || `Phase 2 ${p2.uniqid}` })}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Dialogs */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingPhase1 ? 'Edit IPsec Phase 1' : 'Create IPsec Phase 1'}</DialogTitle>
        <Box sx={{ px: 3, pb: 3 }}>
          <IpsecPhase1Form
            initialData={editingPhase1}
            onSubmit={handleFormSubmit}
            onCancel={() => setDialogOpen(false)}
            isSubmitting={createPhase1Mutation.isPending || updatePhase1Mutation.isPending}
          />
        </Box>
      </Dialog>

      <ConfirmDialog
        open={deleteTarget !== null}
        title={`Delete IPsec ${deleteTarget?.type === 'phase1' ? 'Phase 1' : 'Phase 2'}`}
        message={`Are you sure you want to delete "${deleteTarget?.label}"? Changes must be applied.`}
        confirmLabel="Delete"
        destructive
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </Box>
  );
}
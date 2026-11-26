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
import {
  fetchWireGuardTunnels,
  fetchWireGuardPeers,
  fetchWireGuardTunnelStatus,
  deleteWireGuardTunnel,
  deleteWireGuardPeer,
  vpnQueryKeys,
  type WireGuardTunnel,
  type WireGuardTunnelStatus,
} from '@/api/modules/vpn';
import { WireGuardTunnelForm, type WireGuardTunnelFormData } from './WireGuardTunnelForm';
import {
  createWireGuardTunnel,
  updateWireGuardTunnel,
} from '@/api/modules/vpn';

export function WireGuardTab() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTunnel, setEditingTunnel] = useState<WireGuardTunnel | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'tunnel' | 'peer'; id: number; label: string } | null>(null);

  const { data: tunnelsData, isLoading: tunnelsLoading, isError: tunnelsError, refetch: refetchTunnels } = useQuery({
    queryKey: vpnQueryKeys.wireguardTunnels,
    queryFn: fetchWireGuardTunnels,
  });

  const { data: peersData, isLoading: peersLoading } = useQuery({
    queryKey: vpnQueryKeys.wireguardPeers,
    queryFn: fetchWireGuardPeers,
  });

  const { data: statusData } = useQuery({
    queryKey: vpnQueryKeys.wireguardStatus,
    queryFn: fetchWireGuardTunnelStatus,
    refetchInterval: 30000,
  });

  const tunnels = tunnelsData?.data ?? [];
  const peers = peersData?.data ?? [];
  const statuses = statusData?.data ?? [];

  const getTunnelStatus = (id: number): WireGuardTunnelStatus | undefined =>
    statuses.find((s) => s.id === id);

  const deleteTunnelMutation = useMutation({
    mutationFn: deleteWireGuardTunnel,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: vpnQueryKeys.wireguardTunnels });
      setDeleteTarget(null);
    },
  });

  const deletePeerMutation = useMutation({
    mutationFn: deleteWireGuardPeer,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: vpnQueryKeys.wireguardPeers });
      setDeleteTarget(null);
    },
  });

  const createTunnelMutation = useMutation({
    mutationFn: createWireGuardTunnel,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: vpnQueryKeys.wireguardTunnels });
      setDialogOpen(false);
      setEditingTunnel(null);
    },
  });

  const updateTunnelMutation = useMutation({
    mutationFn: ({ id, input }: { id: number; input: Parameters<typeof updateWireGuardTunnel>[1] }) =>
      updateWireGuardTunnel(id, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: vpnQueryKeys.wireguardTunnels });
      setDialogOpen(false);
      setEditingTunnel(null);
    },
  });

  const handleDelete = () => {
    if (!deleteTarget) return;
    if (deleteTarget.type === 'tunnel') {
      deleteTunnelMutation.mutate(deleteTarget.id);
    } else {
      deletePeerMutation.mutate(deleteTarget.id);
    }
  };

  const handleFormSubmit = (data: WireGuardTunnelFormData) => {
    const apiInput = {
      name: data.name,
      enabled: data.enabled,
      listen_port: data.listen_port,
      private_key: data.private_key,
      addresses: data.addresses.split(',').map((s) => s.trim()).filter(Boolean),
      dns_servers: data.dns_servers ? data.dns_servers.split(',').map((s) => s.trim()).filter(Boolean) : [],
      mtu: data.mtu,
      description: data.description ?? '',
    };
    if (editingTunnel) {
      updateTunnelMutation.mutate({ id: editingTunnel.id, input: apiInput });
    } else {
      createTunnelMutation.mutate(apiInput);
    }
  };

  const isLoading = tunnelsLoading || peersLoading;

  return (
    <Box>
      {/* Tunnels Section */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h6">WireGuard Tunnels</Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button startIcon={<RefreshIcon />} onClick={() => refetchTunnels()} size="small">
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => { setEditingTunnel(null); setDialogOpen(true); }}
            size="small"
          >
            Add Tunnel
          </Button>
        </Box>
      </Box>

      {tunnelsLoading && (
        <Paper sx={{ p: 2, mb: 3 }}>
          {[...Array(3)].map((_, i) => <Skeleton key={i} height={48} sx={{ mb: 1 }} />)}
        </Paper>
      )}

      {tunnelsError && (
        <Paper sx={{ p: 4, textAlign: 'center', mb: 3 }}>
          <Typography color="error" sx={{ mb: 2 }}>Failed to load WireGuard tunnels</Typography>
          <Button variant="outlined" onClick={() => refetchTunnels()}>Retry</Button>
        </Paper>
      )}

      {!isLoading && !tunnelsError && tunnels.length === 0 && (
        <Paper sx={{ mb: 3 }}>
          <EmptyState message="No WireGuard tunnels configured." />
        </Paper>
      )}

      {!isLoading && !tunnelsError && tunnels.length > 0 && (
        <TableContainer component={Paper} sx={{ mb: 3 }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Status</TableCell>
                <TableCell>Name</TableCell>
                <TableCell>Listen Port</TableCell>
                <TableCell>Public Key</TableCell>
                <TableCell>Peers</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {tunnels.map((tunnel) => {
                const status = getTunnelStatus(tunnel.id);
                const tunnelPeers = peers.filter((p) => p.tunnel_id === tunnel.id);
                return (
                  <TableRow key={tunnel.id}>
                    <TableCell>
                      <StatusChip
                        status={tunnel.enabled ? (status?.status === 'up' ? 'online' : 'offline') : 'unknown'}
                        label={tunnel.enabled ? (status?.status ?? 'Unknown') : 'Disabled'}
                      />
                    </TableCell>
                    <TableCell>{tunnel.name}</TableCell>
                    <TableCell>{tunnel.listen_port}</TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontFamily: 'monospace', maxWidth: 150 }} noWrap>
                        {tunnel.public_key}
                      </Typography>
                    </TableCell>
                    <TableCell>{tunnelPeers.length}</TableCell>
                    <TableCell align="right">
                      <Tooltip title="Edit">
                        <IconButton size="small" onClick={() => { setEditingTunnel(tunnel); setDialogOpen(true); }}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton size="small" color="error" onClick={() => setDeleteTarget({ type: 'tunnel', id: tunnel.id, label: tunnel.name })}>
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

      {/* Peers Section */}
      <Typography variant="h6" sx={{ mb: 2 }}>WireGuard Peers</Typography>

      {!isLoading && !tunnelsError && peers.length === 0 && (
        <Paper sx={{ mb: 3 }}>
          <EmptyState message="No WireGuard peers configured." />
        </Paper>
      )}

      {!isLoading && !tunnelsError && peers.length > 0 && (
        <TableContainer component={Paper} sx={{ mb: 3 }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Status</TableCell>
                <TableCell>Name</TableCell>
                <TableCell>Tunnel</TableCell>
                <TableCell>Endpoint</TableCell>
                <TableCell>Allowed IPs</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {peers.map((peer) => {
                const tunnel = tunnels.find((t) => t.id === peer.tunnel_id);
                return (
                  <TableRow key={peer.id}>
                    <TableCell>
                      <StatusChip status={peer.enabled ? 'online' : 'unknown'} label={peer.enabled ? 'Enabled' : 'Disabled'} />
                    </TableCell>
                    <TableCell>{peer.name}</TableCell>
                    <TableCell>{tunnel?.name ?? peer.tunnel_id}</TableCell>
                    <TableCell>
                      {peer.endpoint_address ? `${peer.endpoint_address}:${peer.endpoint_port}` : '-'}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
                        {peer.allowed_ips.join(', ')}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="Delete">
                        <IconButton size="small" color="error" onClick={() => setDeleteTarget({ type: 'peer', id: peer.id, label: peer.name })}>
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
        <DialogTitle>{editingTunnel ? 'Edit WireGuard Tunnel' : 'Create WireGuard Tunnel'}</DialogTitle>
        <Box sx={{ px: 3, pb: 3 }}>
          <WireGuardTunnelForm
            initialData={editingTunnel}
            onSubmit={handleFormSubmit}
            onCancel={() => setDialogOpen(false)}
            isSubmitting={createTunnelMutation.isPending || updateTunnelMutation.isPending}
          />
        </Box>
      </Dialog>

      <ConfirmDialog
        open={deleteTarget !== null}
        title={`Delete WireGuard ${deleteTarget?.type === 'tunnel' ? 'Tunnel' : 'Peer'}`}
        message={`Are you sure you want to delete "${deleteTarget?.label}"?`}
        confirmLabel="Delete"
        destructive
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </Box>
  );
}
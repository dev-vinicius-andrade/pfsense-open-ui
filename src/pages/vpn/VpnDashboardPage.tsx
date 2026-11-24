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
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  Tooltip,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import RefreshIcon from '@mui/icons-material/Refresh';
import { PageHeader } from '@/components/shared/PageHeader';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { EmptyState } from '@/components/shared/EmptyState';
import { StatusChip } from '@/components/shared/StatusChip';
import { PendingChangesBanner } from '@/components/shared/PendingChangesBanner';
import { useApplyChanges } from '@/hooks/useApplyChanges';
import {
  fetchOpenVpnServers,
  fetchOpenVpnClients,
  fetchOpenVpnServerStatus,
  deleteOpenVpnServer,
  deleteOpenVpnClient,
  fetchWireGuardTunnels,
  fetchWireGuardPeers,
  fetchWireGuardTunnelStatus,
  deleteWireGuardTunnel,
  deleteWireGuardPeer,
  fetchIpsecPhase1s,
  fetchIpsecPhase2s,
  fetchIpsecSaStatus,
  deleteIpsecPhase1,
  deleteIpsecPhase2,
  vpnQueryKeys,
  type OpenVpnServer,
  type OpenVpnServerStatus,
  type WireGuardTunnel,
  type WireGuardTunnelStatus,
  type IpsecPhase1,
  type IpsecSaStatus,
} from '@/api/modules/vpn';
import { OpenVpnServerForm, type OpenVpnServerFormData } from './OpenVpnServerForm';
import { WireGuardTunnelForm, type WireGuardTunnelFormData } from './WireGuardTunnelForm';
import { IpsecPhase1Form, type IpsecPhase1FormData } from './IpsecPhase1Form';
import {
  createOpenVpnServer,
  updateOpenVpnServer,
  createWireGuardTunnel,
  updateWireGuardTunnel,
  createIpsecPhase1,
  updateIpsecPhase1,
} from '@/api/modules/vpn';

// --- Tab Panel ---

interface TabPanelProps {
  children: React.ReactNode;
  value: number;
  index: number;
}

function TabPanel({ children, value, index }: TabPanelProps) {
  if (value !== index) return null;
  return <Box sx={{ py: 3 }}>{children}</Box>;
}

// --- OpenVPN Tab ---

function OpenVpnTab() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingServer, setEditingServer] = useState<OpenVpnServer | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'server' | 'client'; id: number; label: string } | null>(null);

  const { data: serversData, isLoading: serversLoading, isError: serversError, refetch: refetchServers } = useQuery({
    queryKey: vpnQueryKeys.openvpnServers,
    queryFn: fetchOpenVpnServers,
  });

  const { data: clientsData, isLoading: clientsLoading } = useQuery({
    queryKey: vpnQueryKeys.openvpnClients,
    queryFn: fetchOpenVpnClients,
  });

  const { data: statusData } = useQuery({
    queryKey: vpnQueryKeys.openvpnStatus,
    queryFn: fetchOpenVpnServerStatus,
    refetchInterval: 30000,
  });

  const servers = serversData?.data ?? [];
  const clients = clientsData?.data ?? [];
  const statuses = statusData?.data ?? [];

  const getStatus = (vpnid: number): OpenVpnServerStatus | undefined =>
    statuses.find((s) => s.vpnid === vpnid);

  const deleteServerMutation = useMutation({
    mutationFn: deleteOpenVpnServer,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: vpnQueryKeys.openvpnServers });
      setDeleteTarget(null);
    },
  });

  const deleteClientMutation = useMutation({
    mutationFn: deleteOpenVpnClient,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: vpnQueryKeys.openvpnClients });
      setDeleteTarget(null);
    },
  });

  const createServerMutation = useMutation({
    mutationFn: createOpenVpnServer,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: vpnQueryKeys.openvpnServers });
      setDialogOpen(false);
      setEditingServer(null);
    },
  });

  const updateServerMutation = useMutation({
    mutationFn: ({ id, input }: { id: number; input: Partial<OpenVpnServerFormData> }) =>
      updateOpenVpnServer(id, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: vpnQueryKeys.openvpnServers });
      setDialogOpen(false);
      setEditingServer(null);
    },
  });

  const handleDelete = () => {
    if (!deleteTarget) return;
    if (deleteTarget.type === 'server') {
      deleteServerMutation.mutate(deleteTarget.id);
    } else {
      deleteClientMutation.mutate(deleteTarget.id);
    }
  };

  const handleFormSubmit = (data: OpenVpnServerFormData) => {
    const apiInput = {
      ...data,
      description: data.description ?? '',
      caref: data.caref ?? undefined,
      maxclients: data.maxclients ?? undefined,
      topology: data.topology ?? undefined,
      server: data.server ?? undefined,
    };
    if (editingServer) {
      updateServerMutation.mutate({ id: editingServer.vpnid, input: apiInput });
    } else {
      createServerMutation.mutate(apiInput);
    }
  };

  const isLoading = serversLoading || clientsLoading;

  return (
    <Box>
      {/* Servers Section */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h6">OpenVPN Servers</Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button startIcon={<RefreshIcon />} onClick={() => refetchServers()} size="small">
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => { setEditingServer(null); setDialogOpen(true); }}
            size="small"
          >
            Add Server
          </Button>
        </Box>
      </Box>

      {serversLoading && (
        <Paper sx={{ p: 2, mb: 3 }}>
          {[...Array(3)].map((_, i) => <Skeleton key={i} height={48} sx={{ mb: 1 }} />)}
        </Paper>
      )}

      {serversError && (
        <Paper sx={{ p: 4, textAlign: 'center', mb: 3 }}>
          <Typography color="error" sx={{ mb: 2 }}>Failed to load OpenVPN servers</Typography>
          <Button variant="outlined" onClick={() => refetchServers()}>Retry</Button>
        </Paper>
      )}

      {!isLoading && !serversError && servers.length === 0 && (
        <Paper sx={{ mb: 3 }}>
          <EmptyState message="No OpenVPN servers configured." />
        </Paper>
      )}

      {!isLoading && !serversError && servers.length > 0 && (
        <TableContainer component={Paper} sx={{ mb: 3 }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Status</TableCell>
                <TableCell>Description</TableCell>
                <TableCell>Mode</TableCell>
                <TableCell>Protocol</TableCell>
                <TableCell>Port</TableCell>
                <TableCell>Clients</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {servers.map((server) => {
                const status = getStatus(server.vpnid);
                return (
                  <TableRow key={server.vpnid}>
                    <TableCell>
                      <StatusChip
                        status={server.enabled ? (status?.status === 'up' ? 'online' : 'offline') : 'unknown'}
                        label={server.enabled ? (status?.status ?? 'Unknown') : 'Disabled'}
                      />
                    </TableCell>
                    <TableCell>{server.description || '-'}</TableCell>
                    <TableCell>{server.mode}</TableCell>
                    <TableCell>{server.protocol.toUpperCase()}</TableCell>
                    <TableCell>{server.local_port}</TableCell>
                    <TableCell>{status?.connected_clients ?? 0}</TableCell>
                    <TableCell align="right">
                      <Tooltip title="Edit">
                        <IconButton size="small" onClick={() => { setEditingServer(server); setDialogOpen(true); }}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton size="small" color="error" onClick={() => setDeleteTarget({ type: 'server', id: server.vpnid, label: server.description || `Server ${server.vpnid}` })}>
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

      {/* Clients Section */}
      <Typography variant="h6" sx={{ mb: 2 }}>OpenVPN Clients</Typography>

      {!isLoading && !serversError && clients.length === 0 && (
        <Paper sx={{ mb: 3 }}>
          <EmptyState message="No OpenVPN clients configured." />
        </Paper>
      )}

      {!isLoading && !serversError && clients.length > 0 && (
        <TableContainer component={Paper} sx={{ mb: 3 }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Status</TableCell>
                <TableCell>Description</TableCell>
                <TableCell>Remote</TableCell>
                <TableCell>Protocol</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {clients.map((client) => (
                <TableRow key={client.vpnid}>
                  <TableCell>
                    <StatusChip status={client.enabled ? 'online' : 'unknown'} label={client.enabled ? 'Enabled' : 'Disabled'} />
                  </TableCell>
                  <TableCell>{client.description || '-'}</TableCell>
                  <TableCell>{client.remote_addr}:{client.remote_port}</TableCell>
                  <TableCell>{client.protocol.toUpperCase()}</TableCell>
                  <TableCell align="right">
                    <Tooltip title="Delete">
                      <IconButton size="small" color="error" onClick={() => setDeleteTarget({ type: 'client', id: client.vpnid, label: client.description || `Client ${client.vpnid}` })}>
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

      {/* Dialogs */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingServer ? 'Edit OpenVPN Server' : 'Create OpenVPN Server'}</DialogTitle>
        <Box sx={{ px: 3, pb: 3 }}>
          <OpenVpnServerForm
            initialData={editingServer}
            onSubmit={handleFormSubmit}
            onCancel={() => setDialogOpen(false)}
            isSubmitting={createServerMutation.isPending || updateServerMutation.isPending}
          />
        </Box>
      </Dialog>

      <ConfirmDialog
        open={deleteTarget !== null}
        title={`Delete OpenVPN ${deleteTarget?.type === 'server' ? 'Server' : 'Client'}`}
        message={`Are you sure you want to delete "${deleteTarget?.label}"?`}
        confirmLabel="Delete"
        destructive
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </Box>
  );
}

// --- WireGuard Tab ---

function WireGuardTab() {
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

// --- IPsec Tab ---

function IpsecTab() {
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

// --- Main VPN Dashboard Page ---

export function VpnDashboardPage() {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <Box>
      <PageHeader title="VPN" />

      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={(_e, newValue: number) => setActiveTab(newValue)}
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label="OpenVPN" />
          <Tab label="WireGuard" />
          <Tab label="IPsec" />
        </Tabs>
      </Paper>

      <TabPanel value={activeTab} index={0}>
        <OpenVpnTab />
      </TabPanel>
      <TabPanel value={activeTab} index={1}>
        <WireGuardTab />
      </TabPanel>
      <TabPanel value={activeTab} index={2}>
        <IpsecTab />
      </TabPanel>
    </Box>
  );
}
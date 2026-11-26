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
  fetchOpenVpnServers,
  fetchOpenVpnClients,
  fetchOpenVpnServerStatus,
  deleteOpenVpnServer,
  deleteOpenVpnClient,
  vpnQueryKeys,
  type OpenVpnServer,
  type OpenVpnServerStatus,
} from '@/api/modules/vpn';
import { OpenVpnServerForm, type OpenVpnServerFormData } from './OpenVpnServerForm';
import {
  createOpenVpnServer,
  updateOpenVpnServer,
} from '@/api/modules/vpn';

export function OpenVpnTab() {
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
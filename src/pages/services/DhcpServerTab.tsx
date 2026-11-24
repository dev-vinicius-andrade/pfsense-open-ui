import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogTitle,
  FormControl,
  FormControlLabel,
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
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import RefreshIcon from '@mui/icons-material/Refresh';
import SaveIcon from '@mui/icons-material/Save';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { EmptyState } from '@/components/shared/EmptyState';
import { PendingChangesBanner } from '@/components/shared/PendingChangesBanner';
import { StatusChip } from '@/components/shared/StatusChip';
import { useApplyChanges } from '@/hooks/useApplyChanges';
import {
  fetchDhcpServers,
  updateDhcpServers,
  fetchDhcpStaticMappings,
  createDhcpStaticMapping,
  updateDhcpStaticMapping,
  deleteDhcpStaticMapping,
  fetchDhcpLeases,
  servicesQueryKeys,
  type DhcpServerConfig,
  type DhcpStaticMapping,
  type DhcpStaticMappingCreateInput,
} from '@/api/modules/services';

// --- Static Mapping Form ---

interface StaticMappingFormProps {
  initialData?: DhcpStaticMapping | null;
  selectedInterface: string;
  onSubmit: (data: DhcpStaticMappingCreateInput) => void;
  onCancel: () => void;
  isSubmitting: boolean;
}

function StaticMappingForm({
  initialData,
  selectedInterface,
  onSubmit,
  onCancel,
  isSubmitting,
}: StaticMappingFormProps) {
  const [macAddress, setMacAddress] = useState(initialData?.mac_address ?? '');
  const [ipAddress, setIpAddress] = useState(initialData?.ip_address ?? '');
  const [hostname, setHostname] = useState(initialData?.hostname ?? '');
  const [description, setDescription] = useState(initialData?.description ?? '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      mac_address: macAddress,
      ip_address: ipAddress,
      hostname: hostname || undefined,
      description: description || undefined,
      interface: selectedInterface,
    });
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <TextField
        label="MAC Address"
        value={macAddress}
        onChange={(e) => setMacAddress(e.target.value)}
        required
        fullWidth
        placeholder="00:11:22:33:44:55"
      />
      <TextField
        label="IP Address"
        value={ipAddress}
        onChange={(e) => setIpAddress(e.target.value)}
        required
        fullWidth
        placeholder="192.168.1.100"
      />
      <TextField
        label="Hostname"
        value={hostname}
        onChange={(e) => setHostname(e.target.value)}
        fullWidth
      />
      <TextField
        label="Description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        fullWidth
      />
      <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
        <Button onClick={onCancel}>Cancel</Button>
        <Button type="submit" variant="contained" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : 'Save'}
        </Button>
      </Box>
    </Box>
  );
}

// --- Main Component ---

export function DhcpServerTab() {
  const queryClient = useQueryClient();
  const [selectedInterface, setSelectedInterface] = useState('lan');
  const [hasPendingChanges, setHasPendingChanges] = useState(false);
  const [mappingDialogOpen, setMappingDialogOpen] = useState(false);
  const [editingMapping, setEditingMapping] = useState<DhcpStaticMapping | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DhcpStaticMapping | null>(null);

  // --- Queries ---

  const {
    data: serversData,
    isLoading: serversLoading,
    isError: serversError,
    refetch: refetchServers,
  } = useQuery({
    queryKey: servicesQueryKeys.dhcpServers,
    queryFn: fetchDhcpServers,
  });

  const servers = serversData?.data ?? [];
  const currentConfig = servers.find((s) => s.interface === selectedInterface);

  const {
    data: mappingsData,
    isLoading: mappingsLoading,
  } = useQuery({
    queryKey: servicesQueryKeys.dhcpStaticMappings,
    queryFn: fetchDhcpStaticMappings,
  });

  const staticMappings = (mappingsData?.data ?? []).filter(
    (m) => m.interface === selectedInterface,
  );

  const {
    data: leasesData,
    isLoading: leasesLoading,
    refetch: refetchLeases,
  } = useQuery({
    queryKey: servicesQueryKeys.dhcpLeases,
    queryFn: fetchDhcpLeases,
    refetchInterval: 30000,
  });

  const activeLeases = (leasesData?.data ?? []).filter(
    (l) => l.interface === selectedInterface && l.status === 'active',
  );

  // --- Local config state ---

  const [localConfig, setLocalConfig] = useState<Partial<DhcpServerConfig>>({});

  const handleConfigChange = (field: keyof DhcpServerConfig, value: unknown) => {
    setLocalConfig((prev) => ({ ...prev, [field]: value }));
    setHasPendingChanges(true);
  };

  // --- Mutations ---

  const saveConfigMutation = useMutation({
    mutationFn: () => {
      const updatedServers = servers.map((s) =>
        s.interface === selectedInterface ? { ...s, ...localConfig } : s,
      );
      return updateDhcpServers(updatedServers);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: servicesQueryKeys.dhcpServers });
      setLocalConfig({});
    },
  });

  const createMappingMutation = useMutation({
    mutationFn: createDhcpStaticMapping,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: servicesQueryKeys.dhcpStaticMappings });
      setMappingDialogOpen(false);
      setEditingMapping(null);
      setHasPendingChanges(true);
    },
  });

  const updateMappingMutation = useMutation({
    mutationFn: ({ id, input }: { id: number; input: Partial<DhcpStaticMappingCreateInput> }) =>
      updateDhcpStaticMapping(id, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: servicesQueryKeys.dhcpStaticMappings });
      setMappingDialogOpen(false);
      setEditingMapping(null);
      setHasPendingChanges(true);
    },
  });

  const deleteMappingMutation = useMutation({
    mutationFn: deleteDhcpStaticMapping,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: servicesQueryKeys.dhcpStaticMappings });
      setDeleteTarget(null);
      setHasPendingChanges(true);
    },
  });

  const applyChanges = useApplyChanges({
    endpoint: '/services/dhcp_server/apply',
    invalidateKeys: [
      [...servicesQueryKeys.dhcpServers],
      [...servicesQueryKeys.dhcpStaticMappings],
      [...servicesQueryKeys.dhcpLeases],
    ],
    onSuccess: () => setHasPendingChanges(false),
  });

  // --- Handlers ---

  const handleMappingSubmit = useCallback(
    (formData: DhcpStaticMappingCreateInput) => {
      if (editingMapping) {
        updateMappingMutation.mutate({ id: editingMapping.id, input: formData });
      } else {
        createMappingMutation.mutate(formData);
      }
    },
    [editingMapping, createMappingMutation, updateMappingMutation],
  );

  const isSubmitting = createMappingMutation.isPending || updateMappingMutation.isPending;

  // --- Render ---

  if (serversLoading) {
    return (
      <Paper sx={{ p: 3 }}>
        <Skeleton height={48} sx={{ mb: 2 }} />
        <Skeleton height={200} />
      </Paper>
    );
  }

  if (serversError) {
    return (
      <Paper sx={{ p: 4, textAlign: 'center' }}>
        <Typography color="error" sx={{ mb: 2 }}>
          Failed to load DHCP server configuration.
        </Typography>
        <Button variant="outlined" onClick={() => refetchServers()}>
          Retry
        </Button>
      </Paper>
    );
  }

  const interfaces = servers.map((s) => s.interface);
  const effectiveConfig = { ...currentConfig, ...localConfig };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <PendingChangesBanner
        hasChanges={hasPendingChanges}
        onApply={() => applyChanges.mutate()}
        isApplying={applyChanges.isPending}
      />

      {/* Interface Selector */}
      <Paper sx={{ p: 3 }}>
        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel id="dhcp-interface-label">Interface</InputLabel>
          <Select
            labelId="dhcp-interface-label"
            value={selectedInterface}
            label="Interface"
            onChange={(e) => {
              setSelectedInterface(e.target.value);
              setLocalConfig({});
            }}
          >
            {interfaces.map((iface) => (
              <MenuItem key={iface} value={iface}>
                {iface.toUpperCase()}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Paper>

      {/* DHCP Settings Form */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          DHCP Server Settings
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <FormControlLabel
            control={
              <Checkbox
                checked={effectiveConfig?.enable ?? false}
                onChange={(e) => handleConfigChange('enable', e.target.checked)}
              />
            }
            label="Enable DHCP Server"
          />
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <TextField
              label="Range From"
              value={effectiveConfig?.range_from ?? ''}
              onChange={(e) => handleConfigChange('range_from', e.target.value)}
              sx={{ flex: 1, minWidth: 200 }}
              placeholder="192.168.1.100"
            />
            <TextField
              label="Range To"
              value={effectiveConfig?.range_to ?? ''}
              onChange={(e) => handleConfigChange('range_to', e.target.value)}
              sx={{ flex: 1, minWidth: 200 }}
              placeholder="192.168.1.199"
            />
          </Box>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <TextField
              label="Default Lease Time (seconds)"
              type="number"
              value={effectiveConfig?.default_lease_time ?? ''}
              onChange={(e) => handleConfigChange('default_lease_time', Number(e.target.value))}
              sx={{ flex: 1, minWidth: 200 }}
            />
            <TextField
              label="Max Lease Time (seconds)"
              type="number"
              value={effectiveConfig?.max_lease_time ?? ''}
              onChange={(e) => handleConfigChange('max_lease_time', Number(e.target.value))}
              sx={{ flex: 1, minWidth: 200 }}
            />
          </Box>
          <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
            <Button
              variant="contained"
              startIcon={<SaveIcon />}
              onClick={() => saveConfigMutation.mutate()}
              disabled={saveConfigMutation.isPending || Object.keys(localConfig).length === 0}
            >
              {saveConfigMutation.isPending ? 'Saving...' : 'Save Settings'}
            </Button>
          </Box>
        </Box>
      </Paper>

      {/* Static Mappings */}
      <Paper sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">Static Mappings</Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => {
              setEditingMapping(null);
              setMappingDialogOpen(true);
            }}
          >
            Add Mapping
          </Button>
        </Box>

        {mappingsLoading ? (
          <Skeleton height={120} />
        ) : staticMappings.length === 0 ? (
          <EmptyState message="No static mappings configured for this interface." />
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>MAC Address</TableCell>
                  <TableCell>IP Address</TableCell>
                  <TableCell>Hostname</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {staticMappings.map((mapping) => (
                  <TableRow key={mapping.id}>
                    <TableCell>{mapping.mac_address}</TableCell>
                    <TableCell>{mapping.ip_address}</TableCell>
                    <TableCell>{mapping.hostname || '-'}</TableCell>
                    <TableCell>{mapping.description || '-'}</TableCell>
                    <TableCell align="right">
                      <Tooltip title="Edit">
                        <IconButton
                          size="small"
                          onClick={() => {
                            setEditingMapping(mapping);
                            setMappingDialogOpen(true);
                          }}
                          aria-label="Edit mapping"
                        >
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
      </Paper>

      {/* Active Leases */}
      <Paper sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">Active Leases</Typography>
          <Button
            startIcon={<RefreshIcon />}
            onClick={() => refetchLeases()}
            disabled={leasesLoading}
          >
            Refresh
          </Button>
        </Box>

        {leasesLoading ? (
          <Skeleton height={120} />
        ) : activeLeases.length === 0 ? (
          <EmptyState message="No active leases on this interface." />
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>IP Address</TableCell>
                  <TableCell>MAC Address</TableCell>
                  <TableCell>Hostname</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Starts</TableCell>
                  <TableCell>Ends</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {activeLeases.map((lease) => (
                  <TableRow key={`${lease.ip_address}-${lease.mac_address}`}>
                    <TableCell>{lease.ip_address}</TableCell>
                    <TableCell>{lease.mac_address}</TableCell>
                    <TableCell>{lease.hostname || '-'}</TableCell>
                    <TableCell>
                      <StatusChip status={lease.status === 'active' ? 'online' : 'offline'} />
                    </TableCell>
                    <TableCell>{lease.starts}</TableCell>
                    <TableCell>{lease.ends}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {/* Static Mapping Dialog */}
      <Dialog
        open={mappingDialogOpen}
        onClose={() => setMappingDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {editingMapping ? 'Edit Static Mapping' : 'Add Static Mapping'}
        </DialogTitle>
        <Box sx={{ px: 3, pb: 3 }}>
          <StaticMappingForm
            initialData={editingMapping}
            selectedInterface={selectedInterface}
            onSubmit={handleMappingSubmit}
            onCancel={() => setMappingDialogOpen(false)}
            isSubmitting={isSubmitting}
          />
        </Box>
      </Dialog>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={deleteTarget !== null}
        title="Delete Static Mapping"
        message={`Are you sure you want to delete the mapping for "${deleteTarget?.mac_address}"? This change will be pending until applied.`}
        confirmLabel="Delete"
        destructive
        onConfirm={() => {
          if (deleteTarget) deleteMappingMutation.mutate(deleteTarget.id);
        }}
        onCancel={() => setDeleteTarget(null)}
      />
    </Box>
  );
}
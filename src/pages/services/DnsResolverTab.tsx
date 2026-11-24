import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogTitle,
  FormControlLabel,
  IconButton,
  Paper,
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
import SaveIcon from '@mui/icons-material/Save';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { EmptyState } from '@/components/shared/EmptyState';
import { PendingChangesBanner } from '@/components/shared/PendingChangesBanner';
import { useApplyChanges } from '@/hooks/useApplyChanges';
import {
  fetchDnsResolverSettings,
  updateDnsResolverSettings,
  fetchDnsHostOverrides,
  createDnsHostOverride,
  updateDnsHostOverride,
  deleteDnsHostOverride,
  servicesQueryKeys,
  type DnsResolverSettings,
  type DnsHostOverride,
  type DnsHostOverrideCreateInput,
} from '@/api/modules/services';

// --- Host Override Form ---

interface HostOverrideFormProps {
  initialData?: DnsHostOverride | null;
  onSubmit: (data: DnsHostOverrideCreateInput) => void;
  onCancel: () => void;
  isSubmitting: boolean;
}

function HostOverrideForm({
  initialData,
  onSubmit,
  onCancel,
  isSubmitting,
}: HostOverrideFormProps) {
  const [host, setHost] = useState(initialData?.host ?? '');
  const [domain, setDomain] = useState(initialData?.domain ?? '');
  const [ipAddress, setIpAddress] = useState(initialData?.ip_address ?? '');
  const [description, setDescription] = useState(initialData?.description ?? '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      host,
      domain,
      ip_address: ipAddress,
      description: description || undefined,
    });
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <TextField
        label="Host"
        value={host}
        onChange={(e) => setHost(e.target.value)}
        required
        fullWidth
        placeholder="myhost"
      />
      <TextField
        label="Domain"
        value={domain}
        onChange={(e) => setDomain(e.target.value)}
        required
        fullWidth
        placeholder="example.com"
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

export function DnsResolverTab() {
  const queryClient = useQueryClient();
  const [hasPendingChanges, setHasPendingChanges] = useState(false);
  const [overrideDialogOpen, setOverrideDialogOpen] = useState(false);
  const [editingOverride, setEditingOverride] = useState<DnsHostOverride | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DnsHostOverride | null>(null);

  // --- Queries ---

  const {
    data: settingsData,
    isLoading: settingsLoading,
    isError: settingsError,
    refetch: refetchSettings,
  } = useQuery({
    queryKey: servicesQueryKeys.dnsResolverSettings,
    queryFn: fetchDnsResolverSettings,
  });

  const settings = settingsData?.data;

  const {
    data: overridesData,
    isLoading: overridesLoading,
  } = useQuery({
    queryKey: servicesQueryKeys.dnsHostOverrides,
    queryFn: fetchDnsHostOverrides,
  });

  const hostOverrides = overridesData?.data ?? [];

  // --- Local settings state ---

  const [localSettings, setLocalSettings] = useState<Partial<DnsResolverSettings>>({});

  const handleSettingChange = (field: keyof DnsResolverSettings, value: unknown) => {
    setLocalSettings((prev) => ({ ...prev, [field]: value }));
    setHasPendingChanges(true);
  };

  // --- Mutations ---

  const saveSettingsMutation = useMutation({
    mutationFn: () => updateDnsResolverSettings(localSettings),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: servicesQueryKeys.dnsResolverSettings });
      setLocalSettings({});
    },
  });

  const createOverrideMutation = useMutation({
    mutationFn: createDnsHostOverride,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: servicesQueryKeys.dnsHostOverrides });
      setOverrideDialogOpen(false);
      setEditingOverride(null);
      setHasPendingChanges(true);
    },
  });

  const updateOverrideMutation = useMutation({
    mutationFn: ({ id, input }: { id: number; input: Partial<DnsHostOverrideCreateInput> }) =>
      updateDnsHostOverride(id, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: servicesQueryKeys.dnsHostOverrides });
      setOverrideDialogOpen(false);
      setEditingOverride(null);
      setHasPendingChanges(true);
    },
  });

  const deleteOverrideMutation = useMutation({
    mutationFn: deleteDnsHostOverride,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: servicesQueryKeys.dnsHostOverrides });
      setDeleteTarget(null);
      setHasPendingChanges(true);
    },
  });

  const applyChanges = useApplyChanges({
    endpoint: '/services/dns_resolver/apply',
    invalidateKeys: [
      [...servicesQueryKeys.dnsResolverSettings],
      [...servicesQueryKeys.dnsHostOverrides],
    ],
    onSuccess: () => setHasPendingChanges(false),
  });

  // --- Handlers ---

  const handleOverrideSubmit = useCallback(
    (formData: DnsHostOverrideCreateInput) => {
      if (editingOverride) {
        updateOverrideMutation.mutate({ id: editingOverride.id, input: formData });
      } else {
        createOverrideMutation.mutate(formData);
      }
    },
    [editingOverride, createOverrideMutation, updateOverrideMutation],
  );

  const isSubmitting = createOverrideMutation.isPending || updateOverrideMutation.isPending;

  // --- Render ---

  if (settingsLoading) {
    return (
      <Paper sx={{ p: 3 }}>
        <Skeleton height={48} sx={{ mb: 2 }} />
        <Skeleton height={200} />
      </Paper>
    );
  }

  if (settingsError) {
    return (
      <Paper sx={{ p: 4, textAlign: 'center' }}>
        <Typography color="error" sx={{ mb: 2 }}>
          Failed to load DNS resolver settings.
        </Typography>
        <Button variant="outlined" onClick={() => refetchSettings()}>
          Retry
        </Button>
      </Paper>
    );
  }

  const effectiveSettings = { ...settings, ...localSettings };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <PendingChangesBanner
        hasChanges={hasPendingChanges}
        onApply={() => applyChanges.mutate()}
        isApplying={applyChanges.isPending}
      />

      {/* DNS Resolver Settings */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          DNS Resolver Settings
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <FormControlLabel
            control={
              <Checkbox
                checked={effectiveSettings?.enable ?? false}
                onChange={(e) => handleSettingChange('enable', e.target.checked)}
              />
            }
            label="Enable DNS Resolver"
          />
          <TextField
            label="Listen Port"
            type="number"
            value={effectiveSettings?.port ?? 53}
            onChange={(e) => handleSettingChange('port', Number(e.target.value))}
            sx={{ maxWidth: 200 }}
          />
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={effectiveSettings?.enable_dnssec ?? false}
                  onChange={(e) => handleSettingChange('enable_dnssec', e.target.checked)}
                />
              }
              label="DNSSEC"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={effectiveSettings?.hide_identity ?? false}
                  onChange={(e) => handleSettingChange('hide_identity', e.target.checked)}
                />
              }
              label="Hide Identity"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={effectiveSettings?.prefetch ?? false}
                  onChange={(e) => handleSettingChange('prefetch', e.target.checked)}
                />
              }
              label="Prefetch"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={effectiveSettings?.log_queries ?? false}
                  onChange={(e) => handleSettingChange('log_queries', e.target.checked)}
                />
              }
              label="Log Queries"
            />
          </Box>
          <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
            <Button
              variant="contained"
              startIcon={<SaveIcon />}
              onClick={() => saveSettingsMutation.mutate()}
              disabled={saveSettingsMutation.isPending || Object.keys(localSettings).length === 0}
            >
              {saveSettingsMutation.isPending ? 'Saving...' : 'Save Settings'}
            </Button>
          </Box>
        </Box>
      </Paper>

      {/* Host Overrides */}
      <Paper sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">Host Overrides</Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => {
              setEditingOverride(null);
              setOverrideDialogOpen(true);
            }}
          >
            Add Override
          </Button>
        </Box>

        {overridesLoading ? (
          <Skeleton height={120} />
        ) : hostOverrides.length === 0 ? (
          <EmptyState message="No host overrides configured." />
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Host</TableCell>
                  <TableCell>Domain</TableCell>
                  <TableCell>IP Address</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {hostOverrides.map((override) => (
                  <TableRow key={override.id}>
                    <TableCell>{override.host}</TableCell>
                    <TableCell>{override.domain}</TableCell>
                    <TableCell>{override.ip_address}</TableCell>
                    <TableCell>{override.description || '-'}</TableCell>
                    <TableCell align="right">
                      <Tooltip title="Edit">
                        <IconButton
                          size="small"
                          onClick={() => {
                            setEditingOverride(override);
                            setOverrideDialogOpen(true);
                          }}
                          aria-label="Edit override"
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => setDeleteTarget(override)}
                          aria-label="Delete override"
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

      {/* Host Override Dialog */}
      <Dialog
        open={overrideDialogOpen}
        onClose={() => setOverrideDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {editingOverride ? 'Edit Host Override' : 'Add Host Override'}
        </DialogTitle>
        <Box sx={{ px: 3, pb: 3 }}>
          <HostOverrideForm
            initialData={editingOverride}
            onSubmit={handleOverrideSubmit}
            onCancel={() => setOverrideDialogOpen(false)}
            isSubmitting={isSubmitting}
          />
        </Box>
      </Dialog>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={deleteTarget !== null}
        title="Delete Host Override"
        message={`Are you sure you want to delete the override for "${deleteTarget?.host}.${deleteTarget?.domain}"? This change will be pending until applied.`}
        confirmLabel="Delete"
        destructive
        onConfirm={() => {
          if (deleteTarget) deleteOverrideMutation.mutate(deleteTarget.id);
        }}
        onCancel={() => setDeleteTarget(null)}
      />
    </Box>
  );
}
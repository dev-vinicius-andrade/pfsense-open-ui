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
  fetchDnsForwarderSettings,
  updateDnsForwarderSettings,
  fetchDnsForwarderHostOverrides,
  createDnsForwarderHostOverride,
  updateDnsForwarderHostOverride,
  deleteDnsForwarderHostOverride,
  servicesQueryKeys,
  type DnsForwarderSettings,
  type DnsForwarderHostOverride,
  type DnsForwarderHostOverrideCreateInput,
} from '@/api/modules/services';

// --- Host Override Form ---

interface ForwarderOverrideFormProps {
  initialData?: DnsForwarderHostOverride | null;
  onSubmit: (data: DnsForwarderHostOverrideCreateInput) => void;
  onCancel: () => void;
  isSubmitting: boolean;
}

function ForwarderOverrideForm({
  initialData,
  onSubmit,
  onCancel,
  isSubmitting,
}: ForwarderOverrideFormProps) {
  const [host, setHost] = useState(initialData?.host ?? '');
  const [domain, setDomain] = useState(initialData?.domain ?? '');
  const [ipAddress, setIpAddress] = useState(initialData?.ip_address ?? '');
  const [description, setDescription] = useState(initialData?.description ?? '');

  const ipRegex = /^(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)$|^(?:[a-fA-F0-9]{1,4}:){7}[a-fA-F0-9]{1,4}$|^::(?:[a-fA-F0-9]{1,4}:){0,6}[a-fA-F0-9]{1,4}$/;
  const hostnameRegex = /^[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?$/;
  const domainRegex = /^[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

  const hostError = !!host && !hostnameRegex.test(host);
  const domainError = !!domain && !domainRegex.test(domain);
  const ipError = !!ipAddress && !ipRegex.test(ipAddress);
  const formValid = !!host && !!domain && !!ipAddress && !hostError && !domainError && !ipError;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formValid) return;
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
        error={hostError}
        helperText={hostError ? 'Enter a valid hostname (letters, numbers, hyphens)' : undefined}
      />
      <TextField
        label="Domain"
        value={domain}
        onChange={(e) => setDomain(e.target.value)}
        required
        fullWidth
        placeholder="example.com"
        error={domainError}
        helperText={domainError ? 'Enter a valid domain name' : undefined}
      />
      <TextField
        label="IP Address"
        value={ipAddress}
        onChange={(e) => setIpAddress(e.target.value)}
        required
        fullWidth
        placeholder="192.168.1.100"
        error={ipError}
        helperText={ipError ? 'Enter a valid IPv4 or IPv6 address' : undefined}
      />
      <TextField
        label="Description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        fullWidth
      />
      <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
        <Button onClick={onCancel}>Cancel</Button>
        <Button type="submit" variant="contained" disabled={isSubmitting || !formValid}>
          {isSubmitting ? 'Saving...' : 'Save'}
        </Button>
      </Box>
    </Box>
  );
}

// --- Main Component ---

export function DnsForwarderTab() {
  const queryClient = useQueryClient();
  const [hasPendingChanges, setHasPendingChanges] = useState(false);
  const [overrideDialogOpen, setOverrideDialogOpen] = useState(false);
  const [editingOverride, setEditingOverride] = useState<DnsForwarderHostOverride | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DnsForwarderHostOverride | null>(null);

  // --- Queries ---

  const {
    data: settingsData,
    isLoading: settingsLoading,
    isError: settingsError,
    refetch: refetchSettings,
  } = useQuery({
    queryKey: servicesQueryKeys.dnsForwarderSettings,
    queryFn: fetchDnsForwarderSettings,
  });

  const settings = settingsData?.data;

  const {
    data: overridesData,
    isLoading: overridesLoading,
  } = useQuery({
    queryKey: servicesQueryKeys.dnsForwarderHostOverrides,
    queryFn: fetchDnsForwarderHostOverrides,
  });

  const hostOverrides = overridesData?.data ?? [];

  // --- Local settings state ---

  const [localSettings, setLocalSettings] = useState<Partial<DnsForwarderSettings>>({});

  const handleSettingChange = (field: keyof DnsForwarderSettings, value: unknown) => {
    setLocalSettings((prev) => ({ ...prev, [field]: value }));
    setHasPendingChanges(true);
  };

  // --- Mutations ---

  const saveSettingsMutation = useMutation({
    mutationFn: () => updateDnsForwarderSettings(localSettings),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: servicesQueryKeys.dnsForwarderSettings });
      setLocalSettings({});
    },
  });

  const createOverrideMutation = useMutation({
    mutationFn: createDnsForwarderHostOverride,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: servicesQueryKeys.dnsForwarderHostOverrides });
      setOverrideDialogOpen(false);
      setEditingOverride(null);
      setHasPendingChanges(true);
    },
  });

  const updateOverrideMutation = useMutation({
    mutationFn: ({ id, input }: { id: number; input: Partial<DnsForwarderHostOverrideCreateInput> }) =>
      updateDnsForwarderHostOverride(id, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: servicesQueryKeys.dnsForwarderHostOverrides });
      setOverrideDialogOpen(false);
      setEditingOverride(null);
      setHasPendingChanges(true);
    },
  });

  const deleteOverrideMutation = useMutation({
    mutationFn: deleteDnsForwarderHostOverride,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: servicesQueryKeys.dnsForwarderHostOverrides });
      setDeleteTarget(null);
      setHasPendingChanges(true);
    },
  });

  const applyChanges = useApplyChanges({
    endpoint: '/services/dns_forwarder/apply',
    invalidateKeys: [
      [...servicesQueryKeys.dnsForwarderSettings],
      [...servicesQueryKeys.dnsForwarderHostOverrides],
    ],
    onSuccess: () => setHasPendingChanges(false),
  });

  // --- Handlers ---

  const handleOverrideSubmit = useCallback(
    (formData: DnsForwarderHostOverrideCreateInput) => {
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
          Failed to load DNS forwarder settings.
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

      {/* DNS Forwarder Settings */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          DNS Forwarder Settings
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <FormControlLabel
            control={
              <Checkbox
                checked={effectiveSettings?.enable ?? false}
                onChange={(e) => handleSettingChange('enable', e.target.checked)}
              />
            }
            label="Enable DNS Forwarder"
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
                  checked={effectiveSettings?.log_queries ?? false}
                  onChange={(e) => handleSettingChange('log_queries', e.target.checked)}
                />
              }
              label="Log Queries"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={effectiveSettings?.strict_binding ?? false}
                  onChange={(e) => handleSettingChange('strict_binding', e.target.checked)}
                />
              }
              label="Strict Interface Binding"
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
          <ForwarderOverrideForm
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
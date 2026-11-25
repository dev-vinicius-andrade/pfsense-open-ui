import { useState, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useSnackbar } from 'notistack';
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogTitle,
  Divider,
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
  TableSortLabel,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import RefreshIcon from '@mui/icons-material/Refresh';
import { PageHeader } from '@/components/shared/PageHeader';
import { EmptyState } from '@/components/shared/EmptyState';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import {
  fetchDhcpStaticMappings,
  fetchDhcpLeases,
  createDhcpStaticMapping,
  updateDhcpStaticMapping,
  deleteDhcpStaticMapping,
  servicesQueryKeys,
  type DhcpStaticMapping,
  type DhcpStaticMappingCreateInput,
  type DhcpLease,
} from '@/api/modules/services';

// --- Validation Schema ---

const mappingSchema = z.object({
  interface: z.string().min(1, 'Interface is required'),
  mac_address: z
    .string()
    .min(1, 'MAC address is required')
    .regex(/^([0-9A-Fa-f]{2}:){5}[0-9A-Fa-f]{2}$/, 'Invalid MAC address format (XX:XX:XX:XX:XX:XX)'),
  ip_address: z
    .string()
    .min(1, 'IP address is required')
    .regex(
      /^(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)$/,
      'Invalid IPv4 address',
    ),
  hostname: z.string().optional(),
  description: z.string().optional(),
});

type MappingFormData = z.infer<typeof mappingSchema>;

// --- Interface Chip Colors ---

const INTERFACE_COLORS: Record<string, 'primary' | 'secondary' | 'success' | 'warning' | 'info' | 'error'> = {
  lan: 'primary',
  wan: 'error',
  dmz: 'warning',
  iot: 'info',
  guest: 'secondary',
};

function getInterfaceColor(iface: string): 'primary' | 'secondary' | 'success' | 'warning' | 'info' | 'error' {
  return INTERFACE_COLORS[iface.toLowerCase()] ?? 'success';
}

// --- Sort Types ---

type SortField = 'ip_address' | 'mac_address' | 'hostname' | 'interface';
type SortDirection = 'asc' | 'desc';

// --- Unmapped Device Type ---

interface UnmappedDevice {
  mac_address: string;
  ip_address: string;
  hostname?: string;
  interface: string;
  ends: string;
}

// --- Create Dialog with Smart Workflow ---

interface CreateMappingDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: DhcpStaticMappingCreateInput) => void;
  isSubmitting: boolean;
  allMappings: DhcpStaticMapping[];
  leases: DhcpLease[];
  availableInterfaces: string[];
}

function CreateMappingDialog({
  open,
  onClose,
  onSubmit,
  isSubmitting,
  allMappings,
  leases,
  availableInterfaces,
}: CreateMappingDialogProps) {
  const [step, setStep] = useState<'select' | 'form'>('select');

  // Compute unmapped devices: active leases without a static mapping
  const unmappedDevices = useMemo(() => {
    const mappedMacs = new Set(allMappings.map((m) => m.mac_address.toLowerCase()));
    return leases
      .filter((l) => l.status === 'active' && !mappedMacs.has(l.mac_address.toLowerCase()))
      .map((l): UnmappedDevice => ({
        mac_address: l.mac_address,
        ip_address: l.ip_address,
        hostname: l.hostname,
        interface: l.interface,
        ends: l.ends,
      }));
  }, [leases, allMappings]);

  const {
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<MappingFormData>({
    resolver: zodResolver(mappingSchema),
    defaultValues: {
      interface: availableInterfaces[0] ?? '',
      mac_address: '',
      ip_address: '',
      hostname: '',
      description: '',
    },
  });

  // Watch interface field to update context preview
  const watchedInterface = watch('interface');

  const interfaceContextMappings = useMemo(() => {
    return allMappings.filter((m) => m.interface === watchedInterface);
  }, [allMappings, watchedInterface]);

  // Reset form when dialog opens
  const [prevOpen, setPrevOpen] = useState(false);
  if (open && !prevOpen) {
    setStep(unmappedDevices.length > 0 ? 'select' : 'form');
    reset({
      interface: availableInterfaces[0] ?? '',
      mac_address: '',
      ip_address: '',
      hostname: '',
      description: '',
    });
  }
  if (open !== prevOpen) {
    setPrevOpen(open);
  }

  const handleSelectDevice = (device: UnmappedDevice) => {
    reset({
      interface: device.interface,
      mac_address: device.mac_address,
      ip_address: device.ip_address,
      hostname: device.hostname ?? '',
      description: '',
    });
    setStep('form');
  };

  const handleManualEntry = () => {
    reset({
      interface: availableInterfaces[0] ?? '',
      mac_address: '',
      ip_address: '',
      hostname: '',
      description: '',
    });
    setStep('form');
  };

  const handleBackToSelect = () => {
    setStep('select');
  };

  const handleFormSubmit = (data: MappingFormData) => {
    onSubmit({
      interface: data.interface,
      mac_address: data.mac_address,
      ip_address: data.ip_address,
      hostname: data.hostname || undefined,
      description: data.description || undefined,
    });
  };

  const handleClose = () => {
    setStep('select');
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>Create Static Mapping</DialogTitle>

      {step === 'select' && (
        <Box sx={{ px: 3, pb: 3 }}>
          {unmappedDevices.length === 0 ? (
            <Box>
              <Typography color="text.secondary" sx={{ mb: 2 }}>
                No unmapped active devices found. All active leases already have static mappings.
              </Typography>
              <Button variant="contained" onClick={handleManualEntry}>
                Enter Manually
              </Button>
            </Box>
          ) : (
            <Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Select an active device to pre-fill the mapping, or enter details manually.
              </Typography>

              <TableContainer component={Paper} variant="outlined" sx={{ mb: 2, maxHeight: 300 }}>
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell>MAC Address</TableCell>
                      <TableCell>Current IP</TableCell>
                      <TableCell>Hostname</TableCell>
                      <TableCell>Interface</TableCell>
                      <TableCell>Lease Expiry</TableCell>
                      <TableCell align="right">Action</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {unmappedDevices.map((device) => (
                      <TableRow
                        key={`${device.mac_address}-${device.ip_address}`}
                        hover
                        sx={{ cursor: 'pointer' }}
                        onClick={() => handleSelectDevice(device)}
                      >
                        <TableCell sx={{ fontFamily: 'monospace' }}>{device.mac_address}</TableCell>
                        <TableCell>{device.ip_address}</TableCell>
                        <TableCell>{device.hostname || '-'}</TableCell>
                        <TableCell>
                          <Chip
                            label={device.interface.toUpperCase()}
                            color={getInterfaceColor(device.interface)}
                            size="small"
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell>
                          {new Date(device.ends).toLocaleString()}
                        </TableCell>
                        <TableCell align="right">
                          <Button size="small" variant="outlined">
                            Select
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              <Button variant="outlined" onClick={handleManualEntry}>
                Enter Manually Instead
              </Button>
            </Box>
          )}
        </Box>
      )}

      {step === 'form' && (
        <Box sx={{ px: 3, pb: 3 }}>
          {unmappedDevices.length > 0 && (
            <Button size="small" onClick={handleBackToSelect} sx={{ mb: 2 }}>
              Back to device list
            </Button>
          )}

          <Box component="form" onSubmit={handleSubmit(handleFormSubmit)} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Controller
              name="interface"
              control={control}
              render={({ field }) => (
                <FormControl fullWidth error={!!errors.interface}>
                  <InputLabel id="create-mapping-interface-label">Interface</InputLabel>
                  <Select
                    {...field}
                    labelId="create-mapping-interface-label"
                    label="Interface"
                    onChange={(e) => {
                      field.onChange(e);
                    }}
                  >
                    {availableInterfaces.map((iface) => (
                      <MenuItem key={iface} value={iface}>
                        {iface.toUpperCase()}
                      </MenuItem>
                    ))}
                  </Select>
                  {errors.interface && (
                    <Typography variant="caption" color="error">
                      {errors.interface.message}
                    </Typography>
                  )}
                </FormControl>
              )}
            />

            <Controller
              name="mac_address"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="MAC Address"
                  placeholder="00:11:22:33:44:55"
                  fullWidth
                  error={!!errors.mac_address}
                  helperText={errors.mac_address?.message}
                />
              )}
            />

            <Controller
              name="ip_address"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="IP Address"
                  placeholder="192.168.1.100"
                  fullWidth
                  error={!!errors.ip_address}
                  helperText={errors.ip_address?.message}
                />
              )}
            />

            <Controller
              name="hostname"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Hostname"
                  fullWidth
                  error={!!errors.hostname}
                  helperText={errors.hostname?.message}
                />
              )}
            />

            <Controller
              name="description"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Description"
                  fullWidth
                  error={!!errors.description}
                  helperText={errors.description?.message}
                />
              )}
            />

            {/* Interface Context: show existing mappings for selected interface */}
            {interfaceContextMappings.length > 0 && (
              <Box>
                <Divider sx={{ my: 1 }} />
                <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
                  Existing mappings on {watchedInterface.toUpperCase()} ({interfaceContextMappings.length}):
                </Typography>
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>IP Address</TableCell>
                        <TableCell>MAC Address</TableCell>
                        <TableCell>Hostname</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {interfaceContextMappings.map((m) => (
                        <TableRow key={m.id}>
                          <TableCell>{m.ip_address}</TableCell>
                          <TableCell sx={{ fontFamily: 'monospace' }}>{m.mac_address}</TableCell>
                          <TableCell>{m.hostname || '-'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            )}

            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end', mt: 1 }}>
              <Button onClick={handleClose} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" variant="contained" disabled={isSubmitting}>
                {isSubmitting ? 'Creating...' : 'Create Mapping'}
              </Button>
            </Box>
          </Box>
        </Box>
      )}
    </Dialog>
  );
}

// --- Edit Dialog (simpler, no smart workflow) ---

interface EditMappingDialogProps {
  open: boolean;
  initialData: DhcpStaticMapping | null;
  availableInterfaces: string[];
  allMappings: DhcpStaticMapping[];
  onClose: () => void;
  onSubmit: (data: DhcpStaticMappingCreateInput) => void;
  isSubmitting: boolean;
}

function EditMappingDialog({
  open,
  initialData,
  availableInterfaces,
  allMappings,
  onClose,
  onSubmit,
  isSubmitting,
}: EditMappingDialogProps) {
  const {
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<MappingFormData>({
    resolver: zodResolver(mappingSchema),
    defaultValues: {
      interface: initialData?.interface ?? availableInterfaces[0] ?? '',
      mac_address: initialData?.mac_address ?? '',
      ip_address: initialData?.ip_address ?? '',
      hostname: initialData?.hostname ?? '',
      description: initialData?.description ?? '',
    },
  });

  const watchedInterface = watch('interface');

  // Show existing mappings for the selected interface, excluding the one being edited
  const interfaceContextMappings = useMemo(() => {
    return allMappings.filter(
      (m) => m.interface === watchedInterface && (!initialData || m.id !== initialData.id),
    );
  }, [allMappings, watchedInterface, initialData]);

  // Reset form when dialog opens with new data
  const [prevOpen, setPrevOpen] = useState(false);
  if (open && !prevOpen && initialData) {
    reset({
      interface: initialData.interface,
      mac_address: initialData.mac_address,
      ip_address: initialData.ip_address,
      hostname: initialData.hostname ?? '',
      description: initialData.description ?? '',
    });
  }
  if (open !== prevOpen) {
    setPrevOpen(open);
  }

  const handleFormSubmit = (data: MappingFormData) => {
    onSubmit({
      interface: data.interface,
      mac_address: data.mac_address,
      ip_address: data.ip_address,
      hostname: data.hostname || undefined,
      description: data.description || undefined,
    });
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Edit Static Mapping</DialogTitle>
      <Box component="form" onSubmit={handleSubmit(handleFormSubmit)} sx={{ px: 3, pb: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Controller
          name="interface"
          control={control}
          render={({ field }) => (
            <FormControl fullWidth error={!!errors.interface}>
              <InputLabel id="edit-mapping-interface-label">Interface</InputLabel>
              <Select
                {...field}
                labelId="edit-mapping-interface-label"
                label="Interface"
              >
                {availableInterfaces.map((iface) => (
                  <MenuItem key={iface} value={iface}>
                    {iface.toUpperCase()}
                  </MenuItem>
                ))}
              </Select>
              {errors.interface && (
                <Typography variant="caption" color="error">
                  {errors.interface.message}
                </Typography>
              )}
            </FormControl>
          )}
        />

        <Controller
          name="mac_address"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              label="MAC Address"
              placeholder="00:11:22:33:44:55"
              fullWidth
              error={!!errors.mac_address}
              helperText={errors.mac_address?.message}
            />
          )}
        />

        <Controller
          name="ip_address"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              label="IP Address"
              placeholder="192.168.1.100"
              fullWidth
              error={!!errors.ip_address}
              helperText={errors.ip_address?.message}
            />
          )}
        />

        <Controller
          name="hostname"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              label="Hostname"
              fullWidth
              error={!!errors.hostname}
              helperText={errors.hostname?.message}
            />
          )}
        />

        <Controller
          name="description"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              label="Description"
              fullWidth
              error={!!errors.description}
              helperText={errors.description?.message}
            />
          )}
        />

        {/* Interface Context Preview */}
        {interfaceContextMappings.length > 0 && (
          <Box>
            <Divider sx={{ my: 1 }} />
            <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
              Other mappings on {watchedInterface.toUpperCase()} ({interfaceContextMappings.length}):
            </Typography>
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>IP Address</TableCell>
                    <TableCell>MAC Address</TableCell>
                    <TableCell>Hostname</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {interfaceContextMappings.map((m) => (
                    <TableRow key={m.id}>
                      <TableCell>{m.ip_address}</TableCell>
                      <TableCell sx={{ fontFamily: 'monospace' }}>{m.mac_address}</TableCell>
                      <TableCell>{m.hostname || '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}

        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end', mt: 1 }}>
          <Button onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" variant="contained" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : 'Update'}
          </Button>
        </Box>
      </Box>
    </Dialog>
  );
}

// --- Main Component ---

export function DhcpStaticMappingsPage() {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();

  const [searchText, setSearchText] = useState('');
  const [interfaceFilter, setInterfaceFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<SortField>('interface');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editingMapping, setEditingMapping] = useState<DhcpStaticMapping | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DhcpStaticMapping | null>(null);

  // --- Queries ---

  const {
    data: mappingsData,
    isLoading: mappingsLoading,
    isError: mappingsError,
    refetch: refetchMappings,
  } = useQuery({
    queryKey: servicesQueryKeys.dhcpStaticMappings,
    queryFn: fetchDhcpStaticMappings,
  });

  const {
    data: leasesData,
    isLoading: leasesLoading,
  } = useQuery({
    queryKey: servicesQueryKeys.dhcpLeases,
    queryFn: fetchDhcpLeases,
  });

  const mappings = mappingsData?.data ?? [];
  const leases = leasesData?.data ?? [];

  // Derive unique interfaces from data
  const availableInterfaces = useMemo(() => {
    const ifaces = new Set(mappings.map((m) => m.interface));
    // Also include interfaces from leases that might not have mappings yet
    leases.forEach((l) => ifaces.add(l.interface));
    return Array.from(ifaces).sort();
  }, [mappings, leases]);

  // --- Mutations ---

  const createMutation = useMutation({
    mutationFn: createDhcpStaticMapping,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: servicesQueryKeys.dhcpStaticMappings });
      enqueueSnackbar('Static mapping created successfully', { variant: 'success' });
      setCreateDialogOpen(false);
    },
    onError: () => {
      enqueueSnackbar('Failed to create static mapping', { variant: 'error' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, input }: { id: number; input: Partial<DhcpStaticMappingCreateInput> }) =>
      updateDhcpStaticMapping(id, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: servicesQueryKeys.dhcpStaticMappings });
      enqueueSnackbar('Static mapping updated successfully', { variant: 'success' });
      setEditingMapping(null);
    },
    onError: () => {
      enqueueSnackbar('Failed to update static mapping', { variant: 'error' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteDhcpStaticMapping,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: servicesQueryKeys.dhcpStaticMappings });
      enqueueSnackbar('Static mapping deleted successfully', { variant: 'success' });
      setDeleteTarget(null);
    },
    onError: () => {
      enqueueSnackbar('Failed to delete static mapping', { variant: 'error' });
    },
  });

  // --- Handlers ---

  const handleSort = useCallback(
    (field: SortField) => {
      if (sortField === field) {
        setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
      } else {
        setSortField(field);
        setSortDirection('asc');
      }
    },
    [sortField],
  );

  const handleCreateSubmit = useCallback(
    (formData: DhcpStaticMappingCreateInput) => {
      createMutation.mutate(formData);
    },
    [createMutation],
  );

  const handleEditSubmit = useCallback(
    (formData: DhcpStaticMappingCreateInput) => {
      if (editingMapping) {
        updateMutation.mutate({ id: editingMapping.id, input: formData });
      }
    },
    [editingMapping, updateMutation],
  );

  // --- Filtered & Sorted Data ---

  const filteredAndSortedMappings = useMemo(() => {
    let result = mappings;

    if (interfaceFilter !== 'all') {
      result = result.filter((m) => m.interface === interfaceFilter);
    }

    if (searchText.trim()) {
      const lowerSearch = searchText.toLowerCase().trim();
      result = result.filter(
        (m) =>
          m.ip_address.toLowerCase().includes(lowerSearch) ||
          m.mac_address.toLowerCase().includes(lowerSearch) ||
          (m.hostname?.toLowerCase().includes(lowerSearch) ?? false) ||
          (m.description?.toLowerCase().includes(lowerSearch) ?? false),
      );
    }

    result = [...result].sort((a, b) => {
      const aVal = a[sortField] ?? '';
      const bVal = b[sortField] ?? '';
      const comparison = String(aVal).localeCompare(String(bVal));
      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [mappings, interfaceFilter, searchText, sortField, sortDirection]);

  const isLoading = mappingsLoading || leasesLoading;

  // --- Render States ---

  if (isLoading) {
    return (
      <Box>
        <PageHeader title="DHCP Static Mappings" />
        <Paper sx={{ p: 3 }}>
          <Skeleton height={48} sx={{ mb: 2 }} />
          <Skeleton height={300} />
        </Paper>
      </Box>
    );
  }

  if (mappingsError) {
    return (
      <Box>
        <PageHeader title="DHCP Static Mappings" />
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography color="error" sx={{ mb: 2 }}>
            Failed to load DHCP static mappings.
          </Typography>
          <Button variant="outlined" onClick={() => refetchMappings()}>
            Retry
          </Button>
        </Paper>
      </Box>
    );
  }

  // --- Main Render ---

  return (
    <Box>
      <PageHeader
        title="DHCP Static Mappings"
        subtitle={`${mappings.length} total mapping${mappings.length !== 1 ? 's' : ''}`}
        actions={
          <>
            <Button
              startIcon={<RefreshIcon />}
              onClick={() => refetchMappings()}
              aria-label="Refresh mappings"
            >
              Refresh
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setCreateDialogOpen(true)}
              aria-label="Add static mapping"
            >
              Add Mapping
            </Button>
          </>
        }
      />

      {/* Filter Bar */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
          <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel id="interface-filter-label">Interface</InputLabel>
            <Select
              labelId="interface-filter-label"
              value={interfaceFilter}
              label="Interface"
              onChange={(e) => setInterfaceFilter(e.target.value)}
            >
              <MenuItem value="all">All Interfaces</MenuItem>
              {availableInterfaces.map((iface) => (
                <MenuItem key={iface} value={iface}>
                  {iface.toUpperCase()}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            size="small"
            placeholder="Search by IP, MAC, hostname, or description..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            sx={{ minWidth: 320, flex: 1 }}
            aria-label="Search static mappings"
          />

          <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>
            {filteredAndSortedMappings.length} of {mappings.length} mappings
          </Typography>
        </Box>
      </Paper>

      {/* Table */}
      <Paper>
        {filteredAndSortedMappings.length === 0 ? (
          <EmptyState
            message={
              mappings.length === 0
                ? 'No static mappings configured.'
                : 'No mappings match your filters.'
            }
          />
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  {[
                    { field: 'interface' as const, label: 'Interface' },
                    { field: 'ip_address' as const, label: 'IP Address' },
                    { field: 'mac_address' as const, label: 'MAC Address' },
                    { field: 'hostname' as const, label: 'Hostname' },
                  ].map((col) => (
                    <TableCell key={col.field} sortDirection={sortField === col.field ? sortDirection : false}>
                      <TableSortLabel
                        active={sortField === col.field}
                        direction={sortField === col.field ? sortDirection : 'asc'}
                        onClick={() => handleSort(col.field)}
                      >
                        {col.label}
                      </TableSortLabel>
                    </TableCell>
                  ))}
                  <TableCell>Description</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredAndSortedMappings.map((mapping) => (
                  <TableRow key={mapping.id}>
                    <TableCell>
                      <Chip
                        label={mapping.interface.toUpperCase()}
                        color={getInterfaceColor(mapping.interface)}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>{mapping.ip_address}</TableCell>
                    <TableCell sx={{ fontFamily: 'monospace' }}>{mapping.mac_address}</TableCell>
                    <TableCell>{mapping.hostname || '-'}</TableCell>
                    <TableCell>{mapping.description || '-'}</TableCell>
                    <TableCell align="right">
                      <Tooltip title="Edit">
                        <IconButton
                          size="small"
                          onClick={() => setEditingMapping(mapping)}
                          aria-label={`Edit mapping for ${mapping.ip_address}`}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => setDeleteTarget(mapping)}
                          aria-label={`Delete mapping for ${mapping.ip_address}`}
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

      {/* Create Dialog with Smart Workflow */}
      <CreateMappingDialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        onSubmit={handleCreateSubmit}
        isSubmitting={createMutation.isPending}
        allMappings={mappings}
        leases={leases}
        availableInterfaces={availableInterfaces.length > 0 ? availableInterfaces : ['lan', 'wan', 'dmz', 'iot']}
      />

      {/* Edit Dialog */}
      <EditMappingDialog
        open={editingMapping !== null}
        initialData={editingMapping}
        availableInterfaces={availableInterfaces.length > 0 ? availableInterfaces : ['lan', 'wan', 'dmz', 'iot']}
        allMappings={mappings}
        onClose={() => setEditingMapping(null)}
        onSubmit={handleEditSubmit}
        isSubmitting={updateMutation.isPending}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={deleteTarget !== null}
        title="Delete Static Mapping"
        message={
          deleteTarget
            ? `Are you sure you want to delete the mapping for "${deleteTarget.ip_address}" (${deleteTarget.mac_address})${deleteTarget.hostname ? ` — ${deleteTarget.hostname}` : ''}? This action cannot be undone.`
            : ''
        }
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
import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useSnackbar } from 'notistack';
import {
  Box,
  Button,
  FormControlLabel,
  Paper,
  Skeleton,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import RefreshIcon from '@mui/icons-material/Refresh';
import { PageHeader } from '@/components/shared/PageHeader';
import { getErrorMessage } from '@/utils/errorMessage';
import {
  fetchFirewallAdvancedSettings,
  updateFirewallAdvancedSettings,
  firewallQueryKeys,
} from '@/api/modules/firewall';

const advancedSettingsSchema = z.object({
  disable_filter: z.boolean(),
  allow_private_networks: z.boolean(),
  bogon_networks: z.boolean(),
  rfc_1918: z.boolean(),
  max_states: z.number().int().min(1),
  max_src_nodes: z.number().int().min(1),
  max_src_conn: z.number().int().min(1),
  max_src_conn_rate_count: z.number().int().min(0),
  max_src_conn_rate_seconds: z.number().int().min(1),
});

type AdvancedSettingsFormData = z.infer<typeof advancedSettingsSchema>;

export function FirewallAdvancedSettingsPage() {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: firewallQueryKeys.advancedSettings,
    queryFn: fetchFirewallAdvancedSettings,
  });

  const settings = data?.data;

  const { control, handleSubmit, reset, formState: { isDirty } } = useForm<AdvancedSettingsFormData>({
    resolver: zodResolver(advancedSettingsSchema),
    defaultValues: {
      disable_filter: false,
      allow_private_networks: false,
      bogon_networks: false,
      rfc_1918: false,
      max_states: 131072,
      max_src_nodes: 1000,
      max_src_conn: 1000,
      max_src_conn_rate_count: 0,
      max_src_conn_rate_seconds: 1,
    },
  });

  useEffect(() => {
    if (settings) {
      reset(settings);
    }
  }, [settings, reset]);

  const saveMutation = useMutation({
    mutationFn: (formData: AdvancedSettingsFormData) =>
      updateFirewallAdvancedSettings(formData),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: firewallQueryKeys.advancedSettings });
      enqueueSnackbar('Firewall advanced settings saved successfully', { variant: 'success' });
    },
    onError: (error: unknown) => {
      enqueueSnackbar(getErrorMessage(error, 'Failed to save firewall advanced settings'), {
        variant: 'error',
      });
    },
  });

  const onSubmit = (formData: AdvancedSettingsFormData) => {
    saveMutation.mutate(formData);
  };

  return (
    <Box>
      <PageHeader
        title="Firewall Advanced Settings"
        actions={
          <Button startIcon={<RefreshIcon />} onClick={() => refetch()} disabled={isLoading}>
            Refresh
          </Button>
        }
      />

      {isLoading && (
        <Paper sx={{ p: 3 }}>
          {[...Array(8)].map((_, i) => (
            <Skeleton key={i} height={40} sx={{ mb: 2 }} />
          ))}
        </Paper>
      )}

      {isError && (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography color="error" sx={{ mb: 2 }}>
            Failed to load firewall advanced settings:{' '}
            {error instanceof Error ? error.message : 'Unknown error'}
          </Typography>
          <Button variant="outlined" onClick={() => refetch()}>
            Retry
          </Button>
        </Paper>
      )}

      {!isLoading && !isError && settings && (
        <Paper component="form" onSubmit={handleSubmit(onSubmit)} sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Filtering & Normalization
          </Typography>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 3 }}>
            <Controller
              name="disable_filter"
              control={control}
              render={({ field }) => (
                <FormControlLabel
                  control={<Switch checked={field.value} onChange={field.onChange} />}
                  label="Disable Firewall (block all traffic)"
                />
              )}
            />
            <Controller
              name="allow_private_networks"
              control={control}
              render={({ field }) => (
                <FormControlLabel
                  control={<Switch checked={field.value} onChange={field.onChange} />}
                  label="Allow Private Networks on WAN"
                />
              )}
            />
            <Controller
              name="bogon_networks"
              control={control}
              render={({ field }) => (
                <FormControlLabel
                  control={<Switch checked={field.value} onChange={field.onChange} />}
                  label="Block Bogon Networks"
                />
              )}
            />
            <Controller
              name="rfc_1918"
              control={control}
              render={({ field }) => (
                <FormControlLabel
                  control={<Switch checked={field.value} onChange={field.onChange} />}
                  label="Block RFC 1918 Private Networks"
                />
              )}
            />
          </Box>

          <Typography variant="h6" gutterBottom>
            State Table Limits
          </Typography>

          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2, mb: 3 }}>
            <Controller
              name="max_states"
              control={control}
              render={({ field, fieldState }) => (
                <TextField
                  label="Maximum States"
                  type="number"
                  fullWidth
                  size="small"
                  value={field.value}
                  onChange={(e) => field.onChange(Number(e.target.value))}
                  error={!!fieldState.error}
                  helperText={fieldState.error?.message ?? 'Maximum number of state table entries'}
                  slotProps={{ htmlInput: { min: 1 } }}
                />
              )}
            />
            <Controller
              name="max_src_nodes"
              control={control}
              render={({ field, fieldState }) => (
                <TextField
                  label="Maximum Source Nodes"
                  type="number"
                  fullWidth
                  size="small"
                  value={field.value}
                  onChange={(e) => field.onChange(Number(e.target.value))}
                  error={!!fieldState.error}
                  helperText={fieldState.error?.message ?? 'Max unique source IPs per rule'}
                  slotProps={{ htmlInput: { min: 1 } }}
                />
              )}
            />
            <Controller
              name="max_src_conn"
              control={control}
              render={({ field, fieldState }) => (
                <TextField
                  label="Maximum Source Connections"
                  type="number"
                  fullWidth
                  size="small"
                  value={field.value}
                  onChange={(e) => field.onChange(Number(e.target.value))}
                  error={!!fieldState.error}
                  helperText={fieldState.error?.message ?? 'Max concurrent connections per source'}
                  slotProps={{ htmlInput: { min: 1 } }}
                />
              )}
            />
          </Box>

          <Typography variant="h6" gutterBottom>
            Source Tracking Rate Limiting
          </Typography>

          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2, mb: 3 }}>
            <Controller
              name="max_src_conn_rate_count"
              control={control}
              render={({ field, fieldState }) => (
                <TextField
                  label="Max New Connections (count)"
                  type="number"
                  fullWidth
                  size="small"
                  value={field.value}
                  onChange={(e) => field.onChange(Number(e.target.value))}
                  error={!!fieldState.error}
                  helperText={fieldState.error?.message ?? 'Number of new connections allowed in time window (0 = unlimited)'}
                  slotProps={{ htmlInput: { min: 0 } }}
                />
              )}
            />
            <Controller
              name="max_src_conn_rate_seconds"
              control={control}
              render={({ field, fieldState }) => (
                <TextField
                  label="Rate Window (seconds)"
                  type="number"
                  fullWidth
                  size="small"
                  value={field.value}
                  onChange={(e) => field.onChange(Number(e.target.value))}
                  error={!!fieldState.error}
                  helperText={fieldState.error?.message ?? 'Time window for rate limiting'}
                  slotProps={{ htmlInput: { min: 1 } }}
                />
              )}
            />
          </Box>

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', pt: 2, borderTop: 1, borderColor: 'divider' }}>
            <Button
              type="submit"
              variant="contained"
              startIcon={<SaveIcon />}
              disabled={!isDirty || saveMutation.isPending}
            >
              {saveMutation.isPending ? 'Saving...' : 'Save Settings'}
            </Button>
          </Box>
        </Paper>
      )}
    </Box>
  );
}
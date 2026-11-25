import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Autocomplete,
  Box,
  Button,
  Chip,
  CircularProgress,
  Paper,
  Stack,
  TextField,
  Typography,
  Alert,
  Switch,
  FormControlLabel,
} from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  fetchHostname,
  fetchTimezone,
  fetchDns,
  updateHostname,
  updateTimezone,
  updateDns,
  systemQueryKeys,
} from '@/api/modules/system';
import { TIMEZONE_OPTIONS } from '@/utils/timezones';

const DNS_SUGGESTIONS = [
  { label: 'Cloudflare', servers: ['1.1.1.1', '1.0.0.1'] },
  { label: 'Google', servers: ['8.8.8.8', '8.8.4.4'] },
  { label: 'Quad9', servers: ['9.9.9.9', '149.112.112.112'] },
  { label: 'OpenDNS', servers: ['208.67.222.222', '208.67.220.220'] },
  { label: 'AdGuard', servers: ['94.140.14.14', '94.140.15.15'] },
] as const;

const hostnameSchema = z.object({
  hostname: z.string().min(1, 'Hostname is required').max(63),
  domain: z.string().max(253).optional(),
});

const dnsSchema = z.object({
  dns_servers: z.array(z.string()).optional(),
  dns_gateway_override: z.boolean(),
  dns_allow_override: z.boolean(),
});

type HostnameFormData = z.infer<typeof hostnameSchema>;
type DnsFormData = z.infer<typeof dnsSchema>;

export function GeneralSetupTab() {
  const queryClient = useQueryClient();

  const hostnameQuery = useQuery({
    queryKey: systemQueryKeys.hostname,
    queryFn: fetchHostname,
  });

  const timezoneQuery = useQuery({
    queryKey: systemQueryKeys.timezone,
    queryFn: fetchTimezone,
  });

  const dnsQuery = useQuery({
    queryKey: systemQueryKeys.dns,
    queryFn: fetchDns,
  });

  const hostnameForm = useForm<HostnameFormData>({
    resolver: zodResolver(hostnameSchema),
    defaultValues: { hostname: '', domain: '' },
  });

  const dnsForm = useForm<DnsFormData>({
    resolver: zodResolver(dnsSchema),
    defaultValues: {
      dns_servers: [],
      dns_gateway_override: false,
      dns_allow_override: true,
    },
  });

  useEffect(() => {
    if (hostnameQuery.data?.data) {
      hostnameForm.reset({
        hostname: hostnameQuery.data.data.hostname,
        domain: hostnameQuery.data.data.domain,
      });
    }
  }, [hostnameQuery.data, hostnameForm]);

  useEffect(() => {
    if (dnsQuery.data?.data) {
      dnsForm.reset({
        dns_servers: dnsQuery.data.data.dns_servers ?? [],
        dns_gateway_override: dnsQuery.data.data.dns_gateway_override ?? false,
        dns_allow_override: dnsQuery.data.data.dns_allow_override ?? true,
      });
    }
  }, [dnsQuery.data, dnsForm]);

  const hostnameMutation = useMutation({
    mutationFn: updateHostname,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: systemQueryKeys.hostname });
    },
  });

  const timezoneMutation = useMutation({
    mutationFn: updateTimezone,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: systemQueryKeys.timezone });
    },
  });

  const dnsMutation = useMutation({
    mutationFn: updateDns,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: systemQueryKeys.dns });
    },
  });

  const isLoading = hostnameQuery.isLoading || timezoneQuery.isLoading || dnsQuery.isLoading;
  const isError = hostnameQuery.isError || timezoneQuery.isError || dnsQuery.isError;

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (isError) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        Failed to load system settings. Please try again.
      </Alert>
    );
  }

  const handleApplySuggestion = (servers: readonly string[]) => {
    dnsForm.setValue('dns_servers', [...servers], { shouldDirty: true });
  };

  return (
    <Stack spacing={3}>
      {/* Hostname Section */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Hostname
        </Typography>
        <Stack spacing={2} component="form" onSubmit={hostnameForm.handleSubmit((data) => hostnameMutation.mutate(data))}>
          <Controller
            name="hostname"
            control={hostnameForm.control}
            render={({ field, fieldState }) => (
              <TextField
                {...field}
                label="Hostname"
                error={!!fieldState.error}
                helperText={fieldState.error?.message}
                fullWidth
                size="small"
              />
            )}
          />
          <Controller
            name="domain"
            control={hostnameForm.control}
            render={({ field, fieldState }) => (
              <TextField
                {...field}
                label="Domain"
                error={!!fieldState.error}
                helperText={fieldState.error?.message}
                fullWidth
                size="small"
              />
            )}
          />
          <Box>
            <Button
              type="submit"
              variant="contained"
              disabled={hostnameMutation.isPending}
            >
              {hostnameMutation.isPending ? 'Saving...' : 'Save Hostname'}
            </Button>
            {hostnameMutation.isSuccess && (
              <Typography color="success.main" variant="body2" sx={{ ml: 2, display: 'inline' }}>
                Saved
              </Typography>
            )}
          </Box>
        </Stack>
      </Paper>

      {/* Timezone Section */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Timezone
        </Typography>
        <Stack spacing={2} component="form" onSubmit={(e) => {
          e.preventDefault();
          const formData = new FormData(e.currentTarget);
          const tz = formData.get('timezone') as string;
          if (tz) timezoneMutation.mutate({ timezone: tz });
        }}>
          <Autocomplete
            options={TIMEZONE_OPTIONS}
            groupBy={(option) => option.group}
            getOptionLabel={(option) => `${option.group}/${option.label}`}
            value={TIMEZONE_OPTIONS.find((tz) => tz.value === (timezoneQuery.data?.data?.timezone ?? '')) ?? null}
            onChange={(_e, newValue) => {
              if (newValue) {
                timezoneMutation.mutate({ timezone: newValue.value });
              }
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Timezone"
                placeholder="Search timezones..."
                size="small"
              />
            )}
            isOptionEqualToValue={(option, value) => option.value === value.value}
            filterOptions={(options, state) => {
              const input = state.inputValue.toLowerCase();
              if (!input) return options;
              return options.filter(
                (opt) =>
                  opt.label.toLowerCase().includes(input) ||
                  opt.value.toLowerCase().includes(input) ||
                  opt.group.toLowerCase().includes(input),
              );
            }}
            fullWidth
          />
          <Box>
            <Button
              type="submit"
              variant="contained"
              disabled={timezoneMutation.isPending}
            >
              {timezoneMutation.isPending ? 'Saving...' : 'Save Timezone'}
            </Button>
            {timezoneMutation.isSuccess && (
              <Typography color="success.main" variant="body2" sx={{ ml: 2, display: 'inline' }}>
                Saved
              </Typography>
            )}
          </Box>
        </Stack>
      </Paper>

      {/* DNS Section */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          DNS Settings
        </Typography>
        <Stack spacing={2} component="form" onSubmit={dnsForm.handleSubmit((data) => dnsMutation.mutate(data))}>
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Suggested DNS Providers
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {DNS_SUGGESTIONS.map((suggestion) => (
                <Chip
                  key={suggestion.label}
                  label={suggestion.label}
                  onClick={() => handleApplySuggestion(suggestion.servers)}
                  color="primary"
                  variant="outlined"
                  size="small"
                  clickable
                />
              ))}
            </Box>
          </Box>
          <Controller
            name="dns_servers"
            control={dnsForm.control}
            render={({ field }) => (
              <TextField
                label="DNS Servers"
                value={(field.value ?? []).join(', ')}
                onChange={(e) => {
                  const servers = e.target.value.split(',').map((s) => s.trim()).filter(Boolean);
                  field.onChange(servers);
                }}
                fullWidth
                size="small"
                helperText="Comma-separated list of DNS server IP addresses"
              />
            )}
          />
          <Controller
            name="dns_gateway_override"
            control={dnsForm.control}
            render={({ field }) => (
              <FormControlLabel
                control={<Switch checked={field.value} onChange={field.onChange} />}
                label="Allow DNS server list to be overridden by DHCP/PPP on WAN"
              />
            )}
          />
          <Controller
            name="dns_allow_override"
            control={dnsForm.control}
            render={({ field }) => (
              <FormControlLabel
                control={<Switch checked={field.value} onChange={field.onChange} />}
                label="Do not use the local DNS service (Unbound/DNS Forwarder)"
              />
            )}
          />
          <Box>
            <Button
              type="submit"
              variant="contained"
              disabled={dnsMutation.isPending}
            >
              {dnsMutation.isPending ? 'Saving...' : 'Save DNS'}
            </Button>
            {dnsMutation.isSuccess && (
              <Typography color="success.main" variant="body2" sx={{ ml: 2, display: 'inline' }}>
                Saved
              </Typography>
            )}
          </Box>
        </Stack>
      </Paper>
    </Stack>
  );
}
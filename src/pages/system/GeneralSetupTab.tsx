import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box,
  Button,
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
          <TextField
            name="timezone"
            label="Timezone"
            defaultValue={timezoneQuery.data?.data?.timezone ?? ''}
            fullWidth
            size="small"
            helperText="e.g., America/New_York, UTC, Europe/London"
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
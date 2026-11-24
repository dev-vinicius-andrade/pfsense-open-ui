import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  Paper,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import { EmptyState } from '@/components/shared/EmptyState';
import {
  fetchNtpSettings,
  updateNtpSettings,
  fetchNtpTimeServers,
  servicesQueryKeys,
  type NtpSettings,
} from '@/api/modules/services';

export function NtpTab() {
  const queryClient = useQueryClient();

  // --- Queries ---

  const {
    data: settingsData,
    isLoading: settingsLoading,
    isError: settingsError,
    refetch: refetchSettings,
  } = useQuery({
    queryKey: servicesQueryKeys.ntpSettings,
    queryFn: fetchNtpSettings,
  });

  const settings = settingsData?.data;

  const {
    data: serversData,
    isLoading: serversLoading,
  } = useQuery({
    queryKey: servicesQueryKeys.ntpTimeServers,
    queryFn: fetchNtpTimeServers,
  });

  const timeServers = serversData?.data ?? [];

  // --- Local settings state ---

  const [localSettings, setLocalSettings] = useState<Partial<NtpSettings>>({});

  const handleSettingChange = (field: keyof NtpSettings, value: unknown) => {
    setLocalSettings((prev) => ({ ...prev, [field]: value }));
  };

  // --- Mutations ---

  const saveSettingsMutation = useMutation({
    mutationFn: () => updateNtpSettings(localSettings),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: servicesQueryKeys.ntpSettings });
      setLocalSettings({});
    },
  });

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
          Failed to load NTP settings.
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
      {/* NTP Settings */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          NTP Settings
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <FormControlLabel
            control={
              <Checkbox
                checked={effectiveSettings?.enable ?? false}
                onChange={(e) => handleSettingChange('enable', e.target.checked)}
              />
            }
            label="Enable NTP Server"
          />
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={effectiveSettings?.orphan_mode ?? false}
                  onChange={(e) => handleSettingChange('orphan_mode', e.target.checked)}
                />
              }
              label="Orphan Mode"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={effectiveSettings?.stats_graph ?? false}
                  onChange={(e) => handleSettingChange('stats_graph', e.target.checked)}
                />
              }
              label="Stats Graph"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={effectiveSettings?.log_peer ?? false}
                  onChange={(e) => handleSettingChange('log_peer', e.target.checked)}
                />
              }
              label="Log Peer"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={effectiveSettings?.kiss_of_death ?? false}
                  onChange={(e) => handleSettingChange('kiss_of_death', e.target.checked)}
                />
              }
              label="Kiss-o'-Death"
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

      {/* Time Servers */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Time Servers
        </Typography>

        {serversLoading ? (
          <Skeleton height={120} />
        ) : timeServers.length === 0 ? (
          <EmptyState message="No NTP time servers configured." />
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Server</TableCell>
                  <TableCell>Prefer</TableCell>
                  <TableCell>Min Poll</TableCell>
                  <TableCell>Max Poll</TableCell>
                  <TableCell>Is Pool</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {timeServers.map((server) => (
                  <TableRow key={server.id}>
                    <TableCell>{server.server}</TableCell>
                    <TableCell>{server.prefer ? 'Yes' : 'No'}</TableCell>
                    <TableCell>{server.min_poll}</TableCell>
                    <TableCell>{server.max_poll}</TableCell>
                    <TableCell>{server.ispool ? 'Yes' : 'No'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>
    </Box>
  );
}
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  Paper,
  Skeleton,
  TextField,
  Typography,
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import {
  fetchSshSettings,
  updateSshSettings,
  servicesQueryKeys,
  type SshSettings,
} from '@/api/modules/services';

export function SshTab() {
  const queryClient = useQueryClient();

  const {
    data: settingsData,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: servicesQueryKeys.sshSettings,
    queryFn: fetchSshSettings,
  });

  const settings = settingsData?.data;
  const [localSettings, setLocalSettings] = useState<Partial<SshSettings>>({});

  const handleSettingChange = (field: keyof SshSettings, value: unknown) => {
    setLocalSettings((prev) => ({ ...prev, [field]: value }));
  };

  const saveMutation = useMutation({
    mutationFn: () => updateSshSettings(localSettings),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: servicesQueryKeys.sshSettings });
      setLocalSettings({});
    },
  });

  if (isLoading) {
    return (
      <Paper sx={{ p: 3 }}>
        <Skeleton height={48} sx={{ mb: 2 }} />
        <Skeleton height={200} />
      </Paper>
    );
  }

  if (isError) {
    return (
      <Paper sx={{ p: 4, textAlign: 'center' }}>
        <Typography color="error" sx={{ mb: 2 }}>
          Failed to load SSH settings.
        </Typography>
        <Button variant="outlined" onClick={() => refetch()}>
          Retry
        </Button>
      </Paper>
    );
  }

  const effective = { ...settings, ...localSettings };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          SSH Settings
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <FormControlLabel
            control={
              <Checkbox
                checked={effective?.enable ?? false}
                onChange={(e) => handleSettingChange('enable', e.target.checked)}
              />
            }
            label="Enable SSH"
          />
          <TextField
            label="Port"
            type="number"
            value={effective?.port ?? 22}
            onChange={(e) => handleSettingChange('port', Number(e.target.value))}
            sx={{ maxWidth: 200 }}
          />
          <TextField
            label="Idle Timeout (seconds)"
            type="number"
            value={effective?.idle_timeout ?? 0}
            onChange={(e) => handleSettingChange('idle_timeout', Number(e.target.value))}
            sx={{ maxWidth: 200 }}
            helperText="0 = no timeout"
          />
          <TextField
            label="Max Sessions"
            type="number"
            value={effective?.max_sessions ?? 10}
            onChange={(e) => handleSettingChange('max_sessions', Number(e.target.value))}
            sx={{ maxWidth: 200 }}
          />
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={effective?.root_login ?? false}
                  onChange={(e) => handleSettingChange('root_login', e.target.checked)}
                />
              }
              label="Root Login"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={effective?.password_auth ?? false}
                  onChange={(e) => handleSettingChange('password_auth', e.target.checked)}
                />
              }
              label="Password Authentication"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={effective?.permit_agent_forwarding ?? false}
                  onChange={(e) => handleSettingChange('permit_agent_forwarding', e.target.checked)}
                />
              }
              label="Agent Forwarding"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={effective?.permit_tunnel ?? false}
                  onChange={(e) => handleSettingChange('permit_tunnel', e.target.checked)}
                />
              }
              label="Permit Tunnel"
            />
          </Box>
          <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
            <Button
              variant="contained"
              startIcon={<SaveIcon />}
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending || Object.keys(localSettings).length === 0}
            >
              {saveMutation.isPending ? 'Saving...' : 'Save Settings'}
            </Button>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
}
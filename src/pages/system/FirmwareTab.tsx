import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Paper,
  Stack,
  Typography,
  Alert,
  LinearProgress,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import SystemUpdateIcon from '@mui/icons-material/SystemUpdate';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import {
  fetchSystemVersion,
  checkFirmwareUpdate,
  applyFirmwareUpdate,
  systemQueryKeys,
} from '@/api/modules/system';

export function FirmwareTab() {
  const queryClient = useQueryClient();
  const [updateConfirmOpen, setUpdateConfirmOpen] = useState(false);

  const versionQuery = useQuery({
    queryKey: systemQueryKeys.version,
    queryFn: fetchSystemVersion,
  });

  const updateCheckQuery = useQuery({
    queryKey: systemQueryKeys.firmwareUpdate,
    queryFn: checkFirmwareUpdate,
  });

  const applyUpdateMutation = useMutation({
    mutationFn: applyFirmwareUpdate,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: systemQueryKeys.version });
      void queryClient.invalidateQueries({ queryKey: systemQueryKeys.firmwareUpdate });
      setUpdateConfirmOpen(false);
    },
  });

  const isLoading = versionQuery.isLoading || updateCheckQuery.isLoading;
  const isError = versionQuery.isError || updateCheckQuery.isError;

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
        Failed to load firmware information. Please try again.
      </Alert>
    );
  }

  const version = versionQuery.data?.data;
  const updateStatus = updateCheckQuery.data?.data;

  return (
    <Stack spacing={3}>
      {/* Current Version Card */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Current Version
          </Typography>
          <Box sx={{ display: 'flex', gap: 4, alignItems: 'center' }}>
            <Box>
              <Typography variant="caption" color="text.secondary">
                Version
              </Typography>
              <Typography variant="h4">{version?.version ?? '-'}</Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">
                Platform
              </Typography>
              <Typography variant="body1">{version?.platform ?? '-'}</Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">
                Build Date
              </Typography>
              <Typography variant="body1">{version?.build_date ?? '-'}</Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">
                Branch
              </Typography>
              <Typography variant="body1">{version?.branch ?? '-'}</Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Update Status Card */}
      <Paper sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">Available Updates</Typography>
          <Button
            size="small"
            onClick={() => void queryClient.invalidateQueries({ queryKey: systemQueryKeys.firmwareUpdate })}
            disabled={updateCheckQuery.isFetching}
          >
            {updateCheckQuery.isFetching ? 'Checking...' : 'Check for Updates'}
          </Button>
        </Box>

        {updateStatus?.update_available ? (
          <Alert
            severity="info"
            icon={<SystemUpdateIcon fontSize="inherit" />}
            action={
              <Button
                color="inherit"
                size="small"
                variant="contained"
                onClick={() => setUpdateConfirmOpen(true)}
                disabled={applyUpdateMutation.isPending}
              >
                Install Update
              </Button>
            }
          >
            <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
              Update available: {updateStatus.new_version}
            </Typography>
            {updateStatus.release_date && (
              <Typography variant="body2">
                Released: {updateStatus.release_date}
              </Typography>
            )}
            {updateStatus.size && (
              <Typography variant="body2">
                Size: {updateStatus.size}
              </Typography>
            )}
          </Alert>
        ) : (
          <Alert severity="success" icon={<CheckCircleIcon fontSize="inherit" />}>
            Your system is up to date.
          </Alert>
        )}

        {updateStatus?.changelog && (
          <Paper variant="outlined" sx={{ mt: 2, p: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Changelog
            </Typography>
            <Typography
              variant="body2"
              component="pre"
              sx={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace', fontSize: '0.8rem' }}
            >
              {updateStatus.changelog}
            </Typography>
          </Paper>
        )}

        {applyUpdateMutation.isPending && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" sx={{ mb: 1 }}>
              Installing update... Do not power off the system.
            </Typography>
            <LinearProgress />
          </Box>
        )}

        {applyUpdateMutation.isSuccess && (
          <Alert severity="success" sx={{ mt: 2 }}>
            Update initiated successfully. The system will reboot when complete.
          </Alert>
        )}

        {applyUpdateMutation.isError && (
          <Alert severity="error" sx={{ mt: 2 }}>
            Failed to apply update. Please try again or update manually.
          </Alert>
        )}
      </Paper>

      {/* Update Confirmation Dialog */}
      <ConfirmDialog
        open={updateConfirmOpen}
        title="Install Firmware Update"
        message={`Are you sure you want to install version ${updateStatus?.new_version}? The system will reboot automatically after the update completes. This process cannot be interrupted.`}
        confirmLabel="Install Update"
        destructive
        onConfirm={() => applyUpdateMutation.mutate()}
        onCancel={() => setUpdateConfirmOpen(false)}
      />
    </Stack>
  );
}
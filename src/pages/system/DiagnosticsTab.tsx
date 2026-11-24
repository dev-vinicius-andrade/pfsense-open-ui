import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box,
  Button,
  CircularProgress,
  Divider,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  Alert,
} from '@mui/material';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import PowerSettingsNewIcon from '@mui/icons-material/PowerSettingsNew';
import { DangerousActionConfirm } from '@/components/shared/DangerousActionConfirm';
import { EmptyState } from '@/components/shared/EmptyState';
import {
  runPing,
  fetchArpTable,
  fetchConfigHistory,
  fetchHostname,
  rebootSystem,
  haltSystem,
  systemQueryKeys,
} from '@/api/modules/system';

export function DiagnosticsTab() {
  const queryClient = useQueryClient();
  const [pingHost, setPingHost] = useState('');
  const [pingOutput, setPingOutput] = useState<string | null>(null);
  const [rebootOpen, setRebootOpen] = useState(false);
  const [shutdownOpen, setShutdownOpen] = useState(false);

  const hostnameQuery = useQuery({
    queryKey: systemQueryKeys.hostname,
    queryFn: fetchHostname,
  });

  const arpQuery = useQuery({
    queryKey: systemQueryKeys.arpTable,
    queryFn: fetchArpTable,
  });

  const configHistoryQuery = useQuery({
    queryKey: systemQueryKeys.configHistory,
    queryFn: fetchConfigHistory,
  });

  const pingMutation = useMutation({
    mutationFn: (host: string) => runPing(host),
    onSuccess: (result) => {
      setPingOutput(result.data?.output ?? 'Ping completed (no output returned).');
    },
    onError: () => {
      setPingOutput('Ping failed. Check host address and try again.');
    },
  });

  const rebootMutation = useMutation({
    mutationFn: rebootSystem,
    onSuccess: () => {
      setRebootOpen(false);
    },
  });

  const shutdownMutation = useMutation({
    mutationFn: haltSystem,
    onSuccess: () => {
      setShutdownOpen(false);
    },
  });

  const confirmationWord = hostnameQuery.data?.data?.hostname ?? 'pfsense';

  return (
    <Stack spacing={3}>
      {/* Ping Tool */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Ping
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
          <TextField
            label="Host"
            value={pingHost}
            onChange={(e) => setPingHost(e.target.value)}
            placeholder="192.168.1.1 or hostname"
            size="small"
            sx={{ flex: 1 }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && pingHost.trim()) {
                pingMutation.mutate(pingHost.trim());
              }
            }}
          />
          <Button
            variant="contained"
            onClick={() => pingMutation.mutate(pingHost.trim())}
            disabled={!pingHost.trim() || pingMutation.isPending}
          >
            {pingMutation.isPending ? 'Pinging...' : 'Ping'}
          </Button>
        </Box>
        {pingOutput !== null && (
          <Paper
            variant="outlined"
            sx={{
              mt: 2,
              p: 2,
              bgcolor: 'grey.900',
              color: 'grey.100',
              fontFamily: 'monospace',
              fontSize: '0.8rem',
              whiteSpace: 'pre-wrap',
              maxHeight: 300,
              overflow: 'auto',
            }}
          >
            {pingOutput}
          </Paper>
        )}
      </Paper>

      {/* ARP Table */}
      <Paper sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">ARP Table</Typography>
          <Button
            size="small"
            onClick={() => void queryClient.invalidateQueries({ queryKey: systemQueryKeys.arpTable })}
            disabled={arpQuery.isFetching}
          >
            {arpQuery.isFetching ? 'Refreshing...' : 'Refresh'}
          </Button>
        </Box>

        {arpQuery.isLoading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress size={24} />
          </Box>
        )}

        {arpQuery.isError && (
          <Alert severity="error">Failed to load ARP table.</Alert>
        )}

        {!arpQuery.isLoading && !arpQuery.isError && (arpQuery.data?.data?.length ?? 0) === 0 && (
          <EmptyState message="No ARP entries found." />
        )}

        {!arpQuery.isLoading && !arpQuery.isError && (arpQuery.data?.data?.length ?? 0) > 0 && (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>IP Address</TableCell>
                  <TableCell>MAC Address</TableCell>
                  <TableCell>Interface</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Expires</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {arpQuery.data!.data.map((entry, idx) => (
                  <TableRow key={`${entry.ip_address}-${idx}`}>
                    <TableCell>{entry.ip_address}</TableCell>
                    <TableCell sx={{ fontFamily: 'monospace' }}>{entry.mac_address}</TableCell>
                    <TableCell>{entry.interface}</TableCell>
                    <TableCell>{entry.type}</TableCell>
                    <TableCell>{entry.expires ?? '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {/* Config History */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Configuration History
        </Typography>

        {configHistoryQuery.isLoading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress size={24} />
          </Box>
        )}

        {configHistoryQuery.isError && (
          <Alert severity="error">Failed to load configuration history.</Alert>
        )}

        {!configHistoryQuery.isLoading && !configHistoryQuery.isError && (configHistoryQuery.data?.data?.length ?? 0) === 0 && (
          <EmptyState message="No configuration revisions found." />
        )}

        {!configHistoryQuery.isLoading && !configHistoryQuery.isError && (configHistoryQuery.data?.data?.length ?? 0) > 0 && (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Revision</TableCell>
                  <TableCell>Timestamp</TableCell>
                  <TableCell>User</TableCell>
                  <TableCell>Reason</TableCell>
                  <TableCell>Description</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {configHistoryQuery.data!.data.map((rev) => (
                  <TableRow key={rev.revision_id}>
                    <TableCell>{rev.revision_id}</TableCell>
                    <TableCell>{new Date(rev.timestamp).toLocaleString()}</TableCell>
                    <TableCell>{rev.user}</TableCell>
                    <TableCell>{rev.reason || '-'}</TableCell>
                    <TableCell>{rev.description || '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {/* Dangerous Actions */}
      <Paper sx={{ p: 3, border: 1, borderColor: 'error.main' }}>
        <Typography variant="h6" color="error" gutterBottom>
          Dangerous Actions
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          These actions will disrupt all network traffic and services. Use with extreme caution.
        </Typography>
        <Divider sx={{ mb: 2 }} />
        <Stack direction="row" spacing={2}>
          <Button
            variant="outlined"
            color="error"
            startIcon={<RestartAltIcon />}
            onClick={() => setRebootOpen(true)}
          >
            Reboot System
          </Button>
          <Button
            variant="contained"
            color="error"
            startIcon={<PowerSettingsNewIcon />}
            onClick={() => setShutdownOpen(true)}
          >
            Shutdown System
          </Button>
        </Stack>
      </Paper>

      {/* Double Confirmation Dialogs */}
      <DangerousActionConfirm
        open={rebootOpen}
        title="Reboot System"
        message="This will restart the pfSense appliance. All active connections will be terminated and services will be unavailable during reboot. This action cannot be undone once confirmed."
        confirmationWord={confirmationWord}
        confirmLabel="Reboot"
        onConfirm={() => rebootMutation.mutate()}
        onCancel={() => setRebootOpen(false)}
        isPending={rebootMutation.isPending}
      />

      <DangerousActionConfirm
        open={shutdownOpen}
        title="Shutdown System"
        message="This will power off the pfSense appliance. All network services will stop immediately. Physical access will be required to power the system back on. This action cannot be undone once confirmed."
        confirmationWord={confirmationWord}
        confirmLabel="Shutdown"
        onConfirm={() => shutdownMutation.mutate()}
        onCancel={() => setShutdownOpen(false)}
        isPending={shutdownMutation.isPending}
      />
    </Stack>
  );
}
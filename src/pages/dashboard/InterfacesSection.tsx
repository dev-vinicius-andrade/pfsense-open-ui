import { useQuery } from '@tanstack/react-query';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  Skeleton,
  Typography,
} from '@mui/material';
import { StatusChip } from '@/components/shared/StatusChip';
import { fetchInterfaces } from '@/api/modules/status';
import type { InterfaceStatus } from '@/api/modules/status';

const REFRESH_INTERVAL_MS = 30_000;

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
}

function mapInterfaceStatus(status: InterfaceStatus['status']): 'online' | 'offline' | 'warning' | 'unknown' {
  if (status === 'up') return 'online';
  if (status === 'down') return 'offline';
  if (status === 'no carrier') return 'warning';
  return 'unknown';
}

export function InterfacesSection() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['interfaces'],
    queryFn: fetchInterfaces,
    refetchInterval: REFRESH_INTERVAL_MS,
  });

  if (isError) {
    return (
      <Alert severity="error" action={<Button size="small" onClick={() => void refetch()}>Retry</Button>}>
        Failed to load interface status.
      </Alert>
    );
  }

  if (isLoading) {
    return (
      <Grid container spacing={2}>
        {[1, 2, 3].map((i) => (
          <Grid size={{ xs: 12, sm: 6, md: 4 }} key={i}>
            <Card>
              <CardContent>
                <Skeleton variant="text" width="60%" />
                <Skeleton variant="text" width="40%" />
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardContent>
          <Typography color="text.secondary">No interfaces found.</Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Grid container spacing={2}>
      {data.map((iface: InterfaceStatus) => (
        <Grid size={{ xs: 12, sm: 6, md: 4 }} key={iface.id}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                  {iface.descr || iface.id}
                </Typography>
                <StatusChip status={mapInterfaceStatus(iface.status)} />
              </Box>
              <Typography variant="body2" color="text.secondary">
                {iface.ipaddr || 'No IP assigned'}
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
                <Typography variant="caption" color="text.secondary">
                  In: {formatBytes(iface.in_bytes)}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Out: {formatBytes(iface.out_bytes)}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
}
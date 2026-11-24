import { useQuery } from '@tanstack/react-query';
import {
  Alert,
  Button,
  Card,
  CardContent,
  Grid,
  Skeleton,
  Typography,
} from '@mui/material';
import { GaugeChart } from '@/components/charts/GaugeChart';
import { fetchSystemStatus } from '@/api/modules/status';

const REFRESH_INTERVAL_MS = 30_000;

function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (days > 0) return `${days}d ${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

export function SystemStatsSection() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['system-status'],
    queryFn: fetchSystemStatus,
    refetchInterval: REFRESH_INTERVAL_MS,
  });

  if (isError) {
    return (
      <Alert severity="error" action={<Button size="small" onClick={() => void refetch()}>Retry</Button>}>
        Failed to load system status.
      </Alert>
    );
  }

  if (isLoading || !data) {
    return (
      <Grid container spacing={3}>
        {[1, 2, 3].map((i) => (
          <Grid size={{ xs: 12, sm: 4 }} key={i}>
            <Card>
              <CardContent sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <Skeleton variant="circular" width={100} height={100} />
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    );
  }

  return (
    <Grid container spacing={3}>
      <Grid size={{ xs: 12, sm: 4 }}>
        <Card>
          <CardContent sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
            <GaugeChart value={data.cpu_usage} label="CPU Usage" />
          </CardContent>
        </Card>
      </Grid>
      <Grid size={{ xs: 12, sm: 4 }}>
        <Card>
          <CardContent sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
            <GaugeChart value={data.memory_usage} label="Memory Usage" />
          </CardContent>
        </Card>
      </Grid>
      <Grid size={{ xs: 12, sm: 4 }}>
        <Card>
          <CardContent sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
            <GaugeChart value={data.disk_usage} label="Disk Usage" />
          </CardContent>
        </Card>
      </Grid>
      <Grid size={{ xs: 12, sm: 6 }}>
        <Card>
          <CardContent>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Uptime
            </Typography>
            <Typography variant="h5">{formatUptime(data.uptime)}</Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid size={{ xs: 12, sm: 6 }}>
        <Card>
          <CardContent>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Load Average
            </Typography>
            <Typography variant="h5">
              {(data.load_average ?? []).map((v) => v.toFixed(2)).join(' / ') || '—'}
            </Typography>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
}
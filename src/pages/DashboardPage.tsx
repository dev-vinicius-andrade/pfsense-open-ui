import { useQuery } from '@tanstack/react-query';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  LinearProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
function CheckCircleIcon({ fontSize }: { color?: 'success'; fontSize: 'small' }) {
  const size = fontSize === 'small' ? 20 : 24;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" opacity="0.3" />
      <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ErrorIcon({ fontSize }: { color?: 'error' | 'disabled'; fontSize: 'small' }) {
  const size = fontSize === 'small' ? 20 : 24;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" opacity="0.3" />
      <path d="M15 9l-6 6M9 9l6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
import { PageHeader } from '@/components/shared/PageHeader';
import { StatusChip } from '@/components/shared/StatusChip';
import { GaugeChart } from '@/components/charts/GaugeChart';
import {
  fetchSystemStatus,
  fetchGateways,
  fetchInterfaces,
  fetchServices,
  fetchSystemVersion,
  fetchStateTableSize,
} from '@/api/modules/status';
import type { Gateway, InterfaceStatus, Service } from '@/api/modules/status';

const REFRESH_INTERVAL_MS = 30_000;

function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (days > 0) return `${days}d ${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

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

function mapServiceStatus(status: Service['status']): 'online' | 'offline' | 'unknown' {
  if (status === 'running') return 'online';
  if (status === 'stopped') return 'offline';
  return 'unknown';
}

// --- Sub-components ---

function SystemStatsSection() {
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
              {data.load_average.map((v) => v.toFixed(2)).join(' / ')}
            </Typography>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
}

function GatewaysSection() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['gateways'],
    queryFn: fetchGateways,
    refetchInterval: REFRESH_INTERVAL_MS,
  });

  if (isError) {
    return (
      <Alert severity="error" action={<Button size="small" onClick={() => void refetch()}>Retry</Button>} sx={{ mt: 3 }}>
        Failed to load gateway status.
      </Alert>
    );
  }

  return (
    <Card sx={{ mt: 3 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Gateways
        </Typography>
        {isLoading ? (
          <Skeleton variant="rectangular" height={120} />
        ) : !data || data.length === 0 ? (
          <Typography color="text.secondary">No gateways configured.</Typography>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Address</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Latency (ms)</TableCell>
                  <TableCell align="right">Loss (%)</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {data.map((gw: Gateway) => (
                  <TableRow key={gw.name}>
                    <TableCell>{gw.description || gw.name}</TableCell>
                    <TableCell>{gw.address}</TableCell>
                    <TableCell>
                      <StatusChip status={gw.status} />
                    </TableCell>
                    <TableCell align="right">{gw.latency.toFixed(1)}</TableCell>
                    <TableCell align="right">{gw.loss.toFixed(1)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </CardContent>
    </Card>
  );
}

function InterfacesSection() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['interfaces'],
    queryFn: fetchInterfaces,
    refetchInterval: REFRESH_INTERVAL_MS,
  });

  if (isError) {
    return (
      <Alert severity="error" action={<Button size="small" onClick={() => void refetch()}>Retry</Button>} sx={{ mt: 3 }}>
        Failed to load interface status.
      </Alert>
    );
  }

  if (isLoading) {
    return (
      <Grid container spacing={2} sx={{ mt: 0 }}>
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
      <Card sx={{ mt: 3 }}>
        <CardContent>
          <Typography color="text.secondary">No interfaces found.</Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Grid container spacing={2} sx={{ mt: 0 }}>
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

function ServicesSection() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['services'],
    queryFn: fetchServices,
    refetchInterval: REFRESH_INTERVAL_MS,
  });

  if (isError) {
    return (
      <Alert severity="error" action={<Button size="small" onClick={() => void refetch()}>Retry</Button>} sx={{ mt: 3 }}>
        Failed to load services.
      </Alert>
    );
  }

  return (
    <Card sx={{ mt: 3 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Services
        </Typography>
        {isLoading ? (
          <Skeleton variant="rectangular" height={120} />
        ) : !data || data.length === 0 ? (
          <Typography color="text.secondary">No services found.</Typography>
        ) : (
          <List dense disablePadding>
            {data.map((svc: Service) => (
              <ListItem key={svc.id} divider>
                <ListItemIcon sx={{ minWidth: 36 }}>
                  {svc.status === 'running' ? (
                    <CheckCircleIcon color="success" fontSize="small" />
                  ) : (
                    <ErrorIcon color={svc.status === 'stopped' ? 'error' : 'disabled'} fontSize="small" />
                  )}
                </ListItemIcon>
                <ListItemText
                  primary={svc.name}
                  secondary={svc.description}
                />
                <StatusChip status={mapServiceStatus(svc.status)} />
              </ListItem>
            ))}
          </List>
        )}
      </CardContent>
    </Card>
  );
}

function VersionAndStatesSection() {
  const versionQuery = useQuery({
    queryKey: ['system-version'],
    queryFn: fetchSystemVersion,
    staleTime: 300_000,
  });

  const stateQuery = useQuery({
    queryKey: ['state-table-size'],
    queryFn: fetchStateTableSize,
    refetchInterval: REFRESH_INTERVAL_MS,
  });

  return (
    <Grid container spacing={3} sx={{ mt: 0 }}>
      <Grid size={{ xs: 12, sm: 6 }}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              System Version
            </Typography>
            {versionQuery.isLoading ? (
              <Skeleton variant="text" width="80%" />
            ) : versionQuery.isError ? (
              <Typography color="error">Failed to load version info.</Typography>
            ) : (
              <>
                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                  pfSense CE {versionQuery.data?.version}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Platform: {versionQuery.data?.platform}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Built: {versionQuery.data?.build_date}
                </Typography>
              </>
            )}
          </CardContent>
        </Card>
      </Grid>
      <Grid size={{ xs: 12, sm: 6 }}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              State Table
            </Typography>
            {stateQuery.isLoading ? (
              <Skeleton variant="rectangular" height={40} />
            ) : stateQuery.isError ? (
              <Typography color="error">Failed to load state table info.</Typography>
            ) : (
              <>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                  <Typography variant="body2">
                    {stateQuery.data?.count.toLocaleString()} / {stateQuery.data?.max.toLocaleString()} entries
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {stateQuery.data?.usage_percent.toFixed(1)}%
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={Math.min(100, stateQuery.data?.usage_percent ?? 0)}
                  color={stateQuery.data && stateQuery.data.usage_percent >= 80 ? 'error' : 'primary'}
                  sx={{ height: 8, borderRadius: 1 }}
                />
              </>
            )}
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
}

// --- Main Page ---

export function DashboardPage() {
  return (
    <Box>
      <PageHeader title="Dashboard" />
      <SystemStatsSection />
      <Box sx={{ mt: 3 }}>
        <Typography variant="h6" gutterBottom>
          Interfaces
        </Typography>
        <InterfacesSection />
      </Box>
      <GatewaysSection />
      <VersionAndStatesSection />
      <ServicesSection />
    </Box>
  );
}
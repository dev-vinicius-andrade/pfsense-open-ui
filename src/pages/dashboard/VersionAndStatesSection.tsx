import { useQuery } from '@tanstack/react-query';
import {
  Box,
  Card,
  CardContent,
  Grid,
  LinearProgress,
  Skeleton,
  Typography,
} from '@mui/material';
import { fetchSystemVersion, fetchStateTableSize } from '@/api/modules/status';

const REFRESH_INTERVAL_MS = 30_000;

export function VersionAndStatesSection() {
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
    <Grid container spacing={3}>
      <Grid size={{ xs: 12, sm: 6 }}>
        <Card>
          <CardContent sx={{ p: 2.5 }}>
            <Typography
              variant="overline"
              sx={{ fontSize: 11, fontWeight: 600, letterSpacing: 1.2, color: 'text.secondary', mb: 1, display: 'block' }}
            >
              System Version
            </Typography>
            {versionQuery.isLoading ? (
              <Skeleton variant="text" width="80%" />
            ) : versionQuery.isError ? (
              <Typography color="error">Failed to load version info.</Typography>
            ) : (
              <>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>
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
          <CardContent sx={{ p: 2.5 }}>
            <Typography
              variant="overline"
              sx={{ fontSize: 11, fontWeight: 600, letterSpacing: 1.2, color: 'text.secondary', mb: 1, display: 'block' }}
            >
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
                    {(stateQuery.data?.count ?? 0).toLocaleString()} / {(stateQuery.data?.max ?? 0).toLocaleString()} entries
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {(stateQuery.data?.usage_percent ?? 0).toFixed(1)}%
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
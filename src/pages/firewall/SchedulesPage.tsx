import { useQuery } from '@tanstack/react-query';
import {
  Alert,
  Box,
  Button,
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
import RefreshIcon from '@mui/icons-material/Refresh';
import { PageHeader } from '@/components/shared/PageHeader';
import { EmptyState } from '@/components/shared/EmptyState';
import {
  fetchSchedules,
  firewallQueryKeys,
  type Schedule,
} from '@/api/modules/firewall';

function formatTimeRange(timerange: Schedule['timerange']): string {
  if (timerange.length === 0) return '-';
  return timerange
    .map((tr) => {
      const parts: string[] = [];
      if (tr.month) parts.push(`Month: ${tr.month}`);
      if (tr.day) parts.push(`Day: ${tr.day}`);
      if (tr.hour) parts.push(tr.hour);
      return parts.join(' ') || '-';
    })
    .join('; ');
}

function extractDays(timerange: Schedule['timerange']): string {
  if (timerange.length === 0) return '-';
  const days = new Set<string>();
  for (const tr of timerange) {
    if (tr.day) days.add(tr.day);
  }
  return days.size > 0 ? [...days].join(', ') : 'All days';
}

export function SchedulesPage() {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: firewallQueryKeys.schedules,
    queryFn: fetchSchedules,
  });

  const schedules = data?.data ?? [];

  return (
    <Box>
      <PageHeader
        title="Firewall Schedules"
        actions={
          <Button startIcon={<RefreshIcon />} onClick={() => refetch()} disabled={isLoading}>
            Refresh
          </Button>
        }
      />

      <Alert severity="info" sx={{ mb: 2 }}>
        Schedule editing requires pfSense REST API v2 schedule write endpoints. Currently read-only.
      </Alert>

      {isLoading && (
        <Paper sx={{ p: 2 }}>
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} height={48} sx={{ mb: 1 }} />
          ))}
        </Paper>
      )}

      {isError && (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography color="error" sx={{ mb: 2 }}>
            Failed to load schedules:{' '}
            {error instanceof Error ? error.message : 'Unknown error'}
          </Typography>
          <Button variant="outlined" onClick={() => refetch()}>
            Retry
          </Button>
        </Paper>
      )}

      {!isLoading && !isError && schedules.length === 0 && (
        <Paper>
          <EmptyState message="No firewall schedules configured." />
        </Paper>
      )}

      {!isLoading && !isError && schedules.length > 0 && (
        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Time Range</TableCell>
                <TableCell>Days Active</TableCell>
                <TableCell>Description</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {schedules.map((schedule) => (
                <ScheduleRow key={schedule.name} schedule={schedule} />
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
}

function ScheduleRow({ schedule }: { schedule: Schedule }) {
  return (
    <TableRow>
      <TableCell>
        <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
          {schedule.name}
        </Typography>
      </TableCell>
      <TableCell>
        <Typography variant="body2" noWrap sx={{ maxWidth: 300 }}>
          {formatTimeRange(schedule.timerange)}
        </Typography>
      </TableCell>
      <TableCell>{extractDays(schedule.timerange)}</TableCell>
      <TableCell>
        <Typography
          variant="body2"
          noWrap
          sx={{ maxWidth: 200 }}
          title={schedule.description}
        >
          {schedule.description || '-'}
        </Typography>
      </TableCell>
    </TableRow>
  );
}
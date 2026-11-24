import { useQuery } from '@tanstack/react-query';
import {
  Alert,
  Button,
  Card,
  CardContent,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { StatusChip } from '@/components/shared/StatusChip';
import { fetchGateways } from '@/api/modules/status';
import type { Gateway } from '@/api/modules/status';

const REFRESH_INTERVAL_MS = 30_000;

export function GatewaysSection() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['gateways'],
    queryFn: fetchGateways,
    refetchInterval: REFRESH_INTERVAL_MS,
  });

  if (isError) {
    return (
      <Alert severity="error" action={<Button size="small" onClick={() => void refetch()}>Retry</Button>}>
        Failed to load gateway status.
      </Alert>
    );
  }

  return (
    <Card>
      <CardContent>
        {isLoading ? (
          <Skeleton variant="rectangular" height={120} />
        ) : !data || data.length === 0 ? (
          <Typography color="text.secondary">No gateways configured.</Typography>
        ) : (
          <TableContainer sx={{ minHeight: 120 }}>
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
                  <TableRow
                    key={gw.name}
                    sx={{
                      '&:hover': {
                        bgcolor: 'action.hover',
                      },
                      transition: 'background-color 0.15s ease',
                    }}
                  >
                    <TableCell sx={{ fontWeight: 500 }}>{gw.description || gw.name}</TableCell>
                    <TableCell>{gw.address}</TableCell>
                    <TableCell>
                      <StatusChip status={gw.status} />
                    </TableCell>
                    <TableCell align="right">{gw.latency?.toFixed(1) ?? '—'}</TableCell>
                    <TableCell align="right">{gw.loss?.toFixed(1) ?? '—'}</TableCell>
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
import { useState, useRef, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  Alert,
  Button,
  IconButton,
  Chip,
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import { usePolling } from '@/hooks/usePolling';
import { GatewaySparkline } from '@/components/charts/GatewaySparkline';
import { fetchGateways } from '@/api/modules/monitoring';
import type { GatewayStatus } from '@/api/modules/monitoring';

const POLL_INTERVAL_MS = 5000;
const MAX_LATENCY_POINTS = 30;

function getStatusColor(status: GatewayStatus['status']): 'success' | 'error' | 'warning' {
  switch (status) {
    case 'online':
      return 'success';
    case 'offline':
      return 'error';
    default:
      return 'warning';
  }
}

export function GatewaysPage() {
  const [gateways, setGateways] = useState<GatewayStatus[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const latencyHistoryRef = useRef<Map<string, number[]>>(new Map());

  const pollCallback = useCallback(async () => {
    try {
      const response = await fetchGateways();
      const entries = response.data ?? [];

      for (const gw of entries) {
        const history = latencyHistoryRef.current.get(gw.name) ?? [];
        const next = [...history, gw.latency];
        if (next.length > MAX_LATENCY_POINTS) {
          latencyHistoryRef.current.set(gw.name, next.slice(next.length - MAX_LATENCY_POINTS));
        } else {
          latencyHistoryRef.current.set(gw.name, next);
        }
      }

      setGateways(entries);
      setError(null);
      setIsLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch gateway data');
      setIsLoading(false);
    }
  }, []);

  usePolling({
    callback: pollCallback,
    intervalMs: POLL_INTERVAL_MS,
    enabled: true,
  });

  const handleRefresh = () => {
    setIsLoading(true);
    void pollCallback();
  };

  if (isLoading && gateways.length === 0) {
    return (
      <Paper sx={{ p: 4, textAlign: 'center' }}>
        <Typography color="text.secondary">Loading gateway data...</Typography>
      </Paper>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Paper sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
        <IconButton onClick={handleRefresh} aria-label="Refresh gateway data" disabled={isLoading}>
          <RefreshIcon />
        </IconButton>
      </Paper>

      {error && (
        <Alert severity="error" onClose={() => setError(null)}>
          {error}
          <Button size="small" onClick={handleRefresh} sx={{ ml: 1 }}>
            Retry
          </Button>
        </Alert>
      )}

      {gateways.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography color="text.secondary">No gateways configured</Typography>
        </Paper>
      ) : (
        <Paper sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {gateways.map((gw) => (
              <Box
                key={gw.name}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                  py: 1,
                  borderBottom: 1,
                  borderColor: 'divider',
                  flexWrap: 'wrap',
                }}
              >
                <Box sx={{ minWidth: 160 }}>
                  <Typography variant="subtitle2">{gw.name}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {gw.address}
                  </Typography>
                </Box>

                <Chip
                  label={gw.status}
                  size="small"
                  color={getStatusColor(gw.status)}
                  variant="outlined"
                  sx={{ minWidth: 80 }}
                />

                <Box sx={{ minWidth: 80 }}>
                  <Typography variant="caption" color="text.secondary">
                    Loss
                  </Typography>
                  <Typography variant="body2">{gw.loss.toFixed(1)}%</Typography>
                </Box>

                <GatewaySparkline
                  data={latencyHistoryRef.current.get(gw.name) ?? []}
                  label=""
                  currentLatency={gw.latency}
                  width={160}
                  height={36}
                />

                {gw.description && (
                  <Typography variant="caption" color="text.secondary" sx={{ flex: 1 }}>
                    {gw.description}
                  </Typography>
                )}
              </Box>
            ))}
          </Box>
        </Paper>
      )}
    </Box>
  );
}
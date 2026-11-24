import { useState, useRef, useCallback } from 'react';
import {
  Box,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  IconButton,
  Typography,
  Paper,
  Alert,
  Button,
} from '@mui/material';
import PauseIcon from '@mui/icons-material/Pause';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import RefreshIcon from '@mui/icons-material/Refresh';
import { usePolling } from '@/hooks/usePolling';
import { TrafficLineChart } from '@/components/charts/TrafficLineChart';
import type { TrafficDataPoint } from '@/components/charts/TrafficLineChart';
import { fetchInterfaceCounters } from '@/api/modules/monitoring';

const MAX_DATA_POINTS = 60;
const POLL_INTERVAL_MS = 3000;

interface PreviousCounters {
  inBytes: number;
  outBytes: number;
  timestamp: number;
}

export function TrafficGraphsPage() {
  const [selectedInterface, setSelectedInterface] = useState<string>('');
  const [dataPoints, setDataPoints] = useState<TrafficDataPoint[]>([]);
  const [interfaces, setInterfaces] = useState<string[]>([]);
  const [isPaused, setIsPaused] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const previousCountersRef = useRef<Map<string, PreviousCounters>>(new Map());

  const pollCallback = useCallback(async () => {
    try {
      const response = await fetchInterfaceCounters();
      const counters = response.data;
      const interfaceNames = Object.keys(counters);

      setInterfaces((prev) => {
        if (prev.length !== interfaceNames.length || prev.some((n) => !interfaceNames.includes(n))) {
          return interfaceNames;
        }
        return prev;
      });

      if (interfaceNames.length > 0 && !selectedInterface) {
        setSelectedInterface(interfaceNames[0]);
      }

      const targetIface = selectedInterface || interfaceNames[0];
      if (!targetIface || !counters[targetIface]) {
        setIsLoading(false);
        return;
      }

      const current = counters[targetIface];
      const now = Date.now();
      const prev = previousCountersRef.current.get(targetIface);

      if (prev) {
        const elapsedSec = (now - prev.timestamp) / 1000;
        if (elapsedSec > 0) {
          const inBps = Math.max(0, (current['in-bytes'] - prev.inBytes) / elapsedSec);
          const outBps = Math.max(0, (current['out-bytes'] - prev.outBytes) / elapsedSec);

          setDataPoints((prevPoints) => {
            const next = [...prevPoints, { timestamp: now, inBytesPerSec: inBps, outBytesPerSec: outBps }];
            if (next.length > MAX_DATA_POINTS) {
              return next.slice(next.length - MAX_DATA_POINTS);
            }
            return next;
          });
        }
      }

      previousCountersRef.current.set(targetIface, {
        inBytes: current['in-bytes'],
        outBytes: current['out-bytes'],
        timestamp: now,
      });

      setError(null);
      setIsLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch interface data');
      setIsLoading(false);
    }
  }, [selectedInterface]);

  usePolling({
    callback: pollCallback,
    intervalMs: POLL_INTERVAL_MS,
    enabled: !isPaused,
  });

  const handleInterfaceChange = (iface: string) => {
    setSelectedInterface(iface);
    setDataPoints([]);
    previousCountersRef.current.delete(iface);
  };

  const handleReset = () => {
    setDataPoints([]);
    previousCountersRef.current.clear();
    setIsLoading(true);
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Paper sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel id="interface-select-label">Interface</InputLabel>
          <Select
            labelId="interface-select-label"
            value={selectedInterface}
            label="Interface"
            onChange={(e) => handleInterfaceChange(e.target.value)}
          >
            {interfaces.map((iface) => (
              <MenuItem key={iface} value={iface}>
                {iface}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <IconButton
          onClick={() => setIsPaused((p) => !p)}
          aria-label={isPaused ? 'Resume polling' : 'Pause polling'}
          color={isPaused ? 'warning' : 'default'}
        >
          {isPaused ? <PlayArrowIcon /> : <PauseIcon />}
        </IconButton>

        <IconButton onClick={handleReset} aria-label="Reset graph data">
          <RefreshIcon />
        </IconButton>

        {isPaused && (
          <Typography variant="caption" color="warning.main">
            Polling paused
          </Typography>
        )}
      </Paper>

      {error && (
        <Alert severity="error" onClose={() => setError(null)}>
          {error}
          <Button size="small" onClick={handleReset} sx={{ ml: 1 }}>
            Retry
          </Button>
        </Alert>
      )}

      <Paper sx={{ p: 2 }}>
        <TrafficLineChart data={dataPoints} isLoading={isLoading} />
      </Paper>
    </Box>
  );
}
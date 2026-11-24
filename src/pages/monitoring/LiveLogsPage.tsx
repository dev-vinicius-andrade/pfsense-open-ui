import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Box,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  IconButton,
  Typography,
  Paper,
  Alert,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
} from '@mui/material';
import PauseIcon from '@mui/icons-material/Pause';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import VerticalAlignBottomIcon from '@mui/icons-material/VerticalAlignBottom';
import { usePolling } from '@/hooks/usePolling';
import { fetchLogs } from '@/api/modules/monitoring';
import type { LogEntry, LogSource, LogSeverity } from '@/api/modules/monitoring';

const MAX_LOG_ENTRIES = 500;
const POLL_INTERVAL_MS = 3000;

const LOG_SOURCES: { value: LogSource; label: string }[] = [
  { value: 'firewall', label: 'Firewall' },
  { value: 'system', label: 'System' },
  { value: 'openvpn', label: 'OpenVPN' },
  { value: 'dhcp', label: 'DHCP' },
  { value: 'auth', label: 'Auth' },
];

const SEVERITIES: { value: LogSeverity | ''; label: string }[] = [
  { value: '', label: 'All Severities' },
  { value: 'error', label: 'Error' },
  { value: 'warning', label: 'Warning' },
  { value: 'info', label: 'Info' },
  { value: 'debug', label: 'Debug' },
];

function getSeverityColor(severity: LogSeverity): 'error' | 'warning' | 'info' | 'default' {
  switch (severity) {
    case 'error': return 'error';
    case 'warning': return 'warning';
    case 'info': return 'info';
    default: return 'default';
  }
}

export function LiveLogsPage() {
  const [source, setSource] = useState<LogSource>('firewall');
  const [severityFilter, setSeverityFilter] = useState<LogSeverity | ''>('');
  const [searchText, setSearchText] = useState('');
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isPaused, setIsPaused] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const tableEndRef = useRef<HTMLDivElement>(null);

  const pollCallback = useCallback(async () => {
    try {
      const params: Record<string, string | number> = { limit: 100 };
      if (severityFilter) params.severity = severityFilter;
      if (searchText) params.search = searchText;

      const response = await fetchLogs(source, params);
      const entries = response.data ?? [];

      setLogs((prev) => {
        const merged = [...prev, ...entries];
        if (merged.length > MAX_LOG_ENTRIES) {
          return merged.slice(merged.length - MAX_LOG_ENTRIES);
        }
        return merged;
      });

      setError(null);
      setIsLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch logs');
      setIsLoading(false);
    }
  }, [source, severityFilter, searchText]);

  usePolling({
    callback: pollCallback,
    intervalMs: POLL_INTERVAL_MS,
    enabled: !isPaused,
  });

  useEffect(() => {
    if (autoScroll && tableEndRef.current) {
      tableEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, autoScroll]);

  const handleSourceChange = (newSource: LogSource) => {
    setSource(newSource);
    setLogs([]);
    setIsLoading(true);
  };

  const filteredLogs = logs.filter((log) => {
    if (severityFilter && log.severity !== severityFilter) return false;
    if (searchText && !log.message.toLowerCase().includes(searchText.toLowerCase())) return false;
    return true;
  });

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Paper sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
        <FormControl size="small" sx={{ minWidth: 140 }}>
          <InputLabel id="log-source-label">Source</InputLabel>
          <Select
            labelId="log-source-label"
            value={source}
            label="Source"
            onChange={(e) => handleSourceChange(e.target.value as LogSource)}
          >
            {LOG_SOURCES.map((s) => (
              <MenuItem key={s.value} value={s.value}>{s.label}</MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 140 }}>
          <InputLabel id="severity-filter-label">Severity</InputLabel>
          <Select
            labelId="severity-filter-label"
            value={severityFilter}
            label="Severity"
            onChange={(e) => setSeverityFilter(e.target.value as LogSeverity | '')}
          >
            {SEVERITIES.map((s) => (
              <MenuItem key={s.value} value={s.value}>{s.label}</MenuItem>
            ))}
          </Select>
        </FormControl>

        <TextField
          size="small"
          placeholder="Search logs..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          sx={{ minWidth: 200 }}
        />

        <Box sx={{ flex: 1 }} />

        <IconButton
          onClick={() => setIsPaused((p) => !p)}
          aria-label={isPaused ? 'Resume polling' : 'Pause polling'}
          color={isPaused ? 'warning' : 'default'}
        >
          {isPaused ? <PlayArrowIcon /> : <PauseIcon />}
        </IconButton>

        <IconButton
          onClick={() => setAutoScroll((a) => !a)}
          aria-label={autoScroll ? 'Disable auto-scroll' : 'Enable auto-scroll'}
          color={autoScroll ? 'primary' : 'default'}
        >
          <VerticalAlignBottomIcon />
        </IconButton>
      </Paper>

      {error && (
        <Alert severity="error" onClose={() => setError(null)}>
          {error}
          <Button size="small" onClick={() => { setLogs([]); setIsLoading(true); }} sx={{ ml: 1 }}>
            Retry
          </Button>
        </Alert>
      )}

      <TableContainer component={Paper} sx={{ maxHeight: 600 }}>
        <Table stickyHeader size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ width: 180 }}>Timestamp</TableCell>
              <TableCell sx={{ width: 100 }}>Severity</TableCell>
              <TableCell sx={{ width: 120 }}>Source</TableCell>
              <TableCell>Message</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading && logs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} align="center">
                  <Typography color="text.secondary" sx={{ py: 4 }}>
                    Loading logs...
                  </Typography>
                </TableCell>
              </TableRow>
            ) : filteredLogs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} align="center">
                  <Typography color="text.secondary" sx={{ py: 4 }}>
                    No log entries found
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              filteredLogs.map((log, index) => (
                <TableRow key={`${log.timestamp}-${index}`}>
                  <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.75rem', whiteSpace: 'nowrap' }}>
                    {new Date(log.timestamp).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={log.severity}
                      size="small"
                      color={getSeverityColor(log.severity)}
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>{log.source}</TableCell>
                  <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.8rem', wordBreak: 'break-all' }}>
                    {log.message}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        <div ref={tableEndRef} />
      </TableContainer>

      <Typography variant="caption" color="text.secondary">
        Showing {filteredLogs.length} of {logs.length} entries
      </Typography>
    </Box>
  );
}
import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
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
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Collapse,
  Menu,
  Divider,
} from '@mui/material';
import PauseIcon from '@mui/icons-material/Pause';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import VerticalAlignBottomIcon from '@mui/icons-material/VerticalAlignBottom';
import SearchIcon from '@mui/icons-material/Search';
import DownloadIcon from '@mui/icons-material/Download';
import SaveIcon from '@mui/icons-material/Save';
import DeleteIcon from '@mui/icons-material/Delete';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import FilterListIcon from '@mui/icons-material/FilterList';
import { usePolling } from '@/hooks/usePolling';
import { fetchLogs } from '@/api/modules/monitoring';
import type { LogEntry, LogSource, LogSeverity } from '@/api/modules/monitoring';
import { useLogFilters } from './useLogFilters';
import type { LogFilterState } from './useLogFilters';
import { exportLogsAsCsv, exportLogsAsJson } from './logExport';

const MAX_LOG_ENTRIES = 1000;
const POLL_INTERVAL_MS = 3000;

const LOG_SOURCES: { value: LogSource; label: string }[] = [
  { value: 'firewall', label: 'Firewall' },
  { value: 'system', label: 'System' },
  { value: 'openvpn', label: 'OpenVPN' },
  { value: 'dhcp', label: 'DHCP' },
  { value: 'auth', label: 'Auth' },
];

const SEVERITY_OPTIONS: { value: LogSeverity; label: string; color: string }[] = [
  { value: 'error', label: 'Error', color: '#D32F2F' },
  { value: 'warning', label: 'Warning', color: '#FFA000' },
  { value: 'info', label: 'Info', color: '#0288D1' },
  { value: 'debug', label: 'Debug', color: '#78909C' },
];

const TIME_RANGES: { value: LogFilterState['timeRange']; label: string }[] = [
  { value: '5m', label: '5m' },
  { value: '15m', label: '15m' },
  { value: '1h', label: '1h' },
  { value: '6h', label: '6h' },
  { value: '24h', label: '24h' },
];

const ACTION_OPTIONS: { value: 'pass' | 'block' | 'reject'; label: string }[] = [
  { value: 'pass', label: 'Pass' },
  { value: 'block', label: 'Block' },
  { value: 'reject', label: 'Reject' },
];

function getSeverityBorderColor(severity: LogSeverity): string {
  switch (severity) {
    case 'error': return '#D32F2F';
    case 'warning': return '#FFA000';
    case 'info': return '#0288D1';
    default: return '#78909C';
  }
}

function getSeverityChipColor(severity: LogSeverity): 'error' | 'warning' | 'info' | 'default' {
  switch (severity) {
    case 'error': return 'error';
    case 'warning': return 'warning';
    case 'info': return 'info';
    default: return 'default';
  }
}

function getActionChipColor(action: string): 'success' | 'error' | 'warning' | 'default' {
  switch (action.toLowerCase()) {
    case 'pass': return 'success';
    case 'block': return 'error';
    case 'reject': return 'warning';
    default: return 'default';
  }
}

function matchesTimeRange(timestamp: string, timeRange: LogFilterState['timeRange'], customStart: string, customEnd: string): boolean {
  if (timeRange === 'custom') {
    if (!customStart && !customEnd) return true;
    const ts = new Date(timestamp).getTime();
    if (customStart && ts < new Date(customStart).getTime()) return false;
    if (customEnd && ts > new Date(customEnd).getTime()) return false;
    return true;
  }
  const minutesMap: Record<string, number> = { '5m': 5, '15m': 15, '1h': 60, '6h': 360, '24h': 1440 };
  const minutes = minutesMap[timeRange];
  if (!minutes) return true;
  const cutoff = Date.now() - minutes * 60 * 1000;
  return new Date(timestamp).getTime() >= cutoff;
}

function applyClientFilters(logs: LogEntry[], filters: LogFilterState, debouncedSearch: string): LogEntry[] {
  return logs.filter((log) => {
    if (filters.severities.length > 0 && !filters.severities.includes(log.severity)) return false;
    if (!matchesTimeRange(log.timestamp, filters.timeRange, filters.customStart, filters.customEnd)) return false;
    if (debouncedSearch) {
      const needle = debouncedSearch.toLowerCase();
      const haystack = `${log.timestamp} ${log.severity} ${log.source} ${log.message} ${log.raw ?? ''}`.toLowerCase();
      if (!haystack.includes(needle)) return false;
    }
    if (filters.sourceIp && !log.message.includes(filters.sourceIp)) return false;
    if (filters.destIp && !log.message.includes(filters.destIp)) return false;
    if (filters.port && !log.message.includes(filters.port)) return false;
    if (filters.action.length > 0) {
      const msgLower = log.message.toLowerCase();
      const matched = filters.action.some((a) => msgLower.includes(a));
      if (!matched) return false;
    }
    return true;
  });
}

export function LiveLogsPage() {
  const {
    filters,
    debouncedSearchText,
    setFilter,
    setSearchText,
    resetFilters,
    savePreset,
    loadPreset,
    presets,
    deletePreset,
  } = useLogFilters();

  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isPaused, setIsPaused] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);
  const [presetMenuAnchor, setPresetMenuAnchor] = useState<null | HTMLElement>(null);
  const [presetNameInput, setPresetNameInput] = useState('');
  const [exportMenuAnchor, setExportMenuAnchor] = useState<null | HTMLElement>(null);

  const tableEndRef = useRef<HTMLDivElement>(null);

  const pollCallback = useCallback(async () => {
    try {
      const params: Record<string, string | number> = { limit: 200 };
      const response = await fetchLogs(filters.source, params);
      const entries = response.data ?? [];

      setLogs((prev) => {
        const seen = new Set(prev.map((l) => `${l.timestamp}-${l.message}`));
        const newEntries = entries.filter((e) => !seen.has(`${e.timestamp}-${e.message}`));
        if (newEntries.length === 0) return prev;
        const merged = [...prev, ...newEntries];
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
  }, [filters.source]);

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
    setFilter('source', newSource);
    setLogs([]);
    setIsLoading(true);
  };

  const filteredLogs = useMemo(
    () => applyClientFilters(logs, filters, debouncedSearchText),
    [logs, filters, debouncedSearchText],
  );

  const handleToggleSeverity = (severity: LogSeverity) => {
    setFilter('severities', filters.severities.includes(severity)
      ? filters.severities.filter((s) => s !== severity)
      : [...filters.severities, severity]);
  };

  const handleSavePreset = () => {
    if (savePreset(presetNameInput)) {
      setPresetNameInput('');
      setPresetMenuAnchor(null);
    }
  };

  const handleLoadPreset = (name: string) => {
    loadPreset(name);
    setPresetMenuAnchor(null);
  };

  const handleExportCsv = () => {
    exportLogsAsCsv(filteredLogs, `pfsense-logs-${filters.source}-${Date.now()}`);
    setExportMenuAnchor(null);
  };

  const handleExportJson = () => {
    exportLogsAsJson(filteredLogs, `pfsense-logs-${filters.source}-${Date.now()}`);
    setExportMenuAnchor(null);
  };

  const toggleRowExpansion = (rowId: string) => {
    setExpandedRowId((prev) => (prev === rowId ? null : rowId));
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {/* Filter Bar */}
      <Paper sx={{ p: 2, display: 'flex', flexWrap: 'wrap', gap: 1.5, alignItems: 'center' }}>
        {/* Source Selector */}
        <FormControl size="small" sx={{ minWidth: 130 }}>
          <InputLabel id="log-source-label">Source</InputLabel>
          <Select
            labelId="log-source-label"
            value={filters.source}
            label="Source"
            onChange={(e) => handleSourceChange(e.target.value as LogSource)}
          >
            {LOG_SOURCES.map((s) => (
              <MenuItem key={s.value} value={s.value}>{s.label}</MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Severity Toggles */}
        <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
          {SEVERITY_OPTIONS.map((opt) => (
            <Chip
              key={opt.value}
              label={opt.label}
              size="small"
              clickable
              onClick={() => handleToggleSeverity(opt.value)}
              sx={{
                borderColor: opt.color,
                borderWidth: 1,
                borderStyle: 'solid',
                backgroundColor: filters.severities.includes(opt.value) ? opt.color : 'transparent',
                color: filters.severities.includes(opt.value) ? '#fff' : opt.color,
                '&:hover': { backgroundColor: filters.severities.includes(opt.value) ? opt.color : `${opt.color}20` },
              }}
              aria-pressed={filters.severities.includes(opt.value)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleToggleSeverity(opt.value); } }}
            />
          ))}
        </Box>

        {/* Text Search */}
        <TextField
          size="small"
          placeholder="Search logs..."
          value={filters.searchText}
          onChange={(e) => setSearchText(e.target.value)}
          slotProps={{ input: { startAdornment: <SearchIcon sx={{ mr: 0.5, color: 'text.secondary' }} fontSize="small" /> } }}
          sx={{ minWidth: 180 }}
          aria-label="Search log entries"
        />

        {/* Time Range */}
        <ToggleButtonGroup
          size="small"
          value={filters.timeRange}
          exclusive
          onChange={(_, val) => { if (val) setFilter('timeRange', val); }}
          aria-label="Time range"
        >
          {TIME_RANGES.map((tr) => (
            <ToggleButton key={tr.value} value={tr.value}>{tr.label}</ToggleButton>
          ))}
        </ToggleButtonGroup>

        {/* Custom Date Range (only when custom selected) */}
        {filters.timeRange === 'custom' && (
          <>
            <TextField
              size="small"
              type="datetime-local"
              label="From"
              value={filters.customStart}
              onChange={(e) => setFilter('customStart', e.target.value)}
              slotProps={{ inputLabel: { shrink: true } }}
              sx={{ minWidth: 170 }}
              aria-label="Custom start time"
            />
            <TextField
              size="small"
              type="datetime-local"
              label="To"
              value={filters.customEnd}
              onChange={(e) => setFilter('customEnd', e.target.value)}
              slotProps={{ inputLabel: { shrink: true } }}
              sx={{ minWidth: 170 }}
              aria-label="Custom end time"
            />
          </>
        )}

        {/* Action Filter (firewall only) */}
        {filters.source === 'firewall' && (
          <ToggleButtonGroup
            size="small"
            value={filters.action}
            onChange={(_, val) => { if (val) setFilter('action', val as ('pass' | 'block' | 'reject')[]); }}
            aria-label="Firewall action filter"
          >
            {ACTION_OPTIONS.map((a) => (
              <ToggleButton key={a.value} value={a.value}>{a.label}</ToggleButton>
            ))}
          </ToggleButtonGroup>
        )}

        {/* Source/Dest IP */}
        <TextField
          size="small"
          placeholder="Source IP/CIDR"
          value={filters.sourceIp}
          onChange={(e) => setFilter('sourceIp', e.target.value)}
          sx={{ minWidth: 130 }}
          aria-label="Filter by source IP"
        />
        <TextField
          size="small"
          placeholder="Dest IP/CIDR"
          value={filters.destIp}
          onChange={(e) => setFilter('destIp', e.target.value)}
          sx={{ minWidth: 130 }}
          aria-label="Filter by destination IP"
        />
        <TextField
          size="small"
          placeholder="Port"
          value={filters.port}
          onChange={(e) => setFilter('port', e.target.value)}
          sx={{ minWidth: 90 }}
          aria-label="Filter by port"
        />

        {/* Spacer */}
        <Box sx={{ flex: 1 }} />

        {/* Presets */}
        <Button
          size="small"
          variant="outlined"
          startIcon={<FilterListIcon />}
          onClick={(e) => setPresetMenuAnchor(e.currentTarget)}
          aria-haspopup="true"
          aria-expanded={Boolean(presetMenuAnchor)}
        >
          Presets
        </Button>
        <Menu
          anchorEl={presetMenuAnchor}
          open={Boolean(presetMenuAnchor)}
          onClose={() => setPresetMenuAnchor(null)}
          slotProps={{ paper: { sx: { minWidth: 260 } } }}
        >
          {presets.length === 0 && (
            <MenuItem disabled>No saved presets</MenuItem>
          )}
          {presets.map((p) => (
            <MenuItem key={p.name} sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Box
                sx={{ flex: 1, cursor: 'pointer' }}
                onClick={() => handleLoadPreset(p.name)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter') handleLoadPreset(p.name); }}
              >
                {p.name}
              </Box>
              <IconButton
                size="small"
                onClick={(e) => { e.stopPropagation(); deletePreset(p.name); }}
                aria-label={`Delete preset ${p.name}`}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </MenuItem>
          ))}
          {presets.length > 0 && <Divider />}
          <Box sx={{ p: 1, display: 'flex', gap: 1, alignItems: 'center' }}>
            <TextField
              size="small"
              placeholder="Preset name"
              value={presetNameInput}
              onChange={(e) => setPresetNameInput(e.target.value)}
              sx={{ flex: 1 }}
              aria-label="New preset name"
              onKeyDown={(e) => { if (e.key === 'Enter') handleSavePreset(); }}
            />
            <IconButton
              size="small"
              color="primary"
              onClick={handleSavePreset}
              disabled={!presetNameInput.trim()}
              aria-label="Save current filters as preset"
            >
              <SaveIcon fontSize="small" />
            </IconButton>
          </Box>
        </Menu>

        {/* Reset */}
        <Button size="small" variant="text" onClick={resetFilters}>Reset</Button>

        {/* Export */}
        <Button
          size="small"
          variant="outlined"
          startIcon={<DownloadIcon />}
          onClick={(e) => setExportMenuAnchor(e.currentTarget)}
          aria-haspopup="true"
          aria-expanded={Boolean(exportMenuAnchor)}
        >
          Export
        </Button>
        <Menu
          anchorEl={exportMenuAnchor}
          open={Boolean(exportMenuAnchor)}
          onClose={() => setExportMenuAnchor(null)}
        >
          <MenuItem onClick={handleExportCsv}>CSV</MenuItem>
          <MenuItem onClick={handleExportJson}>JSON</MenuItem>
        </Menu>

        {/* Pause/Resume */}
        <Tooltip title={isPaused ? 'Resume polling' : 'Pause polling'}>
          <IconButton
            onClick={() => setIsPaused((p) => !p)}
            aria-label={isPaused ? 'Resume polling' : 'Pause polling'}
            color={isPaused ? 'warning' : 'default'}
          >
            {isPaused ? <PlayArrowIcon /> : <PauseIcon />}
          </IconButton>
        </Tooltip>

        {/* Auto-scroll toggle */}
        <Tooltip title={autoScroll ? 'Disable auto-scroll' : 'Enable auto-scroll'}>
          <IconButton
            onClick={() => setAutoScroll((a) => !a)}
            aria-label={autoScroll ? 'Disable auto-scroll' : 'Enable auto-scroll'}
            color={autoScroll ? 'primary' : 'default'}
          >
            <VerticalAlignBottomIcon />
          </IconButton>
        </Tooltip>
      </Paper>

      {/* Error Banner */}
      {error && (
        <Alert severity="error" onClose={() => setError(null)}>
          {error}
          <Button size="small" onClick={() => { setLogs([]); setIsLoading(true); }} sx={{ ml: 1 }}>
            Retry
          </Button>
        </Alert>
      )}

      {/* Log Table */}
      <TableContainer component={Paper} sx={{ maxHeight: 650, overflowY: 'auto' }}>
        <Table stickyHeader size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ width: 40 }} />
              <TableCell sx={{ width: 170 }}>Timestamp</TableCell>
              <TableCell sx={{ width: 90 }}>Severity</TableCell>
              <TableCell sx={{ width: 140 }}>Source</TableCell>
              <TableCell sx={{ width: 100 }}>Action</TableCell>
              <TableCell>Message</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading && logs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  <Typography color="text.secondary" sx={{ py: 4 }}>
                    Loading logs...
                  </Typography>
                </TableCell>
              </TableRow>
            ) : filteredLogs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  <Typography color="text.secondary" sx={{ py: 4 }}>
                    No log entries match current filters
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              filteredLogs.map((log, index) => {
                const rowId = `${log.timestamp}-${index}`;
                const isExpanded = expandedRowId === rowId;
                return (
                  <LogRow
                    key={rowId}
                    log={log}
                    isExpanded={isExpanded}
                    onToggle={() => toggleRowExpansion(rowId)}
                  />
                );
              })
            )}
          </TableBody>
        </Table>
        <div ref={tableEndRef} />
      </TableContainer>

      {/* Row Count */}
      <Typography variant="caption" color="text.secondary">
        Showing {filteredLogs.length} of {logs.length} entries
        {isPaused && ' (paused)'}
      </Typography>
    </Box>
  );
}

interface LogRowProps {
  log: LogEntry;
  isExpanded: boolean;
  onToggle: () => void;
}

function LogRow({ log, isExpanded, onToggle }: LogRowProps) {
  const borderColor = getSeverityBorderColor(log.severity);
  const actionMatch = log.message.match(/\b(pass|block|reject)\b/i);
  const actionLabel = actionMatch ? actionMatch[1].toLowerCase() : undefined;

  return (
    <>
      <TableRow
        hover
        onClick={onToggle}
        sx={{
          cursor: 'pointer',
          borderLeft: `4px solid ${borderColor}`,
          '& td': { borderBottom: isExpanded ? 0 : undefined },
        }}
        aria-expanded={isExpanded}
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onToggle(); } }}
      >
        <TableCell sx={{ width: 40, px: 1 }}>
          {isExpanded ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
        </TableCell>
        <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.75rem', whiteSpace: 'nowrap' }}>
          <Tooltip title={new Date(log.timestamp).toLocaleString()} placement="top">
            <span>{formatRelativeTime(log.timestamp)}</span>
          </Tooltip>
        </TableCell>
        <TableCell>
          <Chip
            label={log.severity}
            size="small"
            color={getSeverityChipColor(log.severity)}
            variant="outlined"
          />
        </TableCell>
        <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{log.source}</TableCell>
        <TableCell>
          {actionLabel && (
            <Chip
              label={actionLabel}
              size="small"
              color={getActionChipColor(actionLabel)}
              variant="outlined"
            />
          )}
        </TableCell>
        <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.8rem', wordBreak: 'break-all' }}>
          {log.message}
        </TableCell>
      </TableRow>
      <TableRow>
        <TableCell colSpan={6} sx={{ py: 0, borderBottom: isExpanded ? undefined : 0 }}>
          <Collapse in={isExpanded} timeout="auto" unmountOnExit>
            <Box sx={{ p: 2, bgcolor: 'action.hover', fontFamily: 'monospace', fontSize: '0.75rem', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
              {log.raw ?? log.message}
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  );
}

function formatRelativeTime(timestamp: string): string {
  const diff = Date.now() - new Date(timestamp).getTime();
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return new Date(timestamp).toLocaleDateString();
}
import { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { Box, Typography, useTheme } from '@mui/material';

export interface TrafficDataPoint {
  timestamp: number;
  inBytesPerSec: number;
  outBytesPerSec: number;
}

interface TrafficLineChartProps {
  data: TrafficDataPoint[];
  height?: number;
  isLoading?: boolean;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B/s';
  const units = ['B/s', 'KB/s', 'MB/s', 'GB/s'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const idx = Math.min(i, units.length - 1);
  return `${(bytes / Math.pow(1024, idx)).toFixed(1)} ${units[idx]}`;
}

function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString(undefined, {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

export function TrafficLineChart({
  data,
  height = 350,
  isLoading = false,
}: TrafficLineChartProps) {
  const theme = useTheme();

  const chartData = useMemo(
    () =>
      data.map((d) => ({
        time: d.timestamp,
        inbound: d.inBytesPerSec,
        outbound: d.outBytesPerSec,
      })),
    [data],
  );

  if (isLoading && data.length === 0) {
    return (
      <Box
        sx={{
          height,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Typography color="text.secondary">Collecting traffic data...</Typography>
      </Box>
    );
  }

  if (data.length === 0) {
    return (
      <Box
        sx={{
          height,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Typography color="text.secondary">No traffic data available</Typography>
      </Box>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={chartData} margin={{ top: 8, right: 16, left: 8, bottom: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
        <XAxis
          dataKey="time"
          type="number"
          domain={['auto', 'auto']}
          tickFormatter={formatTime}
          stroke={theme.palette.text.secondary}
          fontSize={12}
          minTickGap={40}
        />
        <YAxis
          tickFormatter={formatBytes}
          stroke={theme.palette.text.secondary}
          fontSize={12}
          width={80}
        />
        <Tooltip
          labelFormatter={(label) => formatTime(Number(label))}
          formatter={(value, name) => [
            formatBytes(Number(value)),
            String(name) === 'inbound' ? 'Inbound' : 'Outbound',
          ]}
          contentStyle={{
            backgroundColor: theme.palette.background.paper,
            border: `1px solid ${theme.palette.divider}`,
            borderRadius: 4,
          }}
        />
        <Legend verticalAlign="top" height={36} />
        <Line
          type="monotone"
          dataKey="inbound"
          name="Inbound"
          stroke={theme.palette.primary.main}
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4 }}
          animationDuration={0}
        />
        <Line
          type="monotone"
          dataKey="outbound"
          name="Outbound"
          stroke={theme.palette.secondary.main}
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4 }}
          animationDuration={0}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
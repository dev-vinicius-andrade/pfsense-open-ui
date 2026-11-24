import { useMemo } from 'react';
import {
  LineChart,
  Line,
  ResponsiveContainer,
  YAxis,
} from 'recharts';
import { Box, Typography } from '@mui/material';

export interface GatewaySparklineProps {
  data: number[];
  label: string;
  currentLatency: number;
  height?: number;
  width?: number | string;
}

function getLatencyColor(latency: number): string {
  if (latency < 50) return '#2E7D32';
  if (latency <= 200) return '#FFA000';
  return '#D32F2F';
}

export function GatewaySparkline({
  data,
  label,
  currentLatency,
  height = 40,
  width = 120,
}: GatewaySparklineProps) {
  const chartData = useMemo(
    () => data.map((value, index) => ({ index, value })),
    [data],
  );

  const color = getLatencyColor(currentLatency);

  if (data.length === 0) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Typography variant="body2" color="text.secondary">
          {label}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          No data
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
      <Typography variant="body2" sx={{ minWidth: 80 }}>
        {label}
      </Typography>
      <Box sx={{ width, height }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <YAxis domain={['auto', 'auto']} hide />
            <Line
              type="monotone"
              dataKey="value"
              stroke={color}
              strokeWidth={2}
              dot={false}
              animationDuration={0}
            />
          </LineChart>
        </ResponsiveContainer>
      </Box>
      <Typography
        variant="body2"
        sx={{ fontWeight: 600, color, minWidth: 50, textAlign: 'right' }}
      >
        {currentLatency.toFixed(1)}ms
      </Typography>
    </Box>
  );
}
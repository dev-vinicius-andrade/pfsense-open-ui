import { Box, Typography, useTheme } from '@mui/material';
import {
  ResponsiveContainer,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Area,
  ComposedChart,
} from 'recharts';

interface LineChartDataPoint {
  timestamp: number;
  value: number;
}

interface LineChartDisplayProps {
  data: LineChartDataPoint[];
  label: string;
  height?: number;
  accentColor?: string;
}

function formatTimestamp(ts: number): string {
  const date = new Date(ts);
  return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
}

export function LineChartDisplay({
  data,
  label,
  height = 150,
  accentColor,
}: LineChartDisplayProps) {
  const theme = useTheme();
  const strokeColor = accentColor ?? theme.palette.primary.main;

  if (!data || data.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography variant="body2" color="text.secondary">
          No data
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%' }} role="img" aria-label={`Line chart: ${label}`}>
      <ResponsiveContainer width="100%" height={height}>
        <ComposedChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
          <defs>
            <linearGradient id={`lineGradient-${label}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={strokeColor} stopOpacity={0.3} />
              <stop offset="100%" stopColor={strokeColor} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} vertical={false} />
          <XAxis
            dataKey="timestamp"
            tickFormatter={formatTimestamp}
            tick={{ fontSize: 11, fill: theme.palette.text.secondary }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: theme.palette.text.secondary }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: theme.palette.background.paper,
              border: `1px solid ${theme.palette.divider}`,
              borderRadius: 4,
              fontSize: 12,
            }}
            labelFormatter={(val) => {
              if (typeof val === 'number') return new Date(val).toLocaleTimeString();
              return String(val);
            }}
            formatter={(val) => {
              if (typeof val === 'number') return [new Intl.NumberFormat().format(val), label];
              return [String(val), label];
            }}
          />
          <Area
            type="monotone"
            dataKey="value"
            fill={`url(#lineGradient-${label})`}
            stroke="none"
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke={strokeColor}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, strokeWidth: 0 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </Box>
  );
}
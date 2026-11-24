import { Box, Typography, useTheme } from '@mui/material';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';

interface BarChartDataPoint {
  label: string;
  value: number;
}

interface BarChartDisplayProps {
  data: BarChartDataPoint[];
  title?: string;
  height?: number;
  accentColor?: string;
}

export function BarChartDisplay({
  data,
  title,
  height = 150,
  accentColor,
}: BarChartDisplayProps) {
  const theme = useTheme();
  const fillColor = accentColor ?? theme.palette.primary.main;

  if (!data || data.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography variant="body2" color="text.secondary">
          No data
        </Typography>
      </Box>
    );
  }

  const isHorizontal = data.length <= 5;

  return (
    <Box sx={{ width: '100%' }} role="img" aria-label={`Bar chart: ${title ?? 'data'}`}>
      <ResponsiveContainer width="100%" height={height}>
        <BarChart
          data={data}
          layout={isHorizontal ? 'horizontal' : 'vertical'}
          margin={{ top: 5, right: 10, left: isHorizontal ? -10 : 10, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} vertical={!isHorizontal} horizontal={isHorizontal} />
          {isHorizontal ? (
            <>
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11, fill: theme.palette.text.secondary }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: theme.palette.text.secondary }}
                axisLine={false}
                tickLine={false}
              />
            </>
          ) : (
            <>
              <XAxis
                type="number"
                tick={{ fontSize: 11, fill: theme.palette.text.secondary }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                type="category"
                dataKey="label"
                tick={{ fontSize: 11, fill: theme.palette.text.secondary }}
                axisLine={false}
                tickLine={false}
                width={80}
              />
            </>
          )}
          <Tooltip
            contentStyle={{
              backgroundColor: theme.palette.background.paper,
              border: `1px solid ${theme.palette.divider}`,
              borderRadius: 4,
              fontSize: 12,
            }}
            formatter={(val) => {
 if (typeof val === 'number') return [new Intl.NumberFormat().format(val)];
 return [String(val)];
 }}
            cursor={{ fill: theme.palette.action.hover }}
          />
          <Bar
            dataKey="value"
            fill={fillColor}
            radius={isHorizontal ? [4, 4, 0, 0] : [0, 4, 4, 0]}
            maxBarSize={40}
          />
        </BarChart>
      </ResponsiveContainer>
    </Box>
  );
}
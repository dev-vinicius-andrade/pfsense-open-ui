import { Box, Typography } from '@mui/material';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import RemoveIcon from '@mui/icons-material/Remove';

interface StatCardProps {
  value: string | number;
  label: string;
  unit?: string;
  trend?: 'up' | 'down' | 'neutral';
  accentColor?: string;
}

const trendConfig = {
  up: { icon: ArrowUpwardIcon, color: 'success.main' },
  down: { icon: ArrowDownwardIcon, color: 'error.main' },
  neutral: { icon: RemoveIcon, color: 'text.disabled' },
} as const;

function formatValue(value: string | number): string {
  if (typeof value === 'string') return value;
  return new Intl.NumberFormat().format(value);
}

export function StatCard({ value, label, unit, trend, accentColor }: StatCardProps) {
  const hasData = value != null && value !== '';

  if (!hasData) {
    return (
      <Box sx={{ textAlign: 'center', py: 2 }}>
        <Typography variant="body2" color="text.secondary">
          No data
        </Typography>
      </Box>
    );
  }

  const TrendIcon = trend ? trendConfig[trend].icon : null;
  const trendColor = trend ? trendConfig[trend].color : undefined;

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        py: 2,
        gap: 0.5,
      }}
      role="status"
      aria-label={`${label}: ${formatValue(value)}${unit ?? ''}`}
    >
      <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.5 }}>
        <Typography
          variant="h3"
          component="span"
          sx={{
            fontWeight: 700,
            color: accentColor ?? 'text.primary',
            lineHeight: 1.2,
          }}
        >
          {formatValue(value)}
        </Typography>
        {unit && (
          <Typography variant="subtitle1" component="span" color="text.secondary">
            {unit}
          </Typography>
        )}
        {TrendIcon && (
          <TrendIcon
            sx={{ fontSize: 20, color: trendColor, ml: 0.5 }}
            aria-label={`Trend: ${trend}`}
          />
        )}
      </Box>
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
    </Box>
  );
}
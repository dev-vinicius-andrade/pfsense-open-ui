import { useTheme, type Theme } from '@mui/material/styles';
import { Box, CircularProgress, Typography } from '@mui/material';

interface ThresholdStop {
  value: number;
  color: 'success' | 'warning' | 'error' | 'primary' | 'secondary' | 'info';
}

interface GaugeChartProps {
  value: number;
  label: string;
  size?: number;
  thickness?: number;
  thresholds?: ThresholdStop[];
}

const DEFAULT_THRESHOLDS: ThresholdStop[] = [
  { value: 60, color: 'success' },
  { value: 80, color: 'warning' },
  { value: 100, color: 'error' },
];

function resolveThresholdColor(
  value: number,
  thresholds: ThresholdStop[],
  palette: Theme['palette'],
): string {
  const sorted = [...thresholds].sort((a, b) => a.value - b.value);
  for (const stop of sorted) {
    if (value <= stop.value) {
      return palette[stop.color]?.main ?? palette.primary.main;
    }
  }
  return palette.primary.main;
}

export function GaugeChart({ value, label, size = 100, thickness = 8, thresholds }: GaugeChartProps) {
  const theme = useTheme();
  const clampedValue = Math.min(100, Math.max(0, value));
  const activeThresholds = thresholds ?? DEFAULT_THRESHOLDS;
  const color = resolveThresholdColor(clampedValue, activeThresholds, theme.palette);

  return (
    <Box
      sx={{
        position: 'relative',
        display: 'inline-flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 1,
      }}
    >
      <Box sx={{ position: 'relative', display: 'inline-flex' }}>
        <CircularProgress
          variant="determinate"
          value={100}
          size={size}
          thickness={thickness}
          sx={{ color: 'divider', position: 'absolute' }}
          aria-hidden
        />
        <CircularProgress
          variant="determinate"
          value={clampedValue}
          size={size}
          thickness={thickness}
          sx={{ color, transition: 'color 0.3s ease' }}
          aria-label={`${label}: ${Math.round(clampedValue)}%`}
          role="progressbar"
          aria-valuenow={Math.round(clampedValue)}
          aria-valuemin={0}
          aria-valuemax={100}
        />
        <Box
          sx={{
            top: 0,
            left: 0,
            bottom: 0,
            right: 0,
            position: 'absolute',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Typography
            variant="body1"
            component="span"
            sx={{ fontWeight: 600, fontSize: size / 4 }}
          >
            {`${Math.round(clampedValue)}%`}
          </Typography>
        </Box>
      </Box>
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
    </Box>
  );
}
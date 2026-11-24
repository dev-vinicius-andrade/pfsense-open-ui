import { Box, CircularProgress, Typography } from '@mui/material';

interface GaugeThreshold {
  value: number;
  color: string;
}

interface GaugeDisplayProps {
  value: number;
  label: string;
  thresholds?: GaugeThreshold[];
  accentColor?: string;
}

function resolveColor(
  value: number,
  thresholds: GaugeThreshold[] | undefined,
  accentColor: string | undefined,
): string {
  if (thresholds && thresholds.length > 0) {
    const sorted = [...thresholds].sort((a, b) => b.value - a.value);
    for (const threshold of sorted) {
      if (value >= threshold.value) return threshold.color;
    }
    return sorted[sorted.length - 1].color;
  }
  if (accentColor) return accentColor;
  if (value >= 90) return '#D32F2F';
  if (value >= 75) return '#FFA000';
  return '#00897B';
}

export function GaugeDisplay({ value, label, thresholds, accentColor }: GaugeDisplayProps) {
  const clampedValue = Math.min(100, Math.max(0, value));
  const color = resolveColor(clampedValue, thresholds, accentColor);

  return (
    <Box
      sx={{
        position: 'relative',
        display: 'inline-flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 1,
        py: 1,
      }}
    >
      <Box sx={{ position: 'relative', display: 'inline-flex' }}>
        <CircularProgress
          variant="determinate"
          value={100}
          size={100}
          thickness={8}
          sx={{ color: 'divider', position: 'absolute' }}
          aria-hidden
        />
        <CircularProgress
          variant="determinate"
          value={clampedValue}
          size={100}
          thickness={8}
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
          <Typography variant="body1" component="span" sx={{ fontWeight: 600, fontSize: 24 }}>
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
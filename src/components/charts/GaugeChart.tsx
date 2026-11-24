import { Box, CircularProgress, Typography } from '@mui/material';

interface GaugeChartProps {
  value: number;
  label: string;
  size?: number;
  thickness?: number;
}

function getColor(value: number): string {
  if (value >= 90) return '#D32F2F';
  if (value >= 75) return '#FFA000';
  return '#00897B';
}

export function GaugeChart({ value, label, size = 100, thickness = 8 }: GaugeChartProps) {
  const clampedValue = Math.min(100, Math.max(0, value));
  const color = getColor(clampedValue);

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
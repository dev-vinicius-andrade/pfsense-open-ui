import type { SxProps, Theme } from '@mui/material/styles';

/**
 * Reusable sx presets for displaying metric values prominently.
 *
 * Usage:
 *   <Typography variant="h5" sx={metricValueSx}>1,234</Typography>
 *   <Typography variant="caption" sx={metricLabelSx}>Active Users</Typography>
 */
export const metricValueSx: SxProps<Theme> = {
  fontWeight: 700,
  lineHeight: 1.2,
};

export const metricLabelSx: SxProps<Theme> = {
  color: 'text.secondary',
  display: 'block',
  mt: 0.5,
};
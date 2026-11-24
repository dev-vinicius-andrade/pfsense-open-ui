import { Box, Typography, useTheme } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import WarningIcon from '@mui/icons-material/Warning';
import HelpOutlineIcon from '@mui/icons-material/HelpOutlineOutlined';

type StatusType = 'online' | 'offline' | 'warning' | 'unknown';

interface StatusIndicatorProps {
  status: StatusType;
  label: string;
  detail?: string;
}

const statusConfig: Record<
  StatusType,
  { icon: typeof CheckCircleIcon; colorKey: string }
> = {
  online: { icon: CheckCircleIcon, colorKey: 'success.main' },
  offline: { icon: ErrorIcon, colorKey: 'error.main' },
  warning: { icon: WarningIcon, colorKey: 'warning.main' },
  unknown: { icon: HelpOutlineIcon, colorKey: 'text.disabled' },
};

export function StatusIndicator({ status, label, detail }: StatusIndicatorProps) {
  const theme = useTheme();
  const config = statusConfig[status];
  const Icon = config.icon;
  const color = theme.palette[config.colorKey as keyof typeof theme.palette] as string
    ?? config.colorKey;

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
        py: 1,
      }}
      role="status"
      aria-label={`${label}: ${status}`}
    >
      <Icon sx={{ fontSize: 32, color }} />
      <Box sx={{ display: 'flex', flexDirection: 'column' }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
          {label}
        </Typography>
        {detail && (
          <Typography variant="caption" color="text.secondary">
            {detail}
          </Typography>
        )}
      </Box>
    </Box>
  );
}
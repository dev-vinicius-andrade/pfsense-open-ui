import { Chip } from '@mui/material';

type StatusType = 'online' | 'offline' | 'warning' | 'unknown';

interface StatusChipProps {
  status: StatusType;
  label?: string;
}

const statusColorMap: Record<StatusType, 'success' | 'error' | 'warning' | 'default'> = {
  online: 'success',
  offline: 'error',
  warning: 'warning',
  unknown: 'default',
};

const statusLabelMap: Record<StatusType, string> = {
  online: 'Online',
  offline: 'Offline',
  warning: 'Warning',
  unknown: 'Unknown',
};

export function StatusChip({ status, label }: StatusChipProps) {
  return (
    <Chip
      size="small"
      color={statusColorMap[status]}
      label={label ?? statusLabelMap[status]}
      variant="outlined"
    />
  );
}
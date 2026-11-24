import { Box, Typography } from '@mui/material';
import InboxIcon from '@mui/icons-material/Inbox';
import type { SvgIconComponent } from '@mui/icons-material';

interface EmptyStateProps {
  message: string;
  icon?: SvgIconComponent;
}

export function EmptyState({ message, icon: Icon = InboxIcon }: EmptyStateProps) {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        py: 8,
        color: 'text.secondary',
      }}
    >
      <Icon sx={{ fontSize: 64, mb: 2, opacity: 0.5 }} />
      <Typography variant="body1">{message}</Typography>
    </Box>
  );
}
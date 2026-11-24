import type { ReactNode } from 'react';
import { Box, Typography } from '@mui/material';

interface SectionHeadingProps {
  title: string;
  action?: ReactNode;
}

export function SectionHeading({ title, action }: SectionHeadingProps) {
  if (action) {
    return (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          mb: 2,
        }}
      >
        <Typography variant="overline" color="text.secondary">
          {title}
        </Typography>
        {action}
      </Box>
    );
  }

  return (
    <Typography variant="overline" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
      {title}
    </Typography>
  );
}
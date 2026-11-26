import { Box } from '@mui/material';

interface GridOverlayProps {
  columns: number;
  rowHeight: number;
}

export function GridOverlay({ columns, rowHeight }: GridOverlayProps) {
  return (
    <Box
      sx={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 0,
        opacity: 0.15,
        backgroundImage: (theme) => `
          linear-gradient(to right, ${theme.palette.divider} 1px, transparent 1px),
          linear-gradient(to bottom, ${theme.palette.divider} 1px, transparent 1px)
        `,
        backgroundSize: `${100 / columns}% ${rowHeight}px`,
      }}
    />
  );
}
import { Box } from '@mui/material';

interface GridOverlayProps {
  snapGridSize: number;
}

export function GridOverlay({ snapGridSize }: GridOverlayProps) {
  const gridSize = Math.max(1, snapGridSize);

  return (
    <Box
      sx={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 0,
        opacity: 0.12,
        backgroundImage: (theme) => `
          linear-gradient(to right, ${theme.palette.divider} 1px, transparent 1px),
          linear-gradient(to bottom, ${theme.palette.divider} 1px, transparent 1px)
        `,
        backgroundSize: `${gridSize}px ${gridSize}px`,
      }}
    />
  );
}
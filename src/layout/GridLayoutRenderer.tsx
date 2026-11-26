import React from 'react';
import { Box, useMediaQuery, useTheme } from '@mui/material';
import { PanelWrapper } from './PanelWrapper';
import type { ResolvedPanel } from './usePagePanels';

interface GridLayoutRendererProps {
  resolvedPanels: ResolvedPanel[];
  columns: number;
  rowHeight: number;
  isEditMode: boolean;
}

/**
 * Responsive grid layout renderer.
 * On mobile (< sm), panels stack vertically in a single column.
 * On tablet (sm–md), panels use a reduced column count.
 * On desktop (>= md), panels use the full configured column count.
 */
export const GridLayoutRenderer = React.memo(function GridLayoutRenderer({
  resolvedPanels,
  columns,
  rowHeight,
  isEditMode,
}: GridLayoutRendererProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));

  const visiblePanels = resolvedPanels.filter((p) => p.layout.visible);

  // Responsive column count
  const effectiveColumns = isMobile ? 1 : isTablet ? Math.min(columns, 6) : columns;

  // On mobile, render panels as a simple vertical stack ignoring grid positions
  if (isMobile) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
          position: 'relative',
          minHeight: 200,
        }}
      >
        {visiblePanels.map(({ definition, layout }) => (
          <Box key={definition.id} sx={{ width: '100%' }}>
            <PanelWrapper definition={definition} layout={layout} isEditMode={isEditMode} />
          </Box>
        ))}
      </Box>
    );
  }

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: `repeat(${effectiveColumns}, 1fr)`,
        gridAutoRows: `${rowHeight}px`,
        gap: 2,
        position: 'relative',
        minHeight: 400,
      }}
    >
      {visiblePanels.map(({ definition, layout }) => {
        // Clamp grid positions to effective columns on tablet
        const clampedX = isTablet ? Math.min(layout.x, effectiveColumns - 1) : layout.x;
        const clampedW = isTablet ? Math.min(layout.w, effectiveColumns - clampedX) : layout.w;

        return (
          <Box
            key={definition.id}
            sx={{
              gridColumn: `${clampedX + 1} / span ${clampedW}`,
              gridRow: `${layout.y + 1} / span ${layout.h}`,
              height: layout.h * rowHeight,
              minHeight: layout.h * rowHeight,
              maxHeight: layout.h * rowHeight,
              overflow: 'hidden',
            }}
          >
            <PanelWrapper definition={definition} layout={layout} isEditMode={isEditMode} />
          </Box>
        );
      })}
    </Box>
  );
});
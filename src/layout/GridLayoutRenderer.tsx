import React from 'react';
import { Box, useMediaQuery, useTheme } from '@mui/material';
import { PanelWrapper } from './PanelWrapper';
import type { ResolvedPanel } from './usePagePanels';
import { GRID_MARGIN } from './gridConstants';

interface GridLayoutRendererProps {
  resolvedPanels: ResolvedPanel[];
  columns: number;
  rowHeight: number;
  isEditMode: boolean;
}

/**
 * Responsive grid layout renderer.
 * Synchronized with RGL's layout algorithm so read-only view matches edit mode exactly.
 *
 * RGL positions items using:
 *   left = x * (colWidth + marginX) + containerPaddingX
 *   top = y * (rowHeight + marginY) + containerPaddingY
 *   width = w * colWidth + (w - 1) * marginX
 *   height = h * rowHeight + (h - 1) * marginY
 *
 * We replicate this with CSS Grid by using the same margin as gap and matching
 * row sizing to RGL's rowHeight. Container padding matches RGL's containerPadding=[0,0].
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

  // Responsive column count — matches RGL breakpoints
  const effectiveColumns = isMobile ? 1 : isTablet ? Math.min(columns, 8) : columns;

  const marginX = GRID_MARGIN[0];
  const marginY = GRID_MARGIN[1];

  // On mobile, render panels as a simple vertical stack ignoring grid positions
  if (isMobile) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: `${marginY}px`,
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

  /**
   * CSS Grid approach synchronized with RGL:
   * - gap matches RGL margin exactly
   * - grid-auto-rows matches RGL rowHeight
   * - No container padding (matches containerPadding=[0,0])
   * - Each cell spans the correct number of columns/rows
   *
   * With CSS Grid gap, the browser automatically accounts for gaps between tracks.
   * A panel spanning w columns gets: w * trackSize + (w-1) * gap
   * This matches RGL's: w * colWidth + (w-1) * marginX
   * when trackSize = colWidth (which CSS Grid ensures with 1fr tracks and matching gap).
   *
   * For rows: RGL uses rowHeight per unit plus margin between.
   * CSS grid-auto-rows sets the track size. With gap = marginY,
   * a panel spanning h rows gets: h * rowHeight + (h-1) * marginY — matching RGL.
   */
  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: `repeat(${effectiveColumns}, 1fr)`,
        gridAutoRows: `${rowHeight}px`,
        gap: `${marginY}px ${marginX}px`,
        position: 'relative',
        minHeight: 400,
      }}
    >
      {visiblePanels.map(({ definition, layout }) => {
        // Clamp grid positions to effective columns on tablet
        const clampedX = isTablet ? Math.min(layout.x, effectiveColumns - 1) : layout.x;
        const clampedW = isTablet
          ? Math.min(layout.w, effectiveColumns - clampedX)
          : layout.w;

        return (
          <Box
            key={definition.id}
            sx={{
              gridColumn: `${clampedX + 1} / span ${clampedW}`,
              gridRow: `${layout.y + 1} / span ${layout.h}`,
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
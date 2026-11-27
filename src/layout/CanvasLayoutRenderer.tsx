import React from 'react';
import { Box, useMediaQuery, useTheme } from '@mui/material';
import { PanelWrapper } from './PanelWrapper';
import type { ResolvedPanel } from './usePagePanels';
import type { PageLayout } from './types';

interface CanvasLayoutRendererProps {
  resolvedPanels: ResolvedPanel[];
  pageLayout: PageLayout;
  isEditMode: boolean;
  containerWidth: number;
}

const MOBILE_BREAKPOINT = 768;
const CANVAS_PADDING_BOTTOM = 48;

function resolveWidth(width: number | string, containerWidth: number): number | string {
  if (typeof width === 'string') {
    if (width.endsWith('%')) {
      const pct = parseFloat(width) / 100;
      return Math.round(containerWidth * pct);
    }
    return width;
  }
  return width;
}

function computeCanvasMinHeight(panels: ResolvedPanel[]): number {
  let maxBottom = 0;
  for (const p of panels) {
    if (!p.layout.visible) continue;
    const bottom = p.layout.y + p.layout.height;
    if (bottom > maxBottom) maxBottom = bottom;
  }
  return maxBottom + CANVAS_PADDING_BOTTOM;
}

export const CanvasLayoutRenderer = React.memo(function CanvasLayoutRenderer({
  resolvedPanels,
  // pageLayout reserved for future canvas-level config (snapGridSize, etc.)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  pageLayout: _pageLayout,
  isEditMode,
  containerWidth,
}: CanvasLayoutRendererProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const visiblePanels = resolvedPanels.filter((p) => p.layout.visible);

  if (isMobile || containerWidth < MOBILE_BREAKPOINT) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
          position: 'relative',
          minHeight: 200,
          width: '100%',
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

  const minHeight = computeCanvasMinHeight(visiblePanels);

  return (
    <Box
      sx={{
        position: 'relative',
        width: '100%',
        minHeight,
      }}
    >
      {visiblePanels.map(({ definition, layout }) => {
        const resolvedW = resolveWidth(layout.width, containerWidth);
        const zIndex = layout.zIndex ?? 0;

        const styleOverrides: React.CSSProperties = {};
        if (layout.bgColor) styleOverrides.backgroundColor = layout.bgColor;
        if (layout.borderColor) styleOverrides.borderColor = layout.borderColor;
        if (layout.borderRadius != null) styleOverrides.borderRadius = layout.borderRadius;
        if (layout.textColor) styleOverrides.color = layout.textColor;

        return (
          <Box
            key={definition.id}
            sx={{
              position: 'absolute',
              left: 0,
              top: 0,
              width: typeof resolvedW === 'number' ? resolvedW : resolvedW,
              height: layout.height,
              zIndex,
              transform: `translate3d(${layout.x}px, ${layout.y}px, 0)`,
              willChange: 'transform',
            }}
            style={styleOverrides}
          >
            <PanelWrapper definition={definition} layout={layout} isEditMode={isEditMode} />
          </Box>
        );
      })}
    </Box>
  );
});
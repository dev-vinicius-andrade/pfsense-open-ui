import React from 'react';
import { Box } from '@mui/material';
import { PanelWrapper } from './PanelWrapper';
import type { ResolvedPanel } from './usePagePanels';

interface GridLayoutRendererProps {
  resolvedPanels: ResolvedPanel[];
  columns: number;
  rowHeight: number;
  isEditMode: boolean;
}

export const GridLayoutRenderer = React.memo(function GridLayoutRenderer({
  resolvedPanels,
  columns,
  rowHeight,
  isEditMode,
}: GridLayoutRendererProps) {
  const visiblePanels = resolvedPanels.filter((p) => p.layout.visible);

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: `repeat(${columns}, 1fr)`,
        gridAutoRows: `${rowHeight}px`,
        gap: 2,
        position: 'relative',
        minHeight: 400,
      }}
    >
      {visiblePanels.map(({ definition, layout }) => (
        <Box
          key={definition.id}
          sx={{
            gridColumn: `${layout.x + 1} / span ${layout.w}`,
            gridRow: `${layout.y + 1} / span ${layout.h}`,
            minHeight: layout.h * rowHeight,
          }}
        >
          <PanelWrapper definition={definition} layout={layout} isEditMode={isEditMode} />
        </Box>
      ))}
    </Box>
  );
});
import React, { useCallback } from 'react';
import { Box } from '@mui/material';
import { PanelWrapper } from './PanelWrapper';
import { GRID_MARGIN } from './gridConstants';
import type { ResolvedPanel } from './usePagePanels';
import type { PageLayout, PanelLayout } from './types';

// Lazy-load RGL — this is the ONLY file that imports react-grid-layout
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ResponsiveReactGridLayout = React.lazy((): Promise<{ default: React.ComponentType<any> }> =>
  import('react-grid-layout').then((mod: any) => {
    const Component = mod.Responsive ?? mod.default?.Responsive ?? mod.default;
    return { default: Component };
  }),
);

// RGL CSS imports — only loaded when this module is evaluated
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

interface RglEditWrapperProps {
  resolvedPanels: ResolvedPanel[];
  pageLayout: PageLayout;
  onLayoutChange: (panels: ResolvedPanel[]) => void;
}

interface RglLayoutItem {
  i: string;
  x: number;
  y: number;
  w: number;
  h: number;
  minW?: number;
  minH?: number;
  maxW?: number;
  maxH?: number;
  static?: boolean;
}

function toRglLayout(resolvedPanels: ResolvedPanel[], maxCols?: number): RglLayoutItem[] {
  return resolvedPanels
    .filter((p) => p.layout.visible)
    .map((p) => {
      const isLocked =
        p.definition.locked === true ||
        p.layout.runtimeLocked === true;

      const item: RglLayoutItem = {
        i: p.definition.id,
        x: p.layout.x,
        y: p.layout.y,
        w: p.layout.w,
        h: p.layout.h,
        minW: p.definition.minWidth ?? p.layout.minW ?? 1,
        minH: p.definition.minHeight ?? p.layout.minH ?? 1,
        maxW: p.layout.maxW,
        maxH: p.layout.maxH,
        static: isLocked,
      };

      // Clamp positions and widths when a max column count is specified
      if (maxCols != null) {
        item.x = Math.min(item.x, maxCols - 1);
        item.w = Math.min(item.w, maxCols - item.x);
      }
      return item;
    });
}

/**
 * Generate responsive layouts for RGL breakpoints.
 * lg: full desktop layout as configured
 * md: clamp to 8 columns
 * sm: single-column vertical stack
 */
function buildResponsiveLayouts(resolvedPanels: ResolvedPanel[]) {
  const lgLayout = toRglLayout(resolvedPanels);
  const mdLayout = toRglLayout(resolvedPanels, 8);
  // sm: stack vertically, each panel full-width
  const smLayout = resolvedPanels
    .filter((p) => p.layout.visible)
    .map((p, index) => ({
      i: p.definition.id,
      x: 0,
      y: index,
      w: 1,
      h: p.layout.h,
      minW: 1,
      minH: p.definition.minHeight ?? p.layout.minH ?? 1,
      static: false,
    }));

  return { lg: lgLayout, md: mdLayout, sm: smLayout };
}

export const RglEditWrapper = React.memo(function RglEditWrapper({
  resolvedPanels,
  pageLayout,
  onLayoutChange,
}: RglEditWrapperProps) {
  const responsiveLayouts = buildResponsiveLayouts(resolvedPanels);

  const handleLayoutChange = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (newLayout: any) => {
      const items = newLayout as RglLayoutItem[];
      const updated = resolvedPanels.map((rp) => {
        const rglItem = items.find((l) => l.i === rp.definition.id);
        if (!rglItem) return rp;
        return {
          ...rp,
          layout: {
            ...rp.layout,
            x: rglItem.x,
            y: rglItem.y,
            w: rglItem.w,
            h: rglItem.h,
          },
        };
      });
      onLayoutChange(updated);
    },
    [resolvedPanels, onLayoutChange],
  );

  /** Handle per-panel layout changes from PanelWrapper controls and custom resize */
  const handlePanelLayoutChange = useCallback(
    (panelId: string, updates: Partial<PanelLayout>) => {
      const updated = resolvedPanels.map((rp) => {
        if (rp.definition.id !== panelId) return rp;
        return {
          ...rp,
          layout: { ...rp.layout, ...updates },
        };
      });
      onLayoutChange(updated);
    },
    [resolvedPanels, onLayoutChange],
  );

  const gridConfig = {
    columns: pageLayout.columns,
    rowHeight: pageLayout.rowHeight,
    margin: GRID_MARGIN,
  };

  return (
    <Box sx={{ position: 'relative', minHeight: 400 }}>
      <React.Suspense
        fallback={<Box sx={{ p: 4, textAlign: 'center' }}>Loading editor...</Box>}
      >
        <ResponsiveReactGridLayout
          className="layout"
          layouts={responsiveLayouts}
          cols={{ lg: pageLayout.columns, md: 8, sm: 1 }}
          breakpoints={{ lg: 1200, md: 768, sm: 0 }}
          rowHeight={pageLayout.rowHeight}
          onLayoutChange={handleLayoutChange}
          draggableHandle=".panel-drag-handle"
          margin={GRID_MARGIN}
          containerPadding={[0, 0]}
          useCSSTransforms={false}
          isResizable={false}
          allowOverlap={false}
          compactType="vertical"
        >
          {resolvedPanels
            .filter((p) => p.layout.visible)
            .map(({ definition, layout }) => (
              <div key={definition.id}>
                <PanelWrapper
                  definition={definition}
                  layout={layout}
                  isEditMode={true}
                  onPanelLayoutChange={handlePanelLayoutChange}
                  gridConfig={gridConfig}
                />
              </div>
            ))}
        </ResponsiveReactGridLayout>
      </React.Suspense>
    </Box>
  );
});
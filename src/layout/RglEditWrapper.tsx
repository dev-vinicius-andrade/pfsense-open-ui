import React, { useCallback } from 'react';
import { Box, GlobalStyles } from '@mui/material';
import { PanelWrapper } from './PanelWrapper';
import type { ResolvedPanel } from './usePagePanels';
import type { PageLayout } from './types';

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

/**
 * MUI GlobalStyles for RGL resize handles.
 * Using GlobalStyles instead of a raw <style> tag ensures proper CSS specificity
 * against MUI's CSS-in-JS generated styles.
 */
const rglResizeGlobalStyles = {
  // Make the default react-resizable handle visible and styled
  '.react-grid-item > .react-resizable-handle': {
    position: 'absolute !important',
    width: '20px !important',
    height: '20px !important',
    bottom: '0 !important',
    right: '0 !important',
    cursor: 'se-resize !important',
    zIndex: 100,
    background: 'none !important',
  },
  '.react-grid-item > .react-resizable-handle::after': {
    content: '"" !important',
    position: 'absolute !important',
    right: '3px !important',
    bottom: '3px !important',
    width: '8px !important',
    height: '8px !important',
    borderRight: '2px solid rgba(160, 160, 160, 0.7) !important',
    borderBottom: '2px solid rgba(160, 160, 160, 0.7) !important',
    pointerEvents: 'none',
  },
  '.react-grid-item:hover > .react-resizable-handle::after': {
    borderColor: 'rgba(100, 220, 180, 1) !important',
  },
  // Hide east/south-only handles if present — we only want se
  '.react-grid-item > .react-resizable-handle-e, .react-grid-item > .react-resizable-handle-s':
    {
      display: 'none !important',
    },
};

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
  static?: boolean;
}

function toRglLayout(resolvedPanels: ResolvedPanel[], maxCols?: number): RglLayoutItem[] {
  return resolvedPanels
    .filter((p) => p.layout.visible)
    .map((p) => {
      const item: RglLayoutItem = {
        i: p.definition.id,
        x: p.layout.x,
        y: p.layout.y,
        w: p.layout.w,
        h: p.layout.h,
        minW: p.definition.minWidth ?? p.layout.minW ?? 1,
        minH: p.definition.minHeight ?? p.layout.minH ?? 1,
        static: false,
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

  return (
    <Box sx={{ position: 'relative', minHeight: 400 }}>
      {/* Inject resize handle styles via MUI GlobalStyles for proper specificity */}
      <GlobalStyles styles={rglResizeGlobalStyles} />
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
          margin={[16, 16]}
          containerPadding={[0, 0]}
          useCSSTransforms={false}
        >
          {resolvedPanels
            .filter((p) => p.layout.visible)
            .map(({ definition, layout }) => (
              <div key={definition.id}>
                <PanelWrapper
                  definition={definition}
                  layout={layout}
                  isEditMode={true}
                />
              </div>
            ))}
        </ResponsiveReactGridLayout>
      </React.Suspense>
    </Box>
  );
});
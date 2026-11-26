import React, { useCallback } from 'react';
import { Box } from '@mui/material';
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

// Custom styles injected via style tag for RGL resize handles in dark/light themes
const RGL_RESIZE_STYLES = `
.react-grid-item > .react-resizable-handle {
  position: absolute !important;
  width: 24px !important;
  height: 24px !important;
  bottom: 0 !important;
  right: 0 !important;
  cursor: se-resize !important;
  z-index: 100 !important;
  background-image: none !important;
}
.react-grid-item > .react-resizable-handle::after {
  content: '' !important;
  position: absolute !important;
  right: 4px !important;
  bottom: 4px !important;
  width: 10px !important;
  height: 10px !important;
  border-right: 3px solid rgba(180, 180, 180, 0.8) !important;
  border-bottom: 3px solid rgba(180, 180, 180, 0.8) !important;
  pointer-events: none;
}
.react-grid-item:hover > .react-resizable-handle::after {
  border-color: rgba(100, 220, 180, 1) !important;
}
.react-grid-item > .react-resizable-handle span {
  display: none !important;
}`;

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
      {/* Inject custom resize handle styles */}
      <style>{RGL_RESIZE_STYLES}</style>
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
          resizeHandle=".react-resizable-handle"
          margin={[16, 16]}
          containerPadding={[0, 0]}
          useCSSTransforms={true}
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
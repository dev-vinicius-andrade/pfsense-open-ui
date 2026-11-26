import React, { useCallback } from 'react';
import { Box, GlobalStyles } from '@mui/material';
import { PanelWrapper } from './PanelWrapper';
import type { ResolvedPanel } from './usePagePanels';
import type { PageLayout, PanelLayout, ResizeHandleAxis } from './types';

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

/** Default resize handles for panels that don't specify their own */
const DEFAULT_RESIZE_HANDLES: ResizeHandleAxis[] = ['se', 'e', 's'];

/**
 * MUI GlobalStyles for custom multi-directional RGL resize handles.
 * Styled to match the pfSense UI teal accent with visible grip indicators.
 */
const rglResizeGlobalStyles = {
  // Base handle positioning for all axes
  '.react-grid-item > .react-resizable-handle': {
    position: 'absolute !important',
    zIndex: 100,
    background: 'none !important',
  },
  // SE corner handle (primary)
  '.react-grid-item > .react-resizable-handle-se': {
    width: '22px !important',
    height: '22px !important',
    bottom: '0 !important',
    right: '0 !important',
    cursor: 'se-resize !important',
  },
  '.react-grid-item > .react-resizable-handle-se::after': {
    content: '"" !important',
    position: 'absolute !important',
    right: '4px !important',
    bottom: '4px !important',
    width: '10px !important',
    height: '10px !important',
    borderRight: '2px solid rgba(160, 160, 160, 0.6) !important',
    borderBottom: '2px solid rgba(160, 160, 160, 0.6) !important',
    pointerEvents: 'none',
    transition: 'border-color 150ms ease',
  },
  '.react-grid-item:hover > .react-resizable-handle-se::after': {
    borderColor: 'rgba(0, 188, 160, 0.9) !important',
  },
  // East edge handle
  '.react-grid-item > .react-resizable-handle-e': {
    width: '8px !important',
    height: '100% !important',
    top: '0 !important',
    right: '-4px !important',
    cursor: 'ew-resize !important',
  },
  '.react-grid-item > .react-resizable-handle-e::after': {
    content: '"" !important',
    position: 'absolute !important',
    right: '3px !important',
    top: '50% !important',
    transform: 'translateY(-50%) !important',
    width: '2px !important',
    height: '24px !important',
    backgroundColor: 'rgba(160, 160, 160, 0.4) !important',
    borderRadius: '1px !important',
    pointerEvents: 'none',
    transition: 'background-color 150ms ease',
  },
  '.react-grid-item:hover > .react-resizable-handle-e::after': {
    backgroundColor: 'rgba(0, 188, 160, 0.7) !important',
  },
  // South edge handle
  '.react-grid-item > .react-resizable-handle-s': {
    width: '100% !important',
    height: '8px !important',
    bottom: '-4px !important',
    left: '0 !important',
    cursor: 'ns-resize !important',
  },
  '.react-grid-item > .react-resizable-handle-s::after': {
    content: '"" !important',
    position: 'absolute !important',
    bottom: '3px !important',
    left: '50% !important',
    transform: 'translateX(-50%) !important',
    width: '24px !important',
    height: '2px !important',
    backgroundColor: 'rgba(160, 160, 160, 0.4) !important',
    borderRadius: '1px !important',
    pointerEvents: 'none',
    transition: 'background-color 150ms ease',
  },
  '.react-grid-item:hover > .react-resizable-handle-s::after': {
    backgroundColor: 'rgba(0, 188, 160, 0.7) !important',
  },
  // North edge handle
  '.react-grid-item > .react-resizable-handle-n': {
    width: '100% !important',
    height: '8px !important',
    top: '-4px !important',
    left: '0 !important',
    cursor: 'ns-resize !important',
  },
  // West edge handle
  '.react-grid-item > .react-resizable-handle-w': {
    width: '8px !important',
    height: '100% !important',
    top: '0 !important',
    left: '-4px !important',
    cursor: 'ew-resize !important',
  },
  // NE corner handle
  '.react-grid-item > .react-resizable-handle-ne': {
    width: '18px !important',
    height: '18px !important',
    top: '0 !important',
    right: '0 !important',
    cursor: 'ne-resize !important',
  },
  // NW corner handle
  '.react-grid-item > .react-resizable-handle-nw': {
    width: '18px !important',
    height: '18px !important',
    top: '0 !important',
    left: '0 !important',
    cursor: 'nw-resize !important',
  },
  // SW corner handle
  '.react-grid-item > .react-resizable-handle-sw': {
    width: '18px !important',
    height: '18px !important',
    bottom: '0 !important',
    left: '0 !important',
    cursor: 'sw-resize !important',
  },
  // Active resizing state — highlight all handles
  '.react-grid-item.react-resizable.resizing > .react-resizable-handle::after': {
    borderColor: 'rgba(0, 188, 160, 1) !important',
    backgroundColor: 'rgba(0, 188, 160, 1) !important',
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
  maxW?: number;
  maxH?: number;
  static?: boolean;
  resizeHandles?: ResizeHandleAxis[];
}

function toRglLayout(resolvedPanels: ResolvedPanel[], maxCols?: number): RglLayoutItem[] {
  return resolvedPanels
    .filter((p) => p.layout.visible)
    .map((p) => {
      const isLocked =
        p.definition.locked === true ||
        p.layout.runtimeLocked === true;
      const snapToGrid = p.layout.snapToGrid !== false;

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
        resizeHandles: isLocked ? [] : (p.layout.resizeHandles ?? DEFAULT_RESIZE_HANDLES),
      };

      // When snap is disabled, allow free-form sizing (min constraints still apply)
      if (!snapToGrid && !isLocked) {
        // RGL doesn't truly support sub-grid, but we relax min to 1
        item.minW = 1;
        item.minH = 1;
      }

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
      resizeHandles: DEFAULT_RESIZE_HANDLES,
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

  /** Handle per-panel layout changes from PanelWrapper controls */
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

  return (
    <Box sx={{ position: 'relative', minHeight: 400 }}>
      {/* Inject custom resize handle styles via MUI GlobalStyles */}
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
          resizeHandles={['se', 'e', 's', 'n', 'w', 'ne', 'nw', 'sw']}
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
                />
              </div>
            ))}
        </ResponsiveReactGridLayout>
      </React.Suspense>
    </Box>
  );
});
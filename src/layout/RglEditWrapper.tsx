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

function toRglLayout(resolvedPanels: ResolvedPanel[]): RglLayoutItem[] {
  return resolvedPanels
    .filter((p) => p.layout.visible)
    .map((p) => ({
      i: p.definition.id,
      x: p.layout.x,
      y: p.layout.y,
      w: p.layout.w,
      h: p.layout.h,
      minW: p.definition.minWidth ?? p.layout.minW ?? 1,
      minH: p.definition.minHeight ?? p.layout.minH ?? 1,
      static: false,
    }));
}

export const RglEditWrapper = React.memo(function RglEditWrapper({
  resolvedPanels,
  pageLayout,
  onLayoutChange,
}: RglEditWrapperProps) {
  const rglLayout = toRglLayout(resolvedPanels);

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
      <React.Suspense
        fallback={<Box sx={{ p: 4, textAlign: 'center' }}>Loading editor...</Box>}
      >
        <ResponsiveReactGridLayout
          className="layout"
          layouts={{ lg: rglLayout }}
          cols={{ lg: pageLayout.columns, md: 8, sm: 1 }}
          breakpoints={{ lg: 1200, md: 768, sm: 0 }}
          rowHeight={pageLayout.rowHeight}
          onLayoutChange={handleLayoutChange}
          draggableHandle=".panel-drag-handle"
          resizeHandle=".panel-resize-handle"
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
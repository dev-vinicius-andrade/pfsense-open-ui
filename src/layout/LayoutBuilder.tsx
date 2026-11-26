import React, { useState, useCallback, useRef } from 'react';
import { Box, Fab, Tooltip } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { useUiStore } from '@/stores/uiStore';
import { usePagePanels } from './usePagePanels';
import { savePageLayout, resetPageLayout } from './layoutStorage';
import { GridLayoutRenderer } from './GridLayoutRenderer';
import { GridOverlay } from './GridOverlay';
import { EditModeToolbar } from './EditModeToolbar';
import { AddPanelDrawer } from './AddPanelDrawer';
import type { PageLayout } from './types';
import type { ResolvedPanel } from './usePagePanels';

// Lazy-load the RGL edit wrapper — only loaded when entering edit mode
const RglEditWrapper = React.lazy(() =>
  import('./RglEditWrapper').then((m) => ({ default: m.RglEditWrapper })),
);

interface LayoutBuilderProps {
  pageId: string;
  children?: React.ReactNode; // Fallback content if no panels registered
}

export function LayoutBuilder({ pageId, children }: LayoutBuilderProps) {
  const layoutEditMode = useUiStore((state) => state.layoutEditMode);
  const { resolvedPanels, pageLayout, panels } = usePagePanels(pageId);
  const [addDrawerOpen, setAddDrawerOpen] = useState(false);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // If no panels registered for this page, render children normally
  if (panels.length === 0) {
    return <>{children}</>;
  }

  const handleLayoutChange = useCallback(
    (updatedPanels: ResolvedPanel[]) => {
      // Debounced save to localStorage
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(() => {
        const newLayout: PageLayout = {
          ...pageLayout,
          panels: updatedPanels.map((p) => p.layout),
          updatedAt: Date.now(),
        };
        savePageLayout(newLayout);
      }, 300);
    },
    [pageLayout],
  );

  const handleReset = useCallback(() => {
    resetPageLayout(pageId, panels);
    // Force re-render by reloading — the hook will pick up new localStorage value
    window.location.reload();
  }, [pageId, panels]);

  const handleFitWidth = useCallback(() => {
    const updated = resolvedPanels.map((rp) => ({
      ...rp,
      layout: {
        ...rp.layout,
        x: 0,
        w: pageLayout.columns,
      },
    }));
    handleLayoutChange(updated);
  }, [resolvedPanels, pageLayout.columns, handleLayoutChange]);

  const handleFitHeight = useCallback(() => {
    const updated = resolvedPanels.map((rp) => ({
      ...rp,
      layout: {
        ...rp.layout,
        h: 6,
      },
    }));
    handleLayoutChange(updated);
  }, [resolvedPanels, handleLayoutChange]);

  const handleAlignLeft = useCallback(() => {
    const updated = resolvedPanels.map((rp) => ({
      ...rp,
      layout: {
        ...rp.layout,
        x: 0,
      },
    }));
    handleLayoutChange(updated);
  }, [resolvedPanels, handleLayoutChange]);

  const handleAutoArrange = useCallback(() => {
    // Sort visible panels by y then x, reassign positions sequentially
    const visiblePanels = resolvedPanels.filter((p) => p.layout.visible);
    const sorted = [...visiblePanels].sort((a, b) => {
      if (a.layout.y !== b.layout.y) return a.layout.y - b.layout.y;
      return a.layout.x - b.layout.x;
    });

    // Simple vertical stacking: each panel gets its own row(s)
    let currentY = 0;
    const arrangedVisible = sorted.map((rp) => {
      const item = {
        ...rp,
        layout: {
          ...rp.layout,
          x: 0,
          y: currentY,
          w: pageLayout.columns,
        },
      };
      currentY += rp.layout.h;
      return item;
    });

    // Preserve hidden panels unchanged
    const hiddenPanels = resolvedPanels.filter((p) => !p.layout.visible);
    const updated = [...arrangedVisible, ...hiddenPanels];
    handleLayoutChange(updated);
  }, [resolvedPanels, pageLayout.columns, handleLayoutChange]);

  const handleAddPanel = useCallback(
    (panelId: string) => {
      const updatedPanels = resolvedPanels.map((rp) =>
        rp.definition.id === panelId
          ? { ...rp, layout: { ...rp.layout, visible: true } }
          : rp,
      );
      handleLayoutChange(updatedPanels);
      setAddDrawerOpen(false);
    },
    [resolvedPanels, handleLayoutChange],
  );

  const hiddenPanels = resolvedPanels.filter((p) => !p.layout.visible);

  return (
    <Box sx={{ position: 'relative', minHeight: '100%' }}>
      {/* Grid overlay in edit mode */}
      {layoutEditMode && (
        <GridOverlay columns={pageLayout.columns} rowHeight={pageLayout.rowHeight} />
      )}

      {/* Main content area */}
      <Box sx={{ position: 'relative', zIndex: 1 }}>
        {layoutEditMode ? (
          <React.Suspense
            fallback={
              <GridLayoutRenderer
                resolvedPanels={resolvedPanels}
                columns={pageLayout.columns}
                rowHeight={pageLayout.rowHeight}
                isEditMode={false}
              />
            }
          >
            <RglEditWrapper
              resolvedPanels={resolvedPanels}
              pageLayout={pageLayout}
              onLayoutChange={handleLayoutChange}
            />
          </React.Suspense>
        ) : (
          <GridLayoutRenderer
            resolvedPanels={resolvedPanels}
            columns={pageLayout.columns}
            rowHeight={pageLayout.rowHeight}
            isEditMode={false}
          />
        )}
      </Box>

      {/* Edit mode controls */}
      {layoutEditMode && (
        <>
          <EditModeToolbar
            onReset={handleReset}
            onFitWidth={handleFitWidth}
            onFitHeight={handleFitHeight}
            onAlignLeft={handleAlignLeft}
            onAutoArrange={handleAutoArrange}
          />
          {hiddenPanels.length > 0 && (
            <Tooltip title="Add hidden panel">
              <Fab
                size="small"
                color="primary"
                onClick={() => setAddDrawerOpen(true)}
                aria-label="add hidden panel"
                sx={{
                  position: 'fixed',
                  bottom: 80,
                  right: 24,
                  zIndex: (t) => t.zIndex.tooltip + 2,
                }}
              >
                <AddIcon />
              </Fab>
            </Tooltip>
          )}
          <AddPanelDrawer
            open={addDrawerOpen}
            onClose={() => setAddDrawerOpen(false)}
            hiddenPanels={hiddenPanels}
            onAddPanel={handleAddPanel}
          />
        </>
      )}
    </Box>
  );
}
import React, { useState, useCallback, useRef } from 'react';
import { Box, Fab, Tooltip } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { useUiStore } from '@/stores/uiStore';
import { usePagePanels } from './usePagePanels';
import { savePageLayout, resetPageLayout } from './layoutStorage';
import { CanvasLayoutRenderer } from './CanvasLayoutRenderer';
import { CanvasEditWrapper } from './CanvasEditWrapper';
import { EditModeToolbar } from './EditModeToolbar';
import { AddPanelDrawer } from './AddPanelDrawer';
import type { PageLayout } from './types';
import type { ResolvedPanel } from './usePagePanels';

interface LayoutBuilderProps {
  pageId: string;
  children?: React.ReactNode; // Fallback content if no panels registered
}

export function LayoutBuilder({ pageId, children }: LayoutBuilderProps) {
  const layoutEditMode = useUiStore((state) => state.layoutEditMode);
  const { resolvedPanels, pageLayout, panels } = usePagePanels(pageId);
  const [addDrawerOpen, setAddDrawerOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);

  // Measure container width for responsive canvas rendering
  const measuredRef = useCallback((node: HTMLDivElement | null) => {
    if (node) {
      containerRef.current = node;
      setContainerWidth(node.clientWidth);

      // Observe resize events to keep width in sync
      const observer = new ResizeObserver((entries) => {
        for (const entry of entries) {
          setContainerWidth(entry.contentRect.width);
        }
      });
      observer.observe(node);

      // Store cleanup on the node itself
      (node as unknown as Record<string, () => void>).__resizeCleanup = () => observer.disconnect();
    } else if (containerRef.current) {
      const cleanup = (containerRef.current as unknown as Record<string, () => void>).__resizeCleanup;
      cleanup?.();
      containerRef.current = null;
    }
  }, []);

  // If no panels registered for this page, render children normally
  if (panels.length === 0) {
    return <>{children}</>;
  }

  const handleLayoutChange = useCallback(
    (updatedPanels: ResolvedPanel[]) => {
      const newLayout: PageLayout = {
        ...pageLayout,
        panels: updatedPanels.map((p) => p.layout),
        updatedAt: Date.now(),
      };
      savePageLayout(newLayout);
    },
    [pageLayout],
  );

  const handleReset = useCallback(() => {
    resetPageLayout(pageId, panels);
    window.location.reload();
  }, [pageId, panels]);

  const handleFitWidth = useCallback(() => {
    const updated = resolvedPanels.map((rp) => ({
      ...rp,
      layout: {
        ...rp.layout,
        x: 0,
        width: '100%' as const,
      },
    }));
    handleLayoutChange(updated);
  }, [resolvedPanels, handleLayoutChange]);

  const handleFitHeight = useCallback(() => {
    const updated = resolvedPanels.map((rp) => ({
      ...rp,
      layout: {
        ...rp.layout,
        height: 320,
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
    const GAP = 16;
    const visiblePanels = resolvedPanels.filter((p) => p.layout.visible);
    const sorted = [...visiblePanels].sort((a, b) => {
      if (a.layout.y !== b.layout.y) return a.layout.y - b.layout.y;
      return a.layout.x - b.layout.x;
    });

    // Vertical stacking with gap between panels
    let currentY = 0;
    const arrangedVisible = sorted.map((rp) => {
      const item = {
        ...rp,
        layout: {
          ...rp.layout,
          x: 0,
          y: currentY,
          width: '100%' as const,
        },
      };
      currentY += rp.layout.height + GAP;
      return item;
    });

    // Preserve hidden panels unchanged
    const hiddenPanels = resolvedPanels.filter((p) => !p.layout.visible);
    const updated = [...arrangedVisible, ...hiddenPanels];
    handleLayoutChange(updated);
  }, [resolvedPanels, handleLayoutChange]);

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
    <Box ref={measuredRef} sx={{ position: 'relative', minHeight: '100%', width: '100%' }}>
      {/* Main content area */}
      <Box sx={{ position: 'relative', zIndex: 1, width: '100%' }}>
        {layoutEditMode ? (
          <CanvasEditWrapper
            resolvedPanels={resolvedPanels}
            pageLayout={pageLayout}
            onLayoutChange={handleLayoutChange}
            containerWidth={containerWidth}
          />
        ) : (
          <CanvasLayoutRenderer
            resolvedPanels={resolvedPanels}
            pageLayout={pageLayout}
            isEditMode={false}
            containerWidth={containerWidth}
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
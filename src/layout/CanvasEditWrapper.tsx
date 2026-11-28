import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Box, useMediaQuery, useTheme } from '@mui/material';
import { PanelWrapper } from './PanelWrapper';
import { GridOverlay } from './GridOverlay';
import type { ResolvedPanel } from './usePagePanels';
import type { PageLayout, PanelLayout } from './types';

interface CanvasEditWrapperProps {
  resolvedPanels: ResolvedPanel[];
  pageLayout: PageLayout;
  onLayoutChange: (updatedPanels: ResolvedPanel[]) => void;
  containerWidth: number;
}

const MOBILE_BREAKPOINT = 768;
const CANVAS_PADDING_BOTTOM = 48;

type DragMode = 'move' | 'resize-e' | 'resize-s' | 'resize-se';

interface DragState {
  mode: DragMode;
  panelId: string;
  startPointerX: number;
  startPointerY: number;
  startX: number;
  startY: number;
  startWidth: number;
  startHeight: number;
}

function resolveWidth(width: number | string, containerWidth: number): number {
  if (typeof width === 'string') {
    if (width.endsWith('%')) {
      const pct = parseFloat(width) / 100;
      return Math.round(containerWidth * pct);
    }
    return parseInt(width, 10) || 0;
  }
  return width;
}

function snapValue(value: number, gridSize: number, enabled: boolean): number {
  if (!enabled || gridSize <= 0) return value;
  return Math.round(value / gridSize) * gridSize;
}

function clampDimension(value: number, min?: number, max?: number): number {
  let result = value;
  if (min != null) result = Math.max(min, result);
  if (max != null) result = Math.min(max, result);
  return result;
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

export const CanvasEditWrapper = React.memo(function CanvasEditWrapper({
  resolvedPanels,
  pageLayout,
  onLayoutChange,
  containerWidth,
}: CanvasEditWrapperProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [selectedPanelId, setSelectedPanelId] = useState<string | null>(null);
  const [draggingPanelId, setDraggingPanelId] = useState<string | null>(null);
  const [localPositions, setLocalPositions] = useState<Record<string, { x: number; y: number; width: number; height: number }>>({});

  const dragStateRef = useRef<DragState | null>(null);
  const rafRef = useRef<number | null>(null);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const visiblePanels = resolvedPanels.filter((p) => p.layout.visible);
  const snapGridSize = pageLayout.snapGridSize ?? 16;

  // Clean up RAF and timeouts on unmount
  useEffect(() => {
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      if (saveTimeoutRef.current != null) clearTimeout(saveTimeoutRef.current);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, []);

  const commitLayoutChange = useCallback(
    (updatedPanels: ResolvedPanel[]) => {
      // Delegate ALL persistence to the parent (LayoutBuilder.handleLayoutChange)
      // which has fresh pageLayout data and bumps the version counter.
      // Previously this function also saved to localStorage directly using a stale
      // pageLayout closure, which caused fields like tabOrientation to be lost
      // because the stale write would overwrite the parent's correct write.
      onLayoutChange(updatedPanels);
    },
    [onLayoutChange],
  );

  const getEffectivePosition = useCallback(
    (panel: ResolvedPanel) => {
      const local = localPositions[panel.definition.id];
      if (local) return local;
      return {
        x: panel.layout.x,
        y: panel.layout.y,
        width: resolveWidth(panel.layout.width, containerWidth),
        height: panel.layout.height,
      };
    },
    [localPositions, containerWidth],
  );

  const handlePanelSelect = useCallback(
    (panelId: string) => {
      setSelectedPanelId(panelId);
    },
    [],
  );

  const handlePointerDown = useCallback(
    (e: React.PointerEvent, panelId: string, mode: DragMode) => {
      e.preventDefault();
      e.stopPropagation();

      const panel = resolvedPanels.find((p) => p.definition.id === panelId);
      if (!panel) return;

      const isLocked = panel.definition.locked === true || panel.layout.runtimeLocked === true;
      if (isLocked) return;

      const pos = getEffectivePosition(panel);

      dragStateRef.current = {
        mode,
        panelId,
        startPointerX: e.clientX,
        startPointerY: e.clientY,
        startX: pos.x,
        startY: pos.y,
        startWidth: pos.width,
        startHeight: pos.height,
      };

      setDraggingPanelId(panelId);
      setSelectedPanelId(panelId);
      document.body.style.cursor = mode === 'move' ? 'grabbing' : mode === 'resize-e' ? 'ew-resize' : mode === 'resize-s' ? 'ns-resize' : 'se-resize';
      document.body.style.userSelect = 'none';

      // Capture pointer for smooth tracking outside element bounds
      (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    },
    [resolvedPanels, getEffectivePosition],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      const state = dragStateRef.current;
      if (!state) return;

      e.preventDefault();

      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);

      rafRef.current = requestAnimationFrame(() => {
        const deltaX = e.clientX - state.startPointerX;
        const deltaY = e.clientY - state.startPointerY;

        const panel = resolvedPanels.find((p) => p.definition.id === state.panelId);
        const snapEnabled = panel?.layout.snapToGrid !== false;

        if (state.mode === 'move') {
          const newX = snapValue(state.startX + deltaX, snapGridSize, snapEnabled);
          const newY = snapValue(state.startY + deltaY, snapGridSize, snapEnabled);

          setLocalPositions((prev) => ({
            ...prev,
            [state.panelId]: {
              x: Math.max(0, newX),
              y: Math.max(0, newY),
              width: state.startWidth,
              height: state.startHeight,
            },
          }));
        } else {
          // Resize modes
          let newWidth = state.startWidth;
          let newHeight = state.startHeight;

          if (state.mode === 'resize-e' || state.mode === 'resize-se') {
            newWidth = snapValue(state.startWidth + deltaX, snapGridSize, snapEnabled);
            newWidth = clampDimension(
              newWidth,
              panel?.definition.minWidth ?? panel?.layout.minWidth,
              panel?.definition.maxWidth ?? panel?.layout.maxWidth,
            );
          }

          if (state.mode === 'resize-s' || state.mode === 'resize-se') {
            newHeight = snapValue(state.startHeight + deltaY, snapGridSize, snapEnabled);
            newHeight = clampDimension(
              newHeight,
              panel?.definition.minHeight ?? panel?.layout.minHeight,
              panel?.definition.maxHeight ?? panel?.layout.maxHeight,
            );
          }

          const pos = getEffectivePosition(panel!);
          setLocalPositions((prev) => ({
            ...prev,
            [state.panelId]: {
              x: pos.x,
              y: pos.y,
              width: newWidth,
              height: newHeight,
            },
          }));
        }
      });
    },
    [resolvedPanels, snapGridSize, getEffectivePosition],
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent) => {
      const state = dragStateRef.current;
      if (!state) return;

      e.preventDefault();

      if (rafRef.current != null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }

      const localPos = localPositions[state.panelId];
      if (localPos) {
        const updated = resolvedPanels.map((rp) => {
          if (rp.definition.id !== state.panelId) return rp;
          return {
            ...rp,
            layout: {
              ...rp.layout,
              x: localPos.x,
              y: localPos.y,
              width: localPos.width,
              height: localPos.height,
            },
          };
        });
        // Commit immediately (saves to localStorage via debounce)
        // Do NOT clear localPositions here — let the parent re-render with
        // the new resolvedPanels data, which will naturally replace local overrides
        commitLayoutChange(updated);
      }

      dragStateRef.current = null;
      setDraggingPanelId(null);
      // Clear local positions AFTER commit so the visual update is seamless
      // The parent's resolvedPanels will update via onLayoutChange → usePagePanels re-read
      setLocalPositions((prev) => {
        const next = { ...prev };
        delete next[state.panelId];
        return next;
      });
      document.body.style.cursor = '';
      document.body.style.userSelect = '';

      // Release pointer capture
      (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
    },
    [localPositions, resolvedPanels, commitLayoutChange],
  );

  // Handle per-panel layout changes from PanelWrapper controls
  const handlePanelLayoutChange = useCallback(
    (panelId: string, updates: Partial<PanelLayout>) => {
      const updated = resolvedPanels.map((rp) => {
        if (rp.definition.id !== panelId) return rp;
        return {
          ...rp,
          layout: { ...rp.layout, ...updates },
        };
      });
      // Delegate persistence to LayoutBuilder.handleLayoutChange which has
      // fresh pageLayout data and bumps the version counter for re-read
      commitLayoutChange(updated);
    },
    [resolvedPanels, commitLayoutChange],
  );

  // Compute max z-index for selected/dragged panel elevation
  const maxZIndex = Math.max(0, ...visiblePanels.map((p) => p.layout.zIndex ?? 0));

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
            <PanelWrapper
              definition={definition}
              layout={layout}
              isEditMode={true}
              onPanelLayoutChange={handlePanelLayoutChange}
            />
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
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      <GridOverlay snapGridSize={snapGridSize} />

      {visiblePanels.map(({ definition, layout }) => {
        const pos = getEffectivePosition({ definition, layout });
        const isSelected = selectedPanelId === definition.id;
        const isDragging = draggingPanelId === definition.id;
        const zIndex = isDragging || isSelected ? maxZIndex + 10 : (layout.zIndex ?? 0);

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
              width: pos.width,
              height: pos.height,
              zIndex,
              transform: `translate3d(${pos.x}px, ${pos.y}px, 0)`,
              willChange: isDragging ? 'transform' : 'auto',
              outline: isSelected ? '2px solid' : 'none',
              outlineColor: theme.palette.secondary.main,
              outlineOffset: -1,
              cursor: 'default',
            }}
            style={styleOverrides}
            onPointerDown={(e) => {
              // Only select on click, not on drag handle or resize zones
              if ((e.target as HTMLElement).closest('.panel-drag-handle')) {
                handlePointerDown(e, definition.id, 'move');
              } else {
                handlePanelSelect(definition.id);
              }
            }}
          >
            <PanelWrapper
              definition={definition}
              layout={{
                ...layout,
                width: pos.width,
                height: pos.height,
              }}
              isEditMode={true}
              onPanelLayoutChange={handlePanelLayoutChange}
            />

            {/* Resize handles for non-locked panels */}
            {!(definition.locked || layout.runtimeLocked) && (
              <>
                {/* East resize handle */}
                <Box
                  onPointerDown={(e) => handlePointerDown(e, definition.id, 'resize-e')}
                  sx={{
                    position: 'absolute',
                    top: 0,
                    right: -4,
                    width: 8,
                    height: '100%',
                    cursor: 'ew-resize',
                    zIndex: 10,
                    '&:hover': { bgcolor: 'rgba(0, 188, 160, 0.15)' },
                  }}
                />
                {/* South resize handle */}
                <Box
                  onPointerDown={(e) => handlePointerDown(e, definition.id, 'resize-s')}
                  sx={{
                    position: 'absolute',
                    bottom: -4,
                    left: 0,
                    width: '100%',
                    height: 8,
                    cursor: 'ns-resize',
                    zIndex: 10,
                    '&:hover': { bgcolor: 'rgba(0, 188, 160, 0.15)' },
                  }}
                />
                {/* Southeast resize handle */}
                <Box
                  onPointerDown={(e) => handlePointerDown(e, definition.id, 'resize-se')}
                  sx={{
                    position: 'absolute',
                    bottom: -4,
                    right: -4,
                    width: 20,
                    height: 20,
                    cursor: 'se-resize',
                    zIndex: 11,
                    borderRadius: '0 0 4px 0',
                    '&:hover': { bgcolor: 'rgba(0, 188, 160, 0.2)' },
                    '&::after': {
                      content: '""',
                      position: 'absolute',
                      right: 4,
                      bottom: 4,
                      width: 8,
                      height: 8,
                      borderRight: '2px solid rgba(0, 188, 160, 0.6)',
                      borderBottom: '2px solid rgba(0, 188, 160, 0.6)',
                      pointerEvents: 'none',
                    },
                  }}
                />
              </>
            )}
          </Box>
        );
      })}
    </Box>
  );
});
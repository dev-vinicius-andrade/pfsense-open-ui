import React, { Suspense, useState, useCallback, useRef, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Skeleton,
  IconButton,
  Tooltip,
  Menu,
  MenuItem,
  Divider,
} from '@mui/material';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import SettingsIcon from '@mui/icons-material/Settings';
import LockIcon from '@mui/icons-material/Lock';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import AspectRatioIcon from '@mui/icons-material/AspectRatio';
import GridOnIcon from '@mui/icons-material/GridOn';
import type { PanelDefinition, PanelLayout } from './types';

interface PanelWrapperProps {
  definition: PanelDefinition;
  layout: PanelLayout;
  isEditMode: boolean;
  /** Callback when per-panel layout changes (resize presets, lock, etc.) */
  onPanelLayoutChange?: (panelId: string, updates: Partial<PanelLayout>) => void;
  /** Grid configuration for custom resize calculations */
  gridConfig?: {
    columns: number;
    rowHeight: number;
    margin: [number, number];
  };
  children?: React.ReactNode;
}

/** Preset size options shown in the per-panel menu */
const SIZE_PRESETS = [
  { label: 'Small', w: 3, h: 3 },
  { label: 'Medium', w: 4, h: 4 },
  { label: 'Large', w: 6, h: 5 },
  { label: 'Full Width', w: 12, h: 4 },
] as const;

type ResizeDirection = 'e' | 's' | 'se';

interface ResizeState {
  direction: ResizeDirection;
  startX: number;
  startY: number;
  startW: number;
  startH: number;
}

function PanelSkeletonFallback() {
  return (
    <Box sx={{ p: 2, height: '100%' }}>
      <Skeleton variant="text" width="60%" />
      <Skeleton variant="rectangular" height={100} sx={{ mt: 1 }} />
    </Box>
  );
}

export const PanelWrapper = React.memo(function PanelWrapper({
  definition,
  layout,
  isEditMode,
  onPanelLayoutChange,
  gridConfig,
}: PanelWrapperProps) {
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [activeResize, setActiveResize] = useState<ResizeDirection | null>(null);
  const resizeStateRef = useRef<ResizeState | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const handleMenuOpen = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    setMenuAnchor(e.currentTarget);
  }, []);

  const handleMenuClose = useCallback(() => {
    setMenuAnchor(null);
  }, []);

  const handlePresetClick = useCallback(
    (w: number, h: number) => {
      onPanelLayoutChange?.(definition.id, { w, h });
      handleMenuClose();
    },
    [definition.id, onPanelLayoutChange, handleMenuClose],
  );

  const handleToggleLock = useCallback(() => {
    const currentLocked = layout.runtimeLocked === true;
    onPanelLayoutChange?.(definition.id, {
      runtimeLocked: !currentLocked,
    });
    handleMenuClose();
  }, [definition.id, layout, onPanelLayoutChange, handleMenuClose]);

  const handleSnapToggle = useCallback(() => {
    const currentSnap = layout.snapToGrid !== false;
    onPanelLayoutChange?.(definition.id, {
      snapToGrid: !currentSnap,
    });
    handleMenuClose();
  }, [definition.id, layout, onPanelLayoutChange, handleMenuClose]);

  // Custom resize mouse handlers
  const handleResizeStart = useCallback(
    (direction: ResizeDirection) => (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      if (!gridConfig || !onPanelLayoutChange) return;

      const isLocked = definition.locked === true || layout.runtimeLocked === true;
      if (isLocked) return;

      resizeStateRef.current = {
        direction,
        startX: e.clientX,
        startY: e.clientY,
        startW: layout.w,
        startH: layout.h,
      };

      setActiveResize(direction);

      // Prevent text selection during drag
      document.body.style.userSelect = 'none';
      document.body.style.cursor =
        direction === 'e' ? 'ew-resize' : direction === 's' ? 'ns-resize' : 'se-resize';

      const handleMouseMove = (moveEvent: MouseEvent) => {
        const state = resizeStateRef.current;
        if (!state) return;

        const deltaX = moveEvent.clientX - state.startX;
        const deltaY = moveEvent.clientY - state.startY;

        // Use the LayoutBuilder container width, not the panel's own parent
        // which shrinks as the panel resizes. Walk up to find the grid container.
        const gridContainer = wrapperRef.current?.closest('.react-grid-layout') ?? wrapperRef.current?.parentElement;
        const colWidth =
          ((gridContainer as HTMLElement)?.clientWidth ?? 800) / gridConfig.columns;
        const rowPx = gridConfig.rowHeight + gridConfig.margin[1];

        let newW = state.startW;
        let newH = state.startH;

        if (direction === 'e' || direction === 'se') {
          const rawDeltaCols = deltaX / colWidth;
          newW = state.startW + Math.round(rawDeltaCols);
        }

        if (direction === 's' || direction === 'se') {
          const rawDeltaRows = deltaY / rowPx;
          newH = state.startH + Math.round(rawDeltaRows);
        }

        // Apply min/max constraints
        const minW = definition.minWidth ?? layout.minW ?? 1;
        const minH = definition.minHeight ?? layout.minH ?? 1;
        const maxW = layout.maxW ?? gridConfig.columns;
        const maxH = layout.maxH ?? 100;

        newW = Math.max(minW, Math.min(maxW, newW));
        newH = Math.max(minH, Math.min(maxH, newH));

        // Ensure panel doesn't exceed grid bounds
        newW = Math.min(newW, gridConfig.columns - layout.x);

        if (newW !== layout.w || newH !== layout.h) {
          onPanelLayoutChange(definition.id, { w: newW, h: newH });
        }
      };

      const handleMouseUp = () => {
        resizeStateRef.current = null;
        setActiveResize(null);
        document.body.style.userSelect = '';
        document.body.style.cursor = '';
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    },
    [definition, layout, gridConfig, onPanelLayoutChange],
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    };
  }, []);

  if (!layout.visible) return null;

  const PanelComponent = definition.component;
  const isDefLocked = definition.locked === true;
  const isRuntimeLocked = layout.runtimeLocked === true;
  const isLocked = isDefLocked || isRuntimeLocked;
  const snapEnabled = layout.snapToGrid !== false;
  const canResize = isEditMode && !isLocked && gridConfig != null;

  // Locked navigation panels render without Paper chrome for seamless integration
  if (isDefLocked && !isEditMode) {
    return (
      <Box sx={{ height: '100%' }}>
        <Suspense fallback={<PanelSkeletonFallback />}>
          <PanelComponent panelId={definition.id} />
        </Suspense>
      </Box>
    );
  }

  return (
    <Box ref={wrapperRef} sx={{ position: 'relative', height: '100%', width: '100%' }}>
      <Paper
        elevation={isEditMode ? 2 : 1}
        sx={{
          height: '100%',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          border: isEditMode ? '2px dashed' : '1px solid',
          borderColor:
            activeResize != null ? 'secondary.main' : isEditMode ? 'primary.main' : 'divider',
          borderRadius: 2,
          transition: 'border-color 200ms ease, box-shadow 200ms ease',
          position: 'relative',
        }}
      >
        {/* Panel Header */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            px: 1.5,
            py: 0.75,
            borderBottom: '1px solid',
            borderColor: 'divider',
            bgcolor: 'action.hover',
            gap: 1,
            cursor: isEditMode ? 'grab' : 'default',
            '&:active': isEditMode ? { cursor: 'grabbing' } : {},
          }}
          className={isEditMode ? 'panel-drag-handle' : ''}
        >
          {isEditMode && <DragIndicatorIcon fontSize="small" color="action" />}
          <Typography variant="subtitle2" sx={{ flexGrow: 1, fontWeight: 600 }}>
            {definition.title}
          </Typography>

          {/* Per-panel controls in edit mode */}
          {isEditMode && (
            <>
              <Tooltip title={isLocked ? 'Unlock panel' : 'Lock panel'}>
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!isDefLocked) handleToggleLock();
                  }}
                  disabled={isDefLocked}
                  aria-label={isLocked ? 'unlock panel' : 'lock panel'}
                >
                  {isLocked ? (
                    <LockIcon fontSize="small" color={isDefLocked ? 'disabled' : 'action'} />
                  ) : (
                    <LockOpenIcon fontSize="small" color="action" />
                  )}
                </IconButton>
              </Tooltip>

              <Tooltip title="Panel settings">
                <IconButton
                  size="small"
                  onClick={handleMenuOpen}
                  aria-label="panel settings"
                  aria-controls={menuAnchor ? 'panel-settings-menu' : undefined}
                  aria-haspopup="true"
                >
                  <SettingsIcon fontSize="small" color="action" />
                </IconButton>
              </Tooltip>

              {!isLocked && (
                <Tooltip title="Hide panel">
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      onPanelLayoutChange?.(definition.id, { visible: false });
                    }}
                    aria-label="hide panel"
                  >
                    <VisibilityOffIcon fontSize="small" color="action" />
                  </IconButton>
                </Tooltip>
              )}

              <Menu
                id="panel-settings-menu"
                anchorEl={menuAnchor}
                open={Boolean(menuAnchor)}
                onClose={handleMenuClose}
                onClick={(e) => e.stopPropagation()}
                slotProps={{ paper: { sx: { minWidth: 180 } } }}
              >
                <MenuItem disabled>
                  <Typography variant="caption" color="text.secondary">
                    Size Presets
                  </Typography>
                </MenuItem>
                {SIZE_PRESETS.map((preset) => (
                  <MenuItem
                    key={preset.label}
                    onClick={() => handlePresetClick(preset.w, preset.h)}
                    disabled={isLocked}
                  >
                    <AspectRatioIcon fontSize="small" sx={{ mr: 1 }} />
                    {preset.label} ({preset.w}x{preset.h})
                  </MenuItem>
                ))}
                <Divider />
                <MenuItem onClick={handleSnapToggle} disabled={isLocked}>
                  <GridOnIcon
                    fontSize="small"
                    sx={{ mr: 1, color: snapEnabled ? 'primary.main' : 'action.disabled' }}
                  />
                  Snap to Grid: {snapEnabled ? 'On' : 'Off'}
                </MenuItem>
                {!isDefLocked && (
                  <MenuItem onClick={handleToggleLock}>
                    {isRuntimeLocked ? (
                      <>
                        <LockOpenIcon fontSize="small" sx={{ mr: 1 }} />
                        Unlock Panel
                      </>
                    ) : (
                      <>
                        <LockIcon fontSize="small" sx={{ mr: 1 }} />
                        Lock Panel
                      </>
                    )}
                  </MenuItem>
                )}
              </Menu>
            </>
          )}
        </Box>

        {/* Panel Content */}
        <Box sx={{ flexGrow: 1, overflow: 'auto', position: 'relative' }}>
          {/* Edit mode overlay to disable interactions while dragging */}
          {isEditMode && (
            <Box
              sx={{
                position: 'absolute',
                inset: 0,
                zIndex: 1,
                bgcolor: 'transparent',
              }}
            />
          )}
          <Suspense fallback={<PanelSkeletonFallback />}>
            <PanelComponent panelId={definition.id} />
          </Suspense>
        </Box>
      </Paper>

      {/* Custom resize zones — positioned outside the Paper to avoid overflow clipping */}
      {canResize && (
        <>
          {/* East edge resize zone */}
          <Box
            onMouseDown={handleResizeStart('e')}
            sx={{
              position: 'absolute',
              top: 0,
              right: -4,
              width: 8,
              height: '100%',
              cursor: 'ew-resize',
              zIndex: 10,
              bgcolor: activeResize === 'e' ? 'rgba(0, 188, 160, 0.3)' : 'transparent',
              '&:hover': {
                bgcolor: 'rgba(0, 188, 160, 0.15)',
              },
            }}
          />

          {/* South edge resize zone */}
          <Box
            onMouseDown={handleResizeStart('s')}
            sx={{
              position: 'absolute',
              bottom: -4,
              left: 0,
              width: '100%',
              height: 8,
              cursor: 'ns-resize',
              zIndex: 10,
              bgcolor: activeResize === 's' ? 'rgba(0, 188, 160, 0.3)' : 'transparent',
              '&:hover': {
                bgcolor: 'rgba(0, 188, 160, 0.15)',
              },
            }}
          />

          {/* Southeast corner resize zone */}
          <Box
            onMouseDown={handleResizeStart('se')}
            sx={{
              position: 'absolute',
              bottom: -4,
              right: -4,
              width: 20,
              height: 20,
              cursor: 'se-resize',
              zIndex: 11,
              bgcolor: activeResize === 'se' ? 'rgba(0, 188, 160, 0.4)' : 'transparent',
              borderRadius: '0 0 4px 0',
              '&:hover': {
                bgcolor: 'rgba(0, 188, 160, 0.2)',
              },
              // Visual grip indicator
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
});
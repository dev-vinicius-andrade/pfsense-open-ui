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
  ListSubheader,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import SettingsIcon from '@mui/icons-material/Settings';
import LockIcon from '@mui/icons-material/Lock';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import AspectRatioIcon from '@mui/icons-material/AspectRatio';
import GridOnIcon from '@mui/icons-material/GridOn';
import FitScreenIcon from '@mui/icons-material/FitScreen';
import HeightIcon from '@mui/icons-material/Height';
import AlignHorizontalLeftIcon from '@mui/icons-material/AlignHorizontalLeft';
import ViewColumnIcon from '@mui/icons-material/ViewColumn';
import TableRowsIcon from '@mui/icons-material/TableRows';
import type { PanelDefinition, PanelLayout, PageLayout } from './types';

interface PanelWrapperProps {
  definition: PanelDefinition;
  layout: PanelLayout;
  isEditMode: boolean;
  /** Page-level canvas layout for snap grid size during resize */
  pageLayout?: PageLayout;
  /** Callback when per-panel layout changes (resize presets, lock, etc.) */
  onPanelLayoutChange?: (panelId: string, updates: Partial<PanelLayout>) => void;
  children?: React.ReactNode;
}

/** Preset size options shown in the per-panel menu (pixel-based) */
const SIZE_PRESETS = [
  { label: 'Small', width: 300, height: 240 },
  { label: 'Medium', width: 480, height: 320 },
  { label: 'Large', width: 720, height: 400 },
  { label: 'Full Width', width: '100%', height: 320 },
] as const;

type ResizeDirection = 'e' | 's' | 'se';

interface ResizeState {
  direction: ResizeDirection;
  startX: number;
  startY: number;
  startWidth: number;
  startHeight: number;
}

/** Resolve a width value that may be a percentage string to a pixel number using a container reference. */
function resolvePixelWidth(width: number | string, containerWidth: number): number {
  if (typeof width === 'number') return width;
  if (typeof width === 'string' && width.endsWith('%')) {
    const pct = parseFloat(width);
    return Number.isFinite(pct) ? (pct / 100) * containerWidth : containerWidth;
  }
  return containerWidth;
}

/** Snap a pixel value to the nearest grid increment. */
function snapToGrid(value: number, gridSize: number): number {
  if (gridSize <= 0) return value;
  return Math.round(value / gridSize) * gridSize;
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
  pageLayout,
  onPanelLayoutChange,
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
    (width: number | string, height: number) => {
      onPanelLayoutChange?.(definition.id, { width, height });
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

  const handleFitWidth = useCallback(() => {
    onPanelLayoutChange?.(definition.id, { x: 0, width: '100%' });
    handleMenuClose();
  }, [definition.id, onPanelLayoutChange, handleMenuClose]);

  const handleFitHeight = useCallback(() => {
    onPanelLayoutChange?.(definition.id, { height: 400 });
    handleMenuClose();
  }, [definition.id, onPanelLayoutChange, handleMenuClose]);

  const handleAlignLeft = useCallback(() => {
    onPanelLayoutChange?.(definition.id, { x: 0 });
    handleMenuClose();
  }, [definition.id, onPanelLayoutChange, handleMenuClose]);

  // Custom resize mouse handlers — direct pixel math
  const handleResizeStart = useCallback(
    (direction: ResizeDirection) => (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      if (!onPanelLayoutChange) return;

      const isLocked = definition.locked === true || layout.runtimeLocked === true;
      if (isLocked) return;

      const containerWidth = wrapperRef.current?.clientWidth ?? 800;
      const currentWidthPx = resolvePixelWidth(layout.width, containerWidth);

      resizeStateRef.current = {
        direction,
        startX: e.clientX,
        startY: e.clientY,
        startWidth: currentWidthPx,
        startHeight: layout.height,
      };

      setActiveResize(direction);

      // Prevent text selection during drag
      document.body.style.userSelect = 'none';
      document.body.style.cursor =
        direction === 'e' ? 'ew-resize' : direction === 's' ? 'ns-resize' : 'se-resize';

      const snapEnabled = layout.snapToGrid !== false;
      const gridSize = snapEnabled ? (pageLayout?.snapGridSize ?? 16) : 1;

      const minW = definition.minWidth ?? layout.minWidth ?? 100;
      const minH = definition.minHeight ?? layout.minHeight ?? 60;
      const maxW = definition.maxWidth ?? layout.maxWidth ?? Infinity;
      const maxH = definition.maxHeight ?? layout.maxHeight ?? Infinity;

      const handleMouseMove = (moveEvent: MouseEvent) => {
        const state = resizeStateRef.current;
        if (!state) return;

        const deltaX = moveEvent.clientX - state.startX;
        const deltaY = moveEvent.clientY - state.startY;

        let newWidth = state.startWidth;
        let newHeight = state.startHeight;

        if (direction === 'e' || direction === 'se') {
          newWidth = state.startWidth + deltaX;
        }

        if (direction === 's' || direction === 'se') {
          newHeight = state.startHeight + deltaY;
        }

        // Apply snap-to-grid
        newWidth = snapToGrid(newWidth, gridSize);
        newHeight = snapToGrid(newHeight, gridSize);

        // Clamp to min/max constraints
        newWidth = Math.max(minW, Math.min(maxW, newWidth));
        newHeight = Math.max(minH, Math.min(maxH, newHeight));

        // Only emit when values actually changed
        const currentWidthPx = resolvePixelWidth(layout.width, containerWidth);
        if (newWidth !== currentWidthPx || newHeight !== layout.height) {
          onPanelLayoutChange(definition.id, { width: newWidth, height: newHeight });
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
    [definition, layout, pageLayout, onPanelLayoutChange],
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
  const canResize = isEditMode && !isLocked;

  // Locked navigation panels render without Paper chrome in read-only mode for seamless integration.
  // In edit mode, they still get the full header so users can access layout settings (e.g. tab orientation).
  if (isDefLocked && !isEditMode) {
    return (
      <Box sx={{ height: '100%' }}>
        <Suspense fallback={<PanelSkeletonFallback />}>
          {/* @ts-expect-error layout is passed for panels that accept it (e.g. InterfaceTabsPanel reads tabOrientation) */}
          <PanelComponent panelId={definition.id} layout={layout} />
        </Suspense>
      </Box>
    );
  }

  // Resolve style overrides from layout and definition defaults
  const effectiveBgColor = layout.bgColor ?? definition.defaultStyle?.bgColor;
  const effectiveBorderColor = layout.borderColor ?? definition.defaultStyle?.borderColor;
  const effectiveBorderRadius = layout.borderRadius ?? definition.defaultStyle?.borderRadius;
  const effectiveHeaderBgColor = layout.headerBgColor ?? definition.defaultStyle?.headerBgColor;
  const effectiveTextColor = layout.textColor ?? definition.defaultStyle?.textColor;

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
            activeResize != null
              ? 'secondary.main'
              : effectiveBorderColor ?? (isEditMode ? 'primary.main' : 'divider'),
          borderRadius: effectiveBorderRadius != null ? `${effectiveBorderRadius}px` : 2,
          bgcolor: effectiveBgColor ?? undefined,
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
            bgcolor: effectiveHeaderBgColor ?? 'action.hover',
            gap: 1,
            cursor: isEditMode ? 'grab' : 'default',
            '&:active': isEditMode ? { cursor: 'grabbing' } : {},
          }}
          className={isEditMode ? 'panel-drag-handle' : ''}
        >
          {isEditMode && <DragIndicatorIcon fontSize="small" color="action" />}
          <Typography
            variant="subtitle2"
            sx={{
              flexGrow: 1,
              fontWeight: 600,
              color: effectiveTextColor ?? undefined,
            }}
          >
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
                    onClick={() => handlePresetClick(preset.width, preset.height)}
                    disabled={isLocked}
                  >
                    <AspectRatioIcon fontSize="small" sx={{ mr: 1 }} />
                    {preset.label} ({String(preset.width)}x{preset.height})
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
                <Divider />
                <ListSubheader>Layout</ListSubheader>
                <MenuItem onClick={handleFitWidth} disabled={isRuntimeLocked} aria-label="fit panel width to container">
                  <ListItemIcon>
                    <FitScreenIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText primary="Fit Width" />
                </MenuItem>
                <MenuItem onClick={handleFitHeight} disabled={isRuntimeLocked} aria-label="fit panel height to standard size">
                  <ListItemIcon>
                    <HeightIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText primary="Fit Height" />
                </MenuItem>
                <MenuItem onClick={handleAlignLeft} disabled={isRuntimeLocked} aria-label="align panel to left edge">
                  <ListItemIcon>
                    <AlignHorizontalLeftIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText primary="Align Left" />
                </MenuItem>
                <Divider />
                <ListSubheader>Tab Orientation</ListSubheader>
                {(['top', 'bottom', 'left', 'right'] as const).map((o) => (
                  <MenuItem
                    key={o}
                    selected={layout.tabOrientation === o}
                    onClick={() => {
                      onPanelLayoutChange?.(definition.id, { tabOrientation: o });
                      handleMenuClose();
                    }}
                    disabled={isRuntimeLocked}
                  >
                    <ListItemIcon>
                      {o === 'left' || o === 'right' ? (
                        <ViewColumnIcon fontSize="small" />
                      ) : (
                        <TableRowsIcon fontSize="small" />
                      )}
                    </ListItemIcon>
                    <ListItemText primary={`${o.charAt(0).toUpperCase() + o.slice(1)}`} />
                  </MenuItem>
                ))}
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
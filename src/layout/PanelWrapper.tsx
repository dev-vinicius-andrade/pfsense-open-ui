import React, { Suspense, useState, useCallback } from 'react';
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
import UnfoldMoreIcon from '@mui/icons-material/UnfoldMore';
import GridOnIcon from '@mui/icons-material/GridOn';
import type { PanelDefinition, PanelLayout } from './types';

interface PanelWrapperProps {
  definition: PanelDefinition;
  layout: PanelLayout;
  isEditMode: boolean;
  /** Callback when per-panel layout changes (resize presets, lock, etc.) */
  onPanelLayoutChange?: (panelId: string, updates: Partial<PanelLayout>) => void;
  children?: React.ReactNode;
}

/** Preset size options shown in the per-panel menu */
const SIZE_PRESETS = [
  { label: 'Small', w: 3, h: 3 },
  { label: 'Medium', w: 4, h: 4 },
  { label: 'Large', w: 6, h: 5 },
  { label: 'Full Width', w: 12, h: 4 },
] as const;

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
}: PanelWrapperProps) {
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);

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
    // Toggle a runtime lock stored in layout (separate from definition.locked)
    const currentLocked = (layout as Record<string, unknown>).runtimeLocked === true;
    onPanelLayoutChange?.(definition.id, {
      // We store runtime lock as an extra field; migration not needed since it's optional UI state
      ...({ runtimeLocked: !currentLocked } as Partial<PanelLayout>),
    });
    handleMenuClose();
  }, [definition.id, layout, onPanelLayoutChange, handleMenuClose]);

  const handleSnapToggle = useCallback(() => {
    const currentSnap = (layout as Record<string, unknown>).snapToGrid !== false;
    onPanelLayoutChange?.(definition.id, {
      ...({ snapToGrid: !currentSnap } as Partial<PanelLayout>),
    });
    handleMenuClose();
  }, [definition.id, layout, onPanelLayoutChange, handleMenuClose]);

  if (!layout.visible) return null;

  const PanelComponent = definition.component;
  const isDefLocked = definition.locked === true;
  const isRuntimeLocked = (layout as Record<string, unknown>).runtimeLocked === true;
  const isLocked = isDefLocked || isRuntimeLocked;
  const snapEnabled = (layout as Record<string, unknown>).snapToGrid !== false;

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
    <Paper
      elevation={isEditMode ? 2 : 1}
      sx={{
        height: '100%',
        overflow: isEditMode ? 'visible' : 'hidden',
        display: 'flex',
        flexDirection: 'column',
        border: isEditMode ? '2px dashed' : '1px solid',
        borderColor: isEditMode ? 'primary.main' : 'divider',
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
  );
});
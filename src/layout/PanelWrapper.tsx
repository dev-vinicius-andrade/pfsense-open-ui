import React, { Suspense } from 'react';
import { Box, Typography, Paper, Skeleton } from '@mui/material';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import type { PanelDefinition, PanelLayout } from './types';

interface PanelWrapperProps {
  definition: PanelDefinition;
  layout: PanelLayout;
  isEditMode: boolean;
  children?: React.ReactNode;
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
}: PanelWrapperProps) {
  if (!layout.visible) return null;

  const PanelComponent = definition.component;

  return (
    <Paper
      elevation={isEditMode ? 2 : 1}
      sx={{
        height: '100%',
        overflow: 'hidden',
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
        {isEditMode && !definition.locked && (
          <VisibilityOffIcon fontSize="small" color="action" sx={{ cursor: 'pointer' }} />
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

      {/* Resize handle (edit mode only) */}
      {isEditMode && (
        <Box
          sx={{
            position: 'absolute',
            bottom: 0,
            right: 0,
            width: 16,
            height: 16,
            cursor: 'se-resize',
            zIndex: 2,
            '&::after': {
              content: '""',
              position: 'absolute',
              bottom: 4,
              right: 4,
              width: 8,
              height: 8,
              borderRight: '2px solid',
              borderBottom: '2px solid',
              borderColor: 'text.disabled',
            },
          }}
          className="panel-resize-handle"
        />
      )}
    </Paper>
  );
});
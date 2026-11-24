import { memo } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Box, Card, CardHeader, IconButton, Typography } from '@mui/material';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';

interface DraggableWidgetProps {
  id: string;
  title: string;
  children: React.ReactNode;
  isEditMode: boolean;
}

export const DraggableWidget = memo(function DraggableWidget({
  id,
  title,
  children,
  isEditMode,
}: DraggableWidgetProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, disabled: !isEditMode });

  if (!isEditMode) {
    return (
      <Box sx={{ mb: 3 }}>
        {children}
      </Box>
    );
  }

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1000 : 'auto',
  };

  return (
    <Box ref={setNodeRef} style={style} sx={{ mb: 3 }}>
      <Card
        elevation={isDragging ? 8 : 1}
        sx={{
          border: '2px dashed',
          borderColor: isDragging ? 'primary.main' : 'divider',
          boxShadow: isDragging ? 6 : 1,
        }}
      >
        <CardHeader
          title={
            <Typography variant="subtitle2" color="text.secondary">
              {title}
            </Typography>
          }
          action={
            <IconButton
              size="small"
              aria-label={`Drag ${title}`}
              {...attributes}
              {...listeners}
              sx={{ cursor: 'grab', '&:active': { cursor: 'grabbing' } }}
            >
              <DragIndicatorIcon fontSize="small" />
            </IconButton>
          }
          sx={{ py: 0.5, px: 1 }}
        />
        <Box sx={{ p: 0 }}>
          {children}
        </Box>
      </Card>
    </Box>
  );
});
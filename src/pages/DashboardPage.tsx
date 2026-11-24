import { useState, useCallback, useMemo } from 'react';
import {
  DndContext,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  DragOverlay,
  closestCenter,
} from '@dnd-kit/core';
import {
  SortableContext,
  rectSortingStrategy,
  arrayMove,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';
import { Box, Typography, Button, Alert } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import CheckIcon from '@mui/icons-material/Check';
import { PageHeader } from '@/components/shared/PageHeader';
import { useVisibleWidgets, saveDashboardLayout } from './dashboard/useDashboardLayout';
import { DraggableWidget } from './dashboard/DraggableWidget';
import type { ResolvedWidget } from './dashboard/useDashboardLayout';
import type { DragEndEvent } from '@dnd-kit/core';

const CATEGORY_LABELS: Record<string, string> = {
  system: 'System',
  network: 'Network',
  services: 'Services',
  security: 'Security',
  custom: 'Custom Widgets',
};

function WidgetContent({ widget }: { widget: ResolvedWidget }) {
  const Component = widget.component;
  return <Component />;
}

interface FlatItem {
  type: 'widget' | 'divider';
  id: string;
  widget?: ResolvedWidget;
  category?: string;
  label?: string;
}

function buildFlatItems(widgets: ResolvedWidget[]): FlatItem[] {
  const items: FlatItem[] = [];
  let lastCategory: string | null = null;

  for (const widget of widgets) {
    if (widget.category !== lastCategory) {
      items.push({
        type: 'divider',
        id: `divider-${widget.category}`,
        category: widget.category,
        label: CATEGORY_LABELS[widget.category] ?? widget.category,
      });
      lastCategory = widget.category;
    }
    items.push({
      type: 'widget',
      id: widget.id,
      widget,
    });
  }

  return items;
}

export function DashboardPage() {
  const visibleWidgets = useVisibleWidgets();
  const [isEditMode, setIsEditMode] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const flatItems = useMemo(() => buildFlatItems(visibleWidgets), [visibleWidgets]);
  const sortableIds = useMemo(
    () => flatItems.filter((item) => item.type === 'widget').map((item) => item.id),
    [flatItems],
  );

  const handleDragStart = useCallback((event: { active: { id: string | number } }) => {
    setActiveId(String(event.active.id));
  }, []);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setActiveId(null);
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      const oldIndex = sortableIds.indexOf(String(active.id));
      const newIndex = sortableIds.indexOf(String(over.id));
      if (oldIndex === -1 || newIndex === -1) return;

      const reordered = arrayMove(sortableIds, oldIndex, newIndex);
      const updatedWidgets = reordered.map((id, index) => {
        const widget = visibleWidgets.find((w) => w.id === id);
        if (!widget) return null;
        return { ...widget, order: index };
      }).filter((w): w is ResolvedWidget => w !== null);

      saveDashboardLayout(updatedWidgets);
    },
    [sortableIds, visibleWidgets],
  );

  const handleDragCancel = useCallback(() => {
    setActiveId(null);
  }, []);

  const toggleEditMode = useCallback(() => {
    setIsEditMode((prev) => !prev);
    setActiveId(null);
  }, []);

  const activeWidget = activeId
    ? visibleWidgets.find((w) => w.id === activeId)
    : null;

  const headerActions = (
    <Button
      variant={isEditMode ? 'contained' : 'outlined'}
      startIcon={isEditMode ? <CheckIcon /> : <EditIcon />}
      onClick={toggleEditMode}
      size="small"
    >
      {isEditMode ? 'Done' : 'Edit Layout'}
    </Button>
  );

  return (
    <Box>
      <PageHeader title="Dashboard" actions={headerActions} />

      {isEditMode && (
        <Alert severity="info" sx={{ mb: 2 }} onClose={toggleEditMode}>
          Drag widgets to rearrange your dashboard. Click Done when finished.
        </Alert>
      )}

      {isEditMode ? (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragCancel={handleDragCancel}
        >
          <SortableContext items={sortableIds} strategy={rectSortingStrategy}>
            {flatItems.map((item) => {
              if (item.type === 'divider') {
                return (
                  <Typography
                    key={item.id}
                    variant="overline"
                    sx={{
                      display: 'block',
                      fontSize: 12,
                      fontWeight: 600,
                      letterSpacing: 1.5,
                      color: 'text.secondary',
                      mb: 1.5,
                      mt: 3,
                    }}
                  >
                    {item.label}
                  </Typography>
                );
              }

              const widget = item.widget!;
              return (
                <DraggableWidget
                  key={widget.id}
                  id={widget.id}
                  title={widget.title}
                  isEditMode={true}
                >
                  <WidgetContent widget={widget} />
                </DraggableWidget>
              );
            })}
          </SortableContext>

          <DragOverlay dropAnimation={null}>
            {activeWidget ? (
              <Box
                sx={{
                  opacity: 0.7,
                  boxShadow: 8,
                  borderRadius: 1,
                  bgcolor: 'background.paper',
                  p: 2,
                  minWidth: 300,
                }}
              >
                <Typography variant="subtitle2" color="text.secondary">
                  {activeWidget.title}
                </Typography>
              </Box>
            ) : null}
          </DragOverlay>
        </DndContext>
      ) : (
        flatItems.map((item) => {
          if (item.type === 'divider') {
            return (
              <Typography
                key={item.id}
                variant="overline"
                sx={{
                  display: 'block',
                  fontSize: 12,
                  fontWeight: 600,
                  letterSpacing: 1.5,
                  color: 'text.secondary',
                  mb: 1.5,
                  mt: item.category === 'system' ? 0 : 4,
                }}
              >
                {item.label}
              </Typography>
            );
          }

          const widget = item.widget!;
          return (
            <DraggableWidget
              key={widget.id}
              id={widget.id}
              title={widget.title}
              isEditMode={false}
            >
              <WidgetContent widget={widget} />
            </DraggableWidget>
          );
        })
      )}

      {visibleWidgets.length === 0 && (
        <Typography color="text.secondary">No widgets configured.</Typography>
      )}
    </Box>
  );
}
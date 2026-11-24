import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import {
  Box,
  Button,
  Chip,
  IconButton,
  Paper,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import EditIcon from '@mui/icons-material/Edit';
import RefreshIcon from '@mui/icons-material/Refresh';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { EmptyState } from '@/components/shared/EmptyState';
import { PendingChangesBanner } from '@/components/shared/PendingChangesBanner';
import { useApplyChanges } from '@/hooks/useApplyChanges';
import { getErrorMessage } from '@/utils/errorMessage';
import {
  fetchPortForwards,
  deletePortForward,
  reorderPortForwards,
  type PortForward,
} from '@/api/modules/nat';
import { PortForwardFormDialog } from './PortForwardFormDialog';

const QUERY_KEY = ['nat', 'port-forwards'];

interface SortableRowProps {
  rule: PortForward;
  onEdit: (rule: PortForward) => void;
  onDelete: (rule: PortForward) => void;
}

function SortableRow({ rule, onEdit, onDelete }: SortableRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: rule.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <TableRow ref={setNodeRef} style={style}>
      <TableCell sx={{ width: 48 }}>
        <IconButton size="small" {...listeners} {...attributes} aria-label="Drag to reorder">
          <DragIndicatorIcon fontSize="small" />
        </IconButton>
      </TableCell>
      <TableCell sx={{ width: 80 }}>
        <Chip
          label={rule.disabled ? 'Disabled' : 'Enabled'}
          color={rule.disabled ? 'default' : 'success'}
          size="small"
          variant="outlined"
        />
      </TableCell>
      <TableCell>{rule.interface.toUpperCase()}</TableCell>
      <TableCell>{rule.protocol.toUpperCase()}</TableCell>
      <TableCell>
        <Typography variant="body2" noWrap sx={{ maxWidth: 150 }}>
          {rule.source || '*'}
          {rule.sourceport ? `:${rule.sourceport}` : ''}
        </Typography>
      </TableCell>
      <TableCell>
        <Typography variant="body2" noWrap sx={{ maxWidth: 150 }}>
          {rule.destination}
          {rule.destport ? `:${rule.destport}` : ''}
        </Typography>
      </TableCell>
      <TableCell>
        <Typography variant="body2" noWrap sx={{ maxWidth: 150 }}>
          {rule.target}:{rule.local_port}
        </Typography>
      </TableCell>
      <TableCell>
        <Typography variant="body2" noWrap sx={{ maxWidth: 200 }} title={rule.descr}>
          {rule.descr || '-'}
        </Typography>
      </TableCell>
      <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
        <Tooltip title="Edit">
          <IconButton size="small" onClick={() => onEdit(rule)} aria-label="Edit rule">
            <EditIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Delete">
          <IconButton size="small" color="error" onClick={() => onDelete(rule)} aria-label="Delete rule">
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </TableCell>
    </TableRow>
  );
}

export function PortForwardsTab() {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  const [hasPendingChanges, setHasPendingChanges] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<PortForward | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<PortForward | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const { data: rules, isLoading, isError, error, refetch } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: fetchPortForwards,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deletePortForward(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      setHasPendingChanges(true);
      setDeleteTarget(null);
    },
    onError: (error: unknown) => {
      enqueueSnackbar(getErrorMessage(error, 'Failed to delete port forward rule'), { variant: 'error' });
    },
  });

  const reorderMutation = useMutation({
    mutationFn: (reordered: PortForward[]) => reorderPortForwards(reordered.map((r) => r.id)),
    onMutate: async (newOrder) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEY });
      const previous = queryClient.getQueryData(QUERY_KEY);
      queryClient.setQueryData(QUERY_KEY, newOrder);
      setHasPendingChanges(true);
      return { previous };
    },
    onError: (error: unknown, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(QUERY_KEY, context.previous);
      }
      enqueueSnackbar(getErrorMessage(error, 'Failed to reorder port forward rules'), { variant: 'error' });
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });

  const applyChanges = useApplyChanges({
    endpoint: '/firewall/apply',
    invalidateKeys: [QUERY_KEY],
    onSuccess: () => setHasPendingChanges(false),
  });

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id || !rules) return;

      const oldIndex = rules.findIndex((r) => r.id === active.id);
      const newIndex = rules.findIndex((r) => r.id === over.id);
      if (oldIndex === -1 || newIndex === -1) return;

      reorderMutation.mutate(arrayMove(rules, oldIndex, newIndex));
    },
    [rules, reorderMutation],
  );

  const handleCreate = () => {
    setEditingRule(null);
    setDialogOpen(true);
  };

  const handleEdit = (rule: PortForward) => {
    setEditingRule(rule);
    setDialogOpen(true);
  };

  return (
    <Box>
      <PendingChangesBanner
        hasChanges={hasPendingChanges}
        onApply={() => applyChanges.mutate()}
        isApplying={applyChanges.isPending}
      />

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mb: 2 }}>
        <Button startIcon={<RefreshIcon />} onClick={() => void refetch()} disabled={isLoading}>
          Refresh
        </Button>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleCreate}>
          Add Rule
        </Button>
      </Box>

      {isLoading && (
        <Paper sx={{ p: 2 }}>
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} height={48} sx={{ mb: 1 }} />
          ))}
        </Paper>
      )}

      {isError && (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography color="error" sx={{ mb: 2 }}>
            Failed to load port forward rules:{' '}
            {error instanceof Error ? error.message : 'Unknown error'}
          </Typography>
          <Button variant="outlined" onClick={() => void refetch()}>
            Retry
          </Button>
        </Paper>
      )}

      {!isLoading && !isError && (rules ?? []).length === 0 && (
        <Paper>
          <EmptyState message="No port forward rules configured. Add a rule to get started." />
        </Paper>
      )}

      {!isLoading && !isError && (rules ?? []).length > 0 && (
        <TableContainer component={Paper}>
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={(rules ?? []).map((r) => r.id)} strategy={verticalListSortingStrategy}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ width: 48 }} />
                    <TableCell sx={{ width: 80 }}>Status</TableCell>
                    <TableCell>Interface</TableCell>
                    <TableCell>Protocol</TableCell>
                    <TableCell>Source</TableCell>
                    <TableCell>Destination</TableCell>
                    <TableCell>Redirect Target</TableCell>
                    <TableCell>Description</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(rules ?? []).map((rule) => (
                    <SortableRow
                      key={rule.id}
                      rule={rule}
                      onEdit={handleEdit}
                      onDelete={(r) => setDeleteTarget(r)}
                    />
                  ))}
                </TableBody>
              </Table>
            </SortableContext>
          </DndContext>
        </TableContainer>
      )}

      <PortForwardFormDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        initialValues={editingRule}
        queryKeyToInvalidate={QUERY_KEY}
        onSaved={() => setHasPendingChanges(true)}
      />

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Delete Port Forward Rule"
        message={`Are you sure you want to delete the port forward rule for ${deleteTarget?.target}:${deleteTarget?.local_port}?`}
        confirmLabel="Delete"
        destructive
        onConfirm={() => {
          if (deleteTarget) deleteMutation.mutate(deleteTarget.id);
        }}
        onCancel={() => setDeleteTarget(null)}
      />
    </Box>
  );
}
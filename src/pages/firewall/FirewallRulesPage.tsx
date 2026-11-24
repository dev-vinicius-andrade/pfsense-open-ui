import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogTitle,
  IconButton,
  Paper,
  Skeleton,
  Switch,
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
import { PageHeader } from '@/components/shared/PageHeader';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { EmptyState } from '@/components/shared/EmptyState';
import { PendingChangesBanner } from '@/components/shared/PendingChangesBanner';
import { useApplyChanges } from '@/hooks/useApplyChanges';
import { getErrorMessage } from '@/utils/errorMessage';
import {
  fetchFirewallRules,
  createFirewallRule,
  updateFirewallRule,
  deleteFirewallRule,
  reorderFirewallRules,
  firewallQueryKeys,
  type FirewallRule,
} from '@/api/modules/firewall';
import { FirewallRuleForm, type FirewallRuleFormData } from './FirewallRuleForm';

// --- Action Chip Colors ---

const actionColorMap: Record<string, 'success' | 'error' | 'warning'> = {
  pass: 'success',
  block: 'error',
  reject: 'warning',
};

// --- Sortable Row Component ---

interface SortableRowProps {
  rule: FirewallRule;
  onToggle: (rule: FirewallRule) => void;
  onEdit: (rule: FirewallRule) => void;
  onDelete: (rule: FirewallRule) => void;
}

function SortableRow({ rule, onToggle, onEdit, onDelete }: SortableRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: rule.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <TableRow ref={setNodeRef} style={style} {...attributes}>
      <TableCell sx={{ width: 48 }}>
        <IconButton size="small" {...listeners} aria-label="Drag to reorder">
          <DragIndicatorIcon fontSize="small" />
        </IconButton>
      </TableCell>
      <TableCell sx={{ width: 64 }}>
        <Switch
          checked={rule.enabled}
          onChange={() => onToggle(rule)}
          size="small"
          aria-label={`Toggle rule ${rule.id}`}
        />
      </TableCell>
      <TableCell>
        <Chip
          label={rule.action.toUpperCase()}
          color={actionColorMap[rule.action] ?? 'default'}
          size="small"
          variant="outlined"
        />
      </TableCell>
      <TableCell>{rule.protocol.toUpperCase()}</TableCell>
      <TableCell>
        <Typography variant="body2" noWrap sx={{ maxWidth: 150 }}>
          {formatAddress(rule.source_type, rule.source_address)}
        </Typography>
      </TableCell>
      <TableCell>
        <Typography variant="body2" noWrap sx={{ maxWidth: 150 }}>
          {formatAddress(rule.destination_type, rule.destination_address)}
        </Typography>
      </TableCell>
      <TableCell>{rule.destination_port || '*'}</TableCell>
      <TableCell>{rule.schedule || '-'}</TableCell>
      <TableCell>
        <Typography variant="body2" noWrap sx={{ maxWidth: 200 }} title={rule.description}>
          {rule.description || '-'}
        </Typography>
      </TableCell>
      <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
        <Tooltip title="Edit">
          <IconButton size="small" onClick={() => onEdit(rule)} aria-label="Edit rule">
            <EditIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Delete">
          <IconButton
            size="small"
            color="error"
            onClick={() => onDelete(rule)}
            aria-label="Delete rule"
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </TableCell>
    </TableRow>
  );
}

function formatAddress(type: string, address?: string): string {
  if (type === 'any') return 'Any';
  if (type === 'alias') return address ? `Alias: ${address}` : 'Alias';
  return address ?? '-';
}

// --- Main Page Component ---

export function FirewallRulesPage() {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  const [hasPendingChanges, setHasPendingChanges] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<FirewallRule | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<FirewallRule | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  // --- Queries ---

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: firewallQueryKeys.rules,
    queryFn: fetchFirewallRules,
  });

  const rules = data?.data ?? [];

  // --- Mutations ---

  const toggleMutation = useMutation({
    mutationFn: ({ id, enabled }: { id: number; enabled: boolean }) =>
      updateFirewallRule(id, { enabled }),
    onMutate: async ({ id, enabled }) => {
      await queryClient.cancelQueries({ queryKey: firewallQueryKeys.rules });
      const previous = queryClient.getQueryData(firewallQueryKeys.rules);
      queryClient.setQueryData(firewallQueryKeys.rules, (old: typeof data) => {
        if (!old) return old;
        return {
          ...old,
          data: old.data.map((r) => (r.id === id ? { ...r, enabled } : r)),
        };
      });
      setHasPendingChanges(true);
      return { previous };
    },
    onError: (error: unknown, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(firewallQueryKeys.rules, context.previous);
      }
      enqueueSnackbar(getErrorMessage(error, 'Failed to toggle firewall rule'), { variant: 'error' });
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: firewallQueryKeys.rules });
    },
  });

  const createMutation = useMutation({
    mutationFn: createFirewallRule,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: firewallQueryKeys.rules });
      setHasPendingChanges(true);
      setDialogOpen(false);
      setEditingRule(null);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, input }: { id: number; input: Partial<FirewallRuleFormData> }) =>
      updateFirewallRule(id, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: firewallQueryKeys.rules });
      setHasPendingChanges(true);
      setDialogOpen(false);
      setEditingRule(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteFirewallRule,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: firewallQueryKeys.rules });
      setHasPendingChanges(true);
      setDeleteTarget(null);
    },
    onError: (error: unknown) => {
      enqueueSnackbar(getErrorMessage(error, 'Failed to delete firewall rule'), { variant: 'error' });
    },
  });

  const reorderMutation = useMutation({
    mutationFn: reorderFirewallRules,
    onMutate: async (newOrder) => {
      await queryClient.cancelQueries({ queryKey: firewallQueryKeys.rules });
      const previous = queryClient.getQueryData(firewallQueryKeys.rules);
      queryClient.setQueryData(firewallQueryKeys.rules, (old: typeof data) => {
        if (!old) return old;
        return { ...old, data: newOrder };
      });
      setHasPendingChanges(true);
      return { previous };
    },
    onError: (error: unknown, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(firewallQueryKeys.rules, context.previous);
      }
      enqueueSnackbar(getErrorMessage(error, 'Failed to reorder firewall rules'), { variant: 'error' });
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: firewallQueryKeys.rules });
    },
  });

  const applyChanges = useApplyChanges({
    endpoint: '/firewall/apply',
    invalidateKeys: [[...firewallQueryKeys.rules]],
    onSuccess: () => setHasPendingChanges(false),
  });

  // --- Handlers ---

  const handleToggle = useCallback(
    (rule: FirewallRule) => {
      toggleMutation.mutate({ id: rule.id, enabled: !rule.enabled });
    },
    [toggleMutation],
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      const oldIndex = rules.findIndex((r) => r.id === active.id);
      const newIndex = rules.findIndex((r) => r.id === over.id);
      if (oldIndex === -1 || newIndex === -1) return;

      const reordered = arrayMove(rules, oldIndex, newIndex).map((r, i) => ({
        ...r,
        position: i,
      }));
      reorderMutation.mutate(reordered);
    },
    [rules, reorderMutation],
  );

  const handleCreate = () => {
    setEditingRule(null);
    setDialogOpen(true);
  };

  const handleEdit = (rule: FirewallRule) => {
    setEditingRule(rule);
    setDialogOpen(true);
  };

  const handleFormSubmit = (formData: FirewallRuleFormData) => {
    if (editingRule) {
      updateMutation.mutate({ id: editingRule.id, input: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  // --- Render ---

  return (
    <Box>
      <PageHeader
        title="Firewall Rules"
        actions={
          <>
            <Button startIcon={<RefreshIcon />} onClick={() => refetch()} disabled={isLoading}>
              Refresh
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleCreate}
              color="primary"
            >
              Add Rule
            </Button>
          </>
        }
      />

      <PendingChangesBanner
        hasChanges={hasPendingChanges}
        onApply={() => applyChanges.mutate()}
        isApplying={applyChanges.isPending}
      />

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
            Failed to load firewall rules:{' '}
            {error instanceof Error ? error.message : 'Unknown error'}
          </Typography>
          <Button variant="outlined" onClick={() => refetch()}>
            Retry
          </Button>
        </Paper>
      )}

      {!isLoading && !isError && rules.length === 0 && (
        <Paper>
          <EmptyState message="No firewall rules configured. Add a rule to get started." />
        </Paper>
      )}

      {!isLoading && !isError && rules.length > 0 && (
        <TableContainer component={Paper}>
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={rules.map((r) => r.id)} strategy={verticalListSortingStrategy}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ width: 48 }} />
                    <TableCell sx={{ width: 64 }}>On</TableCell>
                    <TableCell>Action</TableCell>
                    <TableCell>Protocol</TableCell>
                    <TableCell>Source</TableCell>
                    <TableCell>Destination</TableCell>
                    <TableCell>Port</TableCell>
                    <TableCell>Schedule</TableCell>
                    <TableCell>Description</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rules.map((rule) => (
                    <SortableRow
                      key={rule.id}
                      rule={rule}
                      onToggle={handleToggle}
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

      {/* Create / Edit Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>{editingRule ? 'Edit Firewall Rule' : 'Create Firewall Rule'}</DialogTitle>
        <Box sx={{ px: 3, pb: 3 }}>
          <FirewallRuleForm
            initialData={editingRule}
            onSubmit={handleFormSubmit}
            onCancel={() => setDialogOpen(false)}
            isSubmitting={isSubmitting}
          />
        </Box>
      </Dialog>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={deleteTarget !== null}
        title="Delete Firewall Rule"
        message={`Are you sure you want to delete rule "${deleteTarget?.description || deleteTarget?.id}"? This change will be pending until applied.`}
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
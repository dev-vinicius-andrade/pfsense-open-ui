import { useMemo, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import {
  Box,
  Button,
  Chip,
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
import DeleteIcon from '@mui/icons-material/Delete';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import EditIcon from '@mui/icons-material/Edit';
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
import { EmptyState } from '@/components/shared/EmptyState';
import { getErrorMessage } from '@/utils/errorMessage';
import {
  fetchFirewallRules,
  updateFirewallRule,
  reorderFirewallRules,
  firewallQueryKeys,
  type FirewallRule,
} from '@/api/modules/firewall';
import { useFirewallRuleContext } from '../FirewallRuleContext';

const FLOATING_TAB_KEY = '__floating__';
const IFACE_PARAM = 'iface';

// --- Action Chip Colors ---

const actionColorMap: Record<string, 'success' | 'error' | 'warning'> = {
  pass: 'success',
  block: 'error',
  reject: 'warning',
};

// --- Helper Functions ---

function formatAddress(type: string, address?: string): string {
  if (type === 'any') return 'Any';
  if (type === 'alias') return address ? `Alias: ${address}` : 'Alias';
  return address ?? '-';
}

function isFloatingRule(rule: FirewallRule): boolean {
  return !rule.interface || rule.interface === '' || rule.interface === 'floating';
}

function filterRulesByInterface(rules: FirewallRule[], ifaceId: string): FirewallRule[] {
  if (ifaceId === FLOATING_TAB_KEY) {
    return rules.filter(isFloatingRule);
  }
  return rules.filter((r) => r.interface === ifaceId);
}

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

// --- Panel Component ---

interface RuleTablePanelProps {
  panelId: string;
}

export function RuleTablePanel({ panelId }: RuleTablePanelProps) {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  const [searchParams] = useSearchParams();
  const { setHasPendingChanges, handleEdit, setDeleteTarget } = useFirewallRuleContext();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  // Determine active tab from URL search params
  const activeTabKey = useMemo(() => {
    const paramValue = searchParams.get(IFACE_PARAM);
    // We need interfaces data to validate, but for filtering we can use the raw value
    // The actual validation happens in InterfaceTabsPanel; here we just read what's set
    return paramValue ?? '';
  }, [searchParams]);

  const {
    data: rulesData,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: firewallQueryKeys.rules,
    queryFn: fetchFirewallRules,
  });

  const allRules = rulesData?.data ?? [];

  // Filter rules for the active tab — if no tab is set yet, show empty
  const filteredRules = useMemo(() => {
    if (!activeTabKey) return [];
    return filterRulesByInterface(allRules, activeTabKey);
  }, [allRules, activeTabKey]);

  // --- Mutations ---

  const toggleMutation = useMutation({
    mutationFn: ({ id, enabled }: { id: number; enabled: boolean }) =>
      updateFirewallRule(id, { enabled }),
    onMutate: async ({ id, enabled }) => {
      await queryClient.cancelQueries({ queryKey: firewallQueryKeys.rules });
      const previous = queryClient.getQueryData(firewallQueryKeys.rules);
      queryClient.setQueryData(firewallQueryKeys.rules, (old: typeof rulesData) => {
        if (!old) return old;
        return {
          ...old,
          data: old.data.map((r) => (r.id === id ? { ...r, enabled } : r)),
        };
      });
      setHasPendingChanges(true);
      return { previous };
    },
    onError: (err: unknown, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(firewallQueryKeys.rules, context.previous);
      }
      enqueueSnackbar(getErrorMessage(err, 'Failed to toggle firewall rule'), { variant: 'error' });
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: firewallQueryKeys.rules });
    },
  });

  const reorderMutation = useMutation({
    mutationFn: reorderFirewallRules,
    onMutate: async (newOrder) => {
      await queryClient.cancelQueries({ queryKey: firewallQueryKeys.rules });
      const previous = queryClient.getQueryData(firewallQueryKeys.rules);
      queryClient.setQueryData(firewallQueryKeys.rules, (old: typeof rulesData) => {
        if (!old) return old;
        return { ...old, data: newOrder };
      });
      setHasPendingChanges(true);
      return { previous };
    },
    onError: (err: unknown, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(firewallQueryKeys.rules, context.previous);
      }
      enqueueSnackbar(getErrorMessage(err, 'Failed to reorder firewall rules'), {
        variant: 'error',
      });
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: firewallQueryKeys.rules });
    },
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

      const oldIndex = filteredRules.findIndex((r) => r.id === active.id);
      const newIndex = filteredRules.findIndex((r) => r.id === over.id);
      if (oldIndex === -1 || newIndex === -1) return;

      const reordered = arrayMove(filteredRules, oldIndex, newIndex).map((r, i) => ({
        ...r,
        position: i,
      }));
      reorderMutation.mutate(reordered);
    },
    [filteredRules, reorderMutation],
  );

  // --- Render States ---

  if (isLoading) {
    return (
      <Paper sx={{ p: 2 }} data-panel-id={panelId}>
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} height={48} sx={{ mb: 1 }} />
        ))}
      </Paper>
    );
  }

  if (isError) {
    return (
      <Paper sx={{ p: 4, textAlign: 'center' }} data-panel-id={panelId}>
        <Typography color="error" sx={{ mb: 2 }}>
          Failed to load firewall rules:{' '}
          {error instanceof Error ? error.message : 'Unknown error'}
        </Typography>
        <Button variant="outlined" onClick={() => refetch()}>
          Retry
        </Button>
      </Paper>
    );
  }

  if (filteredRules.length === 0) {
    return (
      <Paper data-panel-id={panelId}>
        <EmptyState message="No firewall rules configured for this interface. Add a rule to get started." />
      </Paper>
    );
  }

  return (
    <Box data-panel-id={panelId} sx={{ height: '100%' }}>
      <TableContainer component={Paper} sx={{ height: '100%', overflow: 'auto' }}>
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={filteredRules.map((r) => r.id)} strategy={verticalListSortingStrategy}>
            <Table size="small" stickyHeader>
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
                {filteredRules.map((rule) => (
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
    </Box>
  );
}
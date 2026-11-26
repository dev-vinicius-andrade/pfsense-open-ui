import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box,
  Button,
  IconButton,
  Tooltip,
  Alert,
  Skeleton,
  Snackbar,
  Chip,
  Paper,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import { DataTable } from '@/components/shared/DataTable';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { fetchInterfaceGroups, deleteInterfaceGroup } from '@/api/modules/interfaces';
import type { InterfaceGroup } from '@/api/modules/interfaces';

interface InterfaceGroupsPanelProps {
  panelId: string;
}

export function InterfaceGroupsPanel({ panelId }: InterfaceGroupsPanelProps) {
  const queryClient = useQueryClient();
  const [deleteTarget, setDeleteTarget] = useState<InterfaceGroup | null>(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);

  const { data: groups, isLoading, error, refetch } = useQuery({
    queryKey: ['interface-groups'],
    queryFn: fetchInterfaceGroups,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteInterfaceGroup(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['interface-groups'] });
      setDeleteTarget(null);
    },
  });

  if (isLoading) {
    return (
      <Paper sx={{ p: 2 }} data-panel-id={panelId}>
        <Skeleton variant="rounded" height={200} />
      </Paper>
    );
  }

  if (error) {
    return (
      <Paper sx={{ p: 4, textAlign: 'center' }} data-panel-id={panelId}>
        <Alert severity="error" action={<Button size="small" onClick={() => void refetch()}>Retry</Button>}>
          Failed to load interface groups.
        </Alert>
      </Paper>
    );
  }

  const columns = [
    { key: 'name', header: 'Name' },
    { key: 'descr', header: 'Description' },
    {
      key: 'members',
      header: 'Member Interfaces',
      render: (row: InterfaceGroup) => (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
          {row.members.map((m) => (
            <Chip key={m} size="small" label={m} variant="outlined" />
          ))}
        </Box>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (row: InterfaceGroup) => (
        <Tooltip title="Delete">
          <IconButton size="small" color="error" onClick={() => setDeleteTarget(row)}>
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      ),
    },
  ];

  return (
    <Box data-panel-id={panelId} sx={{ height: '100%' }}>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setSnackbarOpen(true)}
        >
          Create Group
        </Button>
      </Box>

      <DataTable
        columns={columns}
        rows={(groups ?? []) as (InterfaceGroup & Record<string, unknown>)[]}
        emptyMessage="No interface groups configured."
      />

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Delete Interface Group"
        message={`Are you sure you want to delete interface group "${deleteTarget?.name}"?`}
        confirmLabel="Delete"
        destructive
        onConfirm={() => {
          if (deleteTarget) {
            void deleteMutation.mutate(deleteTarget.id);
          }
        }}
        onCancel={() => setDeleteTarget(null)}
      />

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={() => setSnackbarOpen(false)}
        message="Interface group creation coming soon"
      />
    </Box>
  );
}
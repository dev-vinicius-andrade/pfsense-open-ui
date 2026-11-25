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
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import { DataTable } from '@/components/shared/DataTable';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { fetchLaggs, deleteLagg } from '@/api/modules/interfaces';
import type { Lagg } from '@/api/modules/interfaces';

export function LaggPage() {
  const queryClient = useQueryClient();
  const [deleteTarget, setDeleteTarget] = useState<Lagg | null>(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);

  const { data: laggs, isLoading, error, refetch } = useQuery({
    queryKey: ['laggs'],
    queryFn: fetchLaggs,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteLagg(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['laggs'] });
      setDeleteTarget(null);
    },
  });

  if (isLoading) {
    return (
      <Box>
        <Skeleton variant="rounded" height={200} />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" action={<Button size="small" onClick={() => void refetch()}>Retry</Button>}>
        Failed to load LAGGs.
      </Alert>
    );
  }

  const columns = [
    { key: 'id', header: 'ID' },
    { key: 'descr', header: 'Description' },
    {
      key: 'members',
      header: 'Members',
      render: (row: Lagg) => (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
          {row.members.map((m) => (
            <Chip key={m} size="small" label={m} variant="outlined" />
          ))}
        </Box>
      ),
    },
    {
      key: 'proto',
      header: 'Protocol',
      render: (row: Lagg) => row.proto.toUpperCase(),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (row: Lagg) => (
        <Tooltip title="Delete">
          <IconButton size="small" color="error" onClick={() => setDeleteTarget(row)}>
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      ),
    },
  ];

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setSnackbarOpen(true)}
        >
          Create LAGG
        </Button>
      </Box>

      <DataTable
        columns={columns}
        rows={(laggs ?? []) as (Lagg & Record<string, unknown>)[]}
        emptyMessage="No LAGG interfaces configured."
      />

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Delete LAGG"
        message={`Are you sure you want to delete LAGG ${deleteTarget?.id} (${deleteTarget?.members.join(', ')})?`}
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
        message="LAGG creation coming soon"
      />
    </Box>
  );
}
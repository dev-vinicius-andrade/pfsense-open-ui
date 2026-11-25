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
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import { DataTable } from '@/components/shared/DataTable';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { fetchGres, deleteGre } from '@/api/modules/interfaces';
import type { Gre } from '@/api/modules/interfaces';

export function GreTunnelsPage() {
  const queryClient = useQueryClient();
  const [deleteTarget, setDeleteTarget] = useState<Gre | null>(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);

  const { data: gres, isLoading, error, refetch } = useQuery({
    queryKey: ['gres'],
    queryFn: fetchGres,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteGre(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['gres'] });
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
        Failed to load GRE tunnels.
      </Alert>
    );
  }

  const columns = [
    { key: 'id', header: 'ID' },
    { key: 'descr', header: 'Description' },
    { key: 'localaddr', header: 'Local Address' },
    { key: 'remoteaddr', header: 'Remote Address' },
    { key: 'address', header: 'Tunnel Interface' },
    {
      key: 'actions',
      header: 'Actions',
      render: (row: Gre) => (
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
          Create GRE Tunnel
        </Button>
      </Box>

      <DataTable
        columns={columns}
        rows={(gres ?? []) as (Gre & Record<string, unknown>)[]}
        emptyMessage="No GRE tunnels configured."
      />

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Delete GRE Tunnel"
        message={`Are you sure you want to delete GRE tunnel ${deleteTarget?.id} (${deleteTarget?.localaddr} → ${deleteTarget?.remoteaddr})?`}
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
        message="GRE tunnel creation coming soon"
      />
    </Box>
  );
}
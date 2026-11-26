import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box,
  Button,
  IconButton,
  Tooltip,
  Alert,
  Skeleton,
  Paper,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import { DataTable } from '@/components/shared/DataTable';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { fetchVlans, deleteVlan } from '@/api/modules/interfaces';
import type { Vlan } from '@/api/modules/interfaces';

interface VlansPanelProps {
  panelId: string;
}

export function VlansPanel({ panelId }: VlansPanelProps) {
  const queryClient = useQueryClient();
  const [deleteTarget, setDeleteTarget] = useState<Vlan | null>(null);

  const { data: vlans, isLoading, error, refetch } = useQuery({
    queryKey: ['vlans'],
    queryFn: fetchVlans,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteVlan(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['vlans'] });
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
          Failed to load VLANs.
        </Alert>
      </Paper>
    );
  }

  const columns = [
    { key: 'if', header: 'Parent Interface' },
    { key: 'tag', header: 'Tag' },
    { key: 'pcp', header: 'Priority' },
    { key: 'descr', header: 'Description' },
    {
      key: 'actions',
      header: 'Actions',
      render: (row: Vlan) => (
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
        <Button variant="contained" startIcon={<AddIcon />} disabled>
          Add VLAN
        </Button>
      </Box>

      <DataTable
        columns={columns}
        rows={(vlans ?? []) as (Vlan & Record<string, unknown>)[]}
        emptyMessage="No VLANs configured."
      />

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Delete VLAN"
        message={`Are you sure you want to delete VLAN ${deleteTarget?.tag} on ${deleteTarget?.if}?`}
        confirmLabel="Delete"
        destructive
        onConfirm={() => {
          if (deleteTarget) {
            void deleteMutation.mutate(deleteTarget.id);
          }
        }}
        onCancel={() => setDeleteTarget(null)}
      />
    </Box>
  );
}
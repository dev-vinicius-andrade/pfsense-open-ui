import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box,
  Button,
  IconButton,
  Tooltip,
  Alert,
  Skeleton,
  Chip,
  Paper,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import { DataTable } from '@/components/shared/DataTable';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { fetchBridges, deleteBridge } from '@/api/modules/interfaces';
import type { Bridge } from '@/api/modules/interfaces';

interface BridgesPanelProps {
  panelId: string;
}

export function BridgesPanel({ panelId }: BridgesPanelProps) {
  const queryClient = useQueryClient();
  const [deleteTarget, setDeleteTarget] = useState<Bridge | null>(null);

  const { data: bridges, isLoading, error, refetch } = useQuery({
    queryKey: ['bridges'],
    queryFn: fetchBridges,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteBridge(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['bridges'] });
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
          Failed to load bridges.
        </Alert>
      </Paper>
    );
  }

  const columns = [
    {
      key: 'members',
      header: 'Member Interfaces',
      render: (row: Bridge) => (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
          {row.members.map((m) => (
            <Chip key={m} size="small" label={m} variant="outlined" />
          ))}
        </Box>
      ),
    },
    { key: 'descr', header: 'Description' },
    {
      key: 'stp',
      header: 'STP',
      render: (row: Bridge) => (row.stp ? 'Enabled' : 'Disabled'),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (row: Bridge) => (
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
          Add Bridge
        </Button>
      </Box>

      <DataTable
        columns={columns}
        rows={(bridges ?? []) as (Bridge & Record<string, unknown>)[]}
        emptyMessage="No bridge groups configured."
      />

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Delete Bridge"
        message={`Are you sure you want to delete this bridge group with members: ${deleteTarget?.members.join(', ')}?`}
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
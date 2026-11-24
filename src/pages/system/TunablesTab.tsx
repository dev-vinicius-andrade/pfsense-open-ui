import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  IconButton,
  Paper,
  Skeleton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
  Alert,
  Chip,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { EmptyState } from '@/components/shared/EmptyState';
import {
  fetchTunables,
  createTunable,
  updateTunable,
  deleteTunable,
  systemQueryKeys,
  type Tunable,
} from '@/api/modules/system';

interface TunableFormProps {
  initialData?: Tunable | null;
  onSubmit: (data: Partial<Tunable>) => void;
  onCancel: () => void;
  isSubmitting: boolean;
}

function TunableForm({ initialData, onSubmit, onCancel, isSubmitting }: TunableFormProps) {
  return (
    <Stack spacing={2} component="form" onSubmit={(e) => {
      e.preventDefault();
      const formData = new FormData(e.currentTarget);
      onSubmit({
        name: formData.get('name') as string,
        value: formData.get('value') as string,
        description: formData.get('description') as string,
        type: (formData.get('type') as Tunable['type']) || 'sysctl',
      });
    }}>
      <TextField
        name="name"
        label="Tunable Name"
        defaultValue={initialData?.name ?? ''}
        required
        fullWidth
        size="small"
        disabled={!!initialData}
        helperText="e.g., kern.ipc.nmbclusters"
      />
      <TextField
        name="value"
        label="Value"
        defaultValue={initialData?.value ?? ''}
        required
        fullWidth
        size="small"
      />
      <TextField
        name="description"
        label="Description"
        defaultValue={initialData?.description ?? ''}
        fullWidth
        size="small"
        multiline
        rows={2}
      />
      <TextField
        name="type"
        label="Type"
        defaultValue={initialData?.type ?? 'sysctl'}
        select
        fullWidth
        size="small"
        slotProps={{ htmlInput: { native: true } }}
      >
        <option value="sysctl">sysctl</option>
        <option value="loader">loader</option>
      </TextField>
      <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
        <Button onClick={onCancel} disabled={isSubmitting}>Cancel</Button>
        <Button type="submit" variant="contained" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : 'Save Tunable'}
        </Button>
      </Box>
    </Stack>
  );
}

export function TunablesTab() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTunable, setEditingTunable] = useState<Tunable | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Tunable | null>(null);

  const tunablesQuery = useQuery({
    queryKey: systemQueryKeys.tunables,
    queryFn: fetchTunables,
  });

  const createMutation = useMutation({
    mutationFn: createTunable,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: systemQueryKeys.tunables });
      setDialogOpen(false);
      setEditingTunable(null);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ name, input }: { name: string; input: Partial<Tunable> }) =>
      updateTunable(name, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: systemQueryKeys.tunables });
      setDialogOpen(false);
      setEditingTunable(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteTunable,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: systemQueryKeys.tunables });
      setDeleteTarget(null);
    },
  });

  const tunables = tunablesQuery.data?.data ?? [];

  const handleSubmit = (data: Partial<Tunable>) => {
    if (editingTunable) {
      updateMutation.mutate({ name: editingTunable.name, input: data });
    } else {
      createMutation.mutate(data);
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => { setEditingTunable(null); setDialogOpen(true); }}
        >
          Add Tunable
        </Button>
      </Box>

      {tunablesQuery.isLoading && (
        <Paper sx={{ p: 2 }}>
          {[...Array(5)].map((_, i) => <Skeleton key={i} height={48} sx={{ mb: 1 }} />)}
        </Paper>
      )}

      {tunablesQuery.isError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          Failed to load tunables. Please try again.
        </Alert>
      )}

      {!tunablesQuery.isLoading && !tunablesQuery.isError && tunables.length === 0 && (
        <Paper><EmptyState message="No tunables configured." /></Paper>
      )}

      {!tunablesQuery.isLoading && !tunablesQuery.isError && tunables.length > 0 && (
        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Value</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Description</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {tunables.map((tunable) => (
                <TableRow key={tunable.name}>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                      {tunable.name}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                      {tunable.value}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip label={tunable.type} size="small" variant="outlined" />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" noWrap sx={{ maxWidth: 300 }}>
                      {tunable.description || '-'}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title="Edit">
                      <IconButton size="small" onClick={() => { setEditingTunable(tunable); setDialogOpen(true); }}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton size="small" color="error" onClick={() => setDeleteTarget(tunable)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingTunable ? 'Edit Tunable' : 'Create Tunable'}</DialogTitle>
        <Box sx={{ px: 3, pb: 3 }}>
          <TunableForm
            initialData={editingTunable}
            onSubmit={handleSubmit}
            onCancel={() => setDialogOpen(false)}
            isSubmitting={createMutation.isPending || updateMutation.isPending}
          />
        </Box>
      </Dialog>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={deleteTarget !== null}
        title="Delete Tunable"
        message={`Are you sure you want to delete tunable "${deleteTarget?.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        destructive
        onConfirm={() => { if (deleteTarget) deleteMutation.mutate(deleteTarget.name); }}
        onCancel={() => setDeleteTarget(null)}
      />
    </Box>
  );
}
import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  IconButton,
  Paper,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { EmptyState } from '@/components/shared/EmptyState';
import {
  fetchCronJobs,
  createCronJob,
  updateCronJob,
  deleteCronJob,
  servicesQueryKeys,
  type CronJob,
  type CronJobCreateInput,
} from '@/api/modules/services';

// --- Cron Job Form ---

interface CronJobFormProps {
  initialData?: CronJob | null;
  onSubmit: (data: CronJobCreateInput) => void;
  onCancel: () => void;
  isSubmitting: boolean;
}

function CronJobForm({ initialData, onSubmit, onCancel, isSubmitting }: CronJobFormProps) {
  const [minute, setMinute] = useState(initialData?.minute ?? '*');
  const [hour, setHour] = useState(initialData?.hour ?? '*');
  const [dayOfMonth, setDayOfMonth] = useState(initialData?.day_of_month ?? '*');
  const [month, setMonth] = useState(initialData?.month ?? '*');
  const [dayOfWeek, setDayOfWeek] = useState(initialData?.day_of_week ?? '*');
  const [command, setCommand] = useState(initialData?.command ?? '');
  const [user, setUser] = useState(initialData?.user ?? 'root');
  const [description, setDescription] = useState(initialData?.description ?? '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      minute,
      hour,
      day_of_month: dayOfMonth,
      month,
      day_of_week: dayOfWeek,
      command,
      user,
      description: description || undefined,
    });
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Typography variant="subtitle2" color="text.secondary">
        Cron Expression
      </Typography>
      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
        <TextField
          label="Minute"
          value={minute}
          onChange={(e) => setMinute(e.target.value)}
          required
          sx={{ width: 80 }}
          placeholder="*"
        />
        <TextField
          label="Hour"
          value={hour}
          onChange={(e) => setHour(e.target.value)}
          required
          sx={{ width: 80 }}
          placeholder="*"
        />
        <TextField
          label="Day"
          value={dayOfMonth}
          onChange={(e) => setDayOfMonth(e.target.value)}
          required
          sx={{ width: 80 }}
          placeholder="*"
        />
        <TextField
          label="Month"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          required
          sx={{ width: 80 }}
          placeholder="*"
        />
        <TextField
          label="Weekday"
          value={dayOfWeek}
          onChange={(e) => setDayOfWeek(e.target.value)}
          required
          sx={{ width: 80 }}
          placeholder="*"
        />
      </Box>
      <TextField
        label="Command"
        value={command}
        onChange={(e) => setCommand(e.target.value)}
        required
        fullWidth
        placeholder="/usr/local/bin/my-script.sh"
      />
      <TextField
        label="User"
        value={user}
        onChange={(e) => setUser(e.target.value)}
        required
        sx={{ maxWidth: 200 }}
      />
      <TextField
        label="Description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        fullWidth
      />
      <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
        <Button onClick={onCancel}>Cancel</Button>
        <Button type="submit" variant="contained" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : 'Save'}
        </Button>
      </Box>
    </Box>
  );
}

// --- Main Component ---

export function CronJobsTab() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<CronJob | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CronJob | null>(null);

  // --- Query ---

  const {
    data: jobsData,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: servicesQueryKeys.cronJobs,
    queryFn: fetchCronJobs,
  });

  const cronJobs = jobsData?.data ?? [];

  // --- Mutations ---

  const createMutation = useMutation({
    mutationFn: createCronJob,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: servicesQueryKeys.cronJobs });
      setDialogOpen(false);
      setEditingJob(null);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, input }: { id: number; input: Partial<CronJobCreateInput> }) =>
      updateCronJob(id, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: servicesQueryKeys.cronJobs });
      setDialogOpen(false);
      setEditingJob(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteCronJob,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: servicesQueryKeys.cronJobs });
      setDeleteTarget(null);
    },
  });

  // --- Handlers ---

  const handleFormSubmit = useCallback(
    (formData: CronJobCreateInput) => {
      if (editingJob) {
        updateMutation.mutate({ id: editingJob.id, input: formData });
      } else {
        createMutation.mutate(formData);
      }
    },
    [editingJob, createMutation, updateMutation],
  );

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  // --- Render ---

  if (isLoading) {
    return (
      <Paper sx={{ p: 3 }}>
        <Skeleton height={48} sx={{ mb: 2 }} />
        <Skeleton height={200} />
      </Paper>
    );
  }

  if (isError) {
    return (
      <Paper sx={{ p: 4, textAlign: 'center' }}>
        <Typography color="error" sx={{ mb: 2 }}>
          Failed to load cron jobs.
        </Typography>
        <Button variant="outlined" onClick={() => refetch()}>
          Retry
        </Button>
      </Paper>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Paper sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">Cron Jobs</Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => {
              setEditingJob(null);
              setDialogOpen(true);
            }}
          >
            Add Cron Job
          </Button>
        </Box>

        {cronJobs.length === 0 ? (
          <EmptyState message="No cron jobs configured." />
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Minute</TableCell>
                  <TableCell>Hour</TableCell>
                  <TableCell>Day</TableCell>
                  <TableCell>Month</TableCell>
                  <TableCell>Weekday</TableCell>
                  <TableCell>Command</TableCell>
                  <TableCell>User</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {cronJobs.map((job) => (
                  <TableRow key={job.id}>
                    <TableCell>{job.minute}</TableCell>
                    <TableCell>{job.hour}</TableCell>
                    <TableCell>{job.day_of_month}</TableCell>
                    <TableCell>{job.month}</TableCell>
                    <TableCell>{job.day_of_week}</TableCell>
                    <TableCell>
                      <Typography variant="body2" noWrap sx={{ maxWidth: 200 }} title={job.command}>
                        {job.command}
                      </Typography>
                    </TableCell>
                    <TableCell>{job.user}</TableCell>
                    <TableCell>{job.description || '-'}</TableCell>
                    <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                      <Tooltip title="Edit">
                        <IconButton
                          size="small"
                          onClick={() => {
                            setEditingJob(job);
                            setDialogOpen(true);
                          }}
                          aria-label="Edit cron job"
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => setDeleteTarget(job)}
                          aria-label="Delete cron job"
                        >
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
      </Paper>

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingJob ? 'Edit Cron Job' : 'Add Cron Job'}</DialogTitle>
        <Box sx={{ px: 3, pb: 3 }}>
          <CronJobForm
            initialData={editingJob}
            onSubmit={handleFormSubmit}
            onCancel={() => setDialogOpen(false)}
            isSubmitting={isSubmitting}
          />
        </Box>
      </Dialog>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={deleteTarget !== null}
        title="Delete Cron Job"
        message={`Are you sure you want to delete the cron job "${deleteTarget?.description || deleteTarget?.command}"?`}
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
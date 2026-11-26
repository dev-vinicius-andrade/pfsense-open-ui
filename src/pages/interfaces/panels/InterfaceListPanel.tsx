import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardActionArea,
  Grid,
  Typography,
  Skeleton,
  Alert,
  IconButton,
  Tooltip,
  Paper,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { StatusChip } from '@/components/shared/StatusChip';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { EmptyState } from '@/components/shared/EmptyState';
import {
  fetchInterfaces,
  deleteInterface,
} from '@/api/modules/interfaces';
import type { InterfaceConfig } from '@/api/modules/interfaces';
import { getErrorMessage } from '@/utils/errorMessage';

function mapStatus(status?: string): 'online' | 'offline' | 'warning' | 'unknown' {
  if (status === 'up') return 'online';
  if (status === 'down' || status === 'no carrier') return 'offline';
  return 'unknown';
}

interface InterfaceListPanelProps {
  panelId: string;
}

export function InterfaceListPanel({ panelId }: InterfaceListPanelProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  const [deleteTarget, setDeleteTarget] = useState<InterfaceConfig | null>(null);

  const { data: interfaces, isLoading, error, refetch } = useQuery({
    queryKey: ['interfaces'],
    queryFn: fetchInterfaces,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteInterface(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['interfaces'] });
      setDeleteTarget(null);
    },
    onError: (error: unknown) => {
      enqueueSnackbar(getErrorMessage(error, 'Failed to delete interface'), { variant: 'error' });
    },
  });

  if (isLoading) {
    return (
      <Paper sx={{ p: 2 }} data-panel-id={panelId}>
        <Grid container spacing={3}>
          {[1, 2, 3, 4].map((i) => (
            <Grid size={{ xs: 12, sm: 6, md: 3 }} key={i}>
              <Card>
                <CardContent>
                  <Skeleton variant="text" width="60%" />
                  <Skeleton variant="text" width="40%" sx={{ mt: 1 }} />
                  <Skeleton variant="rounded" height={32} sx={{ mt: 2 }} />
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Paper>
    );
  }

  if (error) {
    return (
      <Paper sx={{ p: 4, textAlign: 'center' }} data-panel-id={panelId}>
        <Alert severity="error" action={<Button size="small" onClick={() => void refetch()}>Retry</Button>}>
          Failed to load interfaces. Please try again.
        </Alert>
      </Paper>
    );
  }

  return (
    <Box data-panel-id={panelId} sx={{ height: '100%' }}>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate('/interfaces/new')}
        >
          Assign Interface
        </Button>
      </Box>

      {interfaces && interfaces.length > 0 ? (
        <Grid container spacing={3}>
          {interfaces.map((iface) => (
            <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={iface.id}>
              <Card variant="outlined">
                <CardActionArea onClick={() => navigate(`/interfaces/${iface.id}/edit`)}>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                        {iface.descr || iface.id}
                      </Typography>
                      <StatusChip status={mapStatus(iface.status)} />
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      {iface.if}
                    </Typography>
                    {iface.ipv4_type !== 'none' && (
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                        IPv4: {iface.ipv4_type}
                        {iface.ipv4_address ? ` (${iface.ipv4_address})` : ''}
                      </Typography>
                    )}
                    {iface.enable ? (
                      <Typography variant="caption" color="success.main" sx={{ mt: 1, display: 'block' }}>
                        Enabled
                      </Typography>
                    ) : (
                      <Typography variant="caption" color="text.disabled" sx={{ mt: 1, display: 'block' }}>
                        Disabled
                      </Typography>
                    )}
                  </CardContent>
                </CardActionArea>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', p: 1, borderTop: 1, borderColor: 'divider' }}>
                  <Tooltip title="Edit">
                    <IconButton size="small" onClick={() => navigate(`/interfaces/${iface.id}/edit`)}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete">
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => setDeleteTarget(iface)}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Card>
            </Grid>
          ))}
        </Grid>
      ) : (
        <EmptyState message="No interfaces assigned. Click 'Assign Interface' to get started." />
      )}

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Delete Interface"
        message={`Are you sure you want to delete interface "${deleteTarget?.descr || deleteTarget?.id}"? This will require applying changes and may cause connectivity loss.`}
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
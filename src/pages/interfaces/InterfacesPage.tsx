import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import {
  Box,
  Tab,
  Tabs,
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
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { PageHeader } from '@/components/shared/PageHeader';
import { StatusChip } from '@/components/shared/StatusChip';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { PendingChangesBanner } from '@/components/shared/PendingChangesBanner';
import { EmptyState } from '@/components/shared/EmptyState';
import { VlansPage } from './VlansPage';
import { BridgesPage } from './BridgesPage';
import {
  fetchInterfaces,
  deleteInterface,
} from '@/api/modules/interfaces';
import type { InterfaceConfig } from '@/api/modules/interfaces';
import { useApplyChanges } from '@/hooks/useApplyChanges';
import { getErrorMessage } from '@/utils/errorMessage';

function mapStatus(status?: string): 'online' | 'offline' | 'warning' | 'unknown' {
  if (status === 'up') return 'online';
  if (status === 'down' || status === 'no carrier') return 'offline';
  return 'unknown';
}

interface TabPanelProps {
  children: React.ReactNode;
  value: number;
  index: number;
}

function TabPanel({ children, value, index }: TabPanelProps) {
  if (value !== index) return null;
  return <Box sx={{ py: 3 }}>{children}</Box>;
}

export function InterfacesPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  const [activeTab, setActiveTab] = useState(0);
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

  const applyMutation = useApplyChanges({
    endpoint: '/interface/apply',
    invalidateKeys: [['interfaces']],
  });

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  if (isLoading) {
    return (
      <Box>
        <PageHeader title="Interfaces" />
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
      </Box>
    );
  }

  if (error) {
    return (
      <Box>
        <PageHeader title="Interfaces" />
        <Alert severity="error" action={<Button size="small" onClick={() => void refetch()}>Retry</Button>}>
          Failed to load interfaces. Please try again.
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      <PageHeader
        title="Interfaces"
        actions={
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate('/interfaces/new')}
          >
            Assign Interface
          </Button>
        }
      />

      <PendingChangesBanner
        hasChanges={applyMutation.isPending || deleteMutation.isSuccess}
        onApply={() => void applyMutation.mutateAsync()}
        isApplying={applyMutation.isPending}
        message="Interface changes have been made. Apply them to activate. This may cause brief connectivity loss."
      />

      <Tabs value={activeTab} onChange={handleTabChange} sx={{ mb: 1 }}>
        <Tab label="Assignments" />
        <Tab label="VLANs" />
        <Tab label="Bridges" />
      </Tabs>

      <TabPanel value={activeTab} index={0}>
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
      </TabPanel>

      <TabPanel value={activeTab} index={1}>
        <VlansPage />
      </TabPanel>

      <TabPanel value={activeTab} index={2}>
        <BridgesPage />
      </TabPanel>

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
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box,
  Button,
  Chip,
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
  Alert,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { EmptyState } from '@/components/shared/EmptyState';
import {
  fetchCertificates,
  createCertificate,
  deleteCertificate,
  systemQueryKeys,
  type Certificate,
} from '@/api/modules/system';

function formatDate(dateStr?: string): string {
  if (!dateStr) return '-';
  try {
    return new Date(dateStr).toLocaleDateString();
  } catch {
    return dateStr;
  }
}

function getCertStatus(cert: Certificate): { label: string; color: 'success' | 'warning' | 'error' | 'default' } {
  if (!cert.not_after) return { label: 'Unknown', color: 'default' };
  const expiry = new Date(cert.not_after);
  const now = new Date();
  const daysUntilExpiry = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  if (daysUntilExpiry < 0) return { label: 'Expired', color: 'error' };
  if (daysUntilExpiry < 30) return { label: 'Expiring Soon', color: 'warning' };
  return { label: 'Valid', color: 'success' };
}

export function CertificatesTab() {
  const queryClient = useQueryClient();
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Certificate | null>(null);

  const certsQuery = useQuery({
    queryKey: systemQueryKeys.certificates,
    queryFn: fetchCertificates,
  });

  const importMutation = useMutation({
    mutationFn: createCertificate,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: systemQueryKeys.certificates });
      setImportDialogOpen(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteCertificate,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: systemQueryKeys.certificates });
      setDeleteTarget(null);
    },
  });

  const certificates = certsQuery.data?.data ?? [];

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2, gap: 1 }}>
        <Button
          variant="outlined"
          startIcon={<UploadFileIcon />}
          onClick={() => setImportDialogOpen(true)}
        >
          Import Certificate
        </Button>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setImportDialogOpen(true)}
        >
          Create CSR
        </Button>
      </Box>

      {certsQuery.isLoading && (
        <Paper sx={{ p: 2 }}>
          {[...Array(5)].map((_, i) => <Skeleton key={i} height={48} sx={{ mb: 1 }} />)}
        </Paper>
      )}

      {certsQuery.isError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          Failed to load certificates. Please try again.
        </Alert>
      )}

      {!certsQuery.isLoading && !certsQuery.isError && certificates.length === 0 && (
        <Paper><EmptyState message="No certificates found." /></Paper>
      )}

      {!certsQuery.isLoading && !certsQuery.isError && certificates.length > 0 && (
        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Issuer</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Valid From</TableCell>
                <TableCell>Expires</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {certificates.map((cert) => {
                const status = getCertStatus(cert);
                return (
                  <TableRow key={cert.refid}>
                    <TableCell>{cert.descr || cert.refid}</TableCell>
                    <TableCell>{cert.issuer || '-'}</TableCell>
                    <TableCell>
                      <Chip label={cert.type} size="small" variant="outlined" />
                    </TableCell>
                    <TableCell>{formatDate(cert.not_before)}</TableCell>
                    <TableCell>{formatDate(cert.not_after)}</TableCell>
                    <TableCell>
                      <Chip label={status.label} color={status.color} size="small" />
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="Delete">
                        <IconButton size="small" color="error" onClick={() => setDeleteTarget(cert)}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Import/Create Dialog */}
      <Dialog open={importDialogOpen} onClose={() => setImportDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Import / Create Certificate</DialogTitle>
        <Box sx={{ px: 3, pb: 3 }}>
          <Stack spacing={2} component="form" onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            importMutation.mutate({
              descr: formData.get('name') as string,
              crt: formData.get('certificate') as string,
              prv: formData.get('privateKey') as string || undefined,
              type: 'server',
            });
          }}>
            <TextField
              name="name"
              label="Certificate Name"
              required
              fullWidth
              size="small"
            />
            <TextField
              name="certificate"
              label="Certificate (PEM)"
              required
              fullWidth
              multiline
              rows={4}
              placeholder="-----BEGIN CERTIFICATE-----&#10;...&#10;-----END CERTIFICATE-----"
              slotProps={{ input: { sx: { fontFamily: 'monospace', fontSize: '0.8rem' } } }}
            />
            <TextField
              name="privateKey"
              label="Private Key (PEM, optional for import)"
              fullWidth
              multiline
              rows={4}
              placeholder="-----BEGIN PRIVATE KEY-----&#10;...&#10;-----END PRIVATE KEY-----"
              slotProps={{ input: { sx: { fontFamily: 'monospace', fontSize: '0.8rem' } } }}
            />
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
              <Button onClick={() => setImportDialogOpen(false)}>Cancel</Button>
              <Button type="submit" variant="contained" disabled={importMutation.isPending}>
                {importMutation.isPending ? 'Importing...' : 'Import Certificate'}
              </Button>
            </Box>
          </Stack>
        </Box>
      </Dialog>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={deleteTarget !== null}
        title="Delete Certificate"
        message={`Are you sure you want to delete certificate "${deleteTarget?.descr || deleteTarget?.refid}"? This action cannot be undone.`}
        confirmLabel="Delete"
        destructive
        onConfirm={() => { if (deleteTarget) deleteMutation.mutate(deleteTarget.refid); }}
        onCancel={() => setDeleteTarget(null)}
      />
    </Box>
  );
}
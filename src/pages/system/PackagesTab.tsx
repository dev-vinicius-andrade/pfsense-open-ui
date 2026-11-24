import { useQuery } from '@tanstack/react-query';
import {
  Paper,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Alert,
  Link,
} from '@mui/material';
import { EmptyState } from '@/components/shared/EmptyState';
import { fetchPackages, systemQueryKeys } from '@/api/modules/system';

export function PackagesTab() {
  const packagesQuery = useQuery({
    queryKey: systemQueryKeys.packages,
    queryFn: fetchPackages,
  });

  const packages = packagesQuery.data?.data ?? [];

  if (packagesQuery.isLoading) {
    return (
      <Paper sx={{ p: 2 }}>
        {[...Array(5)].map((_, i) => <Skeleton key={i} height={48} sx={{ mb: 1 }} />)}
      </Paper>
    );
  }

  if (packagesQuery.isError) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        Failed to load installed packages. Please try again.
      </Alert>
    );
  }

  if (packages.length === 0) {
    return (
      <Paper>
        <EmptyState message="No packages installed." />
      </Paper>
    );
  }

  return (
    <TableContainer component={Paper}>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Name</TableCell>
            <TableCell>Version</TableCell>
            <TableCell>Category</TableCell>
            <TableCell>Summary</TableCell>
            <TableCell>Maintainer</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {packages.map((pkg) => (
            <TableRow key={pkg.name}>
              <TableCell>
                {pkg.website ? (
                  <Link href={pkg.website} target="_blank" rel="noopener noreferrer">
                    {pkg.name}
                  </Link>
                ) : (
                  pkg.name
                )}
              </TableCell>
              <TableCell>{pkg.version}</TableCell>
              <TableCell>{pkg.category || '-'}</TableCell>
              <TableCell>
                <Typography variant="body2" noWrap sx={{ maxWidth: 300 }}>
                  {pkg.summary || '-'}
                </Typography>
              </TableCell>
              <TableCell>{pkg.maintainer || '-'}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
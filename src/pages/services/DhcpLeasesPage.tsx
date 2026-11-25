import { useState, useMemo, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Box,
  Button,
  Chip,
  Paper,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  TextField,
  Typography,
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import RefreshIcon from '@mui/icons-material/Refresh';
import { PageHeader } from '@/components/shared/PageHeader';
import { EmptyState } from '@/components/shared/EmptyState';
import { StatusChip } from '@/components/shared/StatusChip';
import {
  fetchDhcpLeases,
  servicesQueryKeys,
  type DhcpLease,
} from '@/api/modules/services';

type LeaseStatus = DhcpLease['status'];
type SortField = keyof DhcpLease;
type SortDirection = 'asc' | 'desc';

const STATUS_FILTERS: Array<{ label: string; value: LeaseStatus | 'all' }> = [
  { label: 'All', value: 'all' },
  { label: 'Active', value: 'active' },
  { label: 'Expired', value: 'expired' },
  { label: 'Released', value: 'released' },
];

function leaseStatusToChipStatus(status: LeaseStatus): 'online' | 'offline' | 'warning' {
  switch (status) {
    case 'active':
      return 'online';
    case 'expired':
      return 'offline';
    case 'released':
      return 'warning';
  }
}

function formatLeaseTime(isoString: string): string {
  try {
    return new Date(isoString).toLocaleString();
  } catch {
    return isoString;
  }
}

function exportLeasesToCsv(leases: DhcpLease[]): void {
  const headers = ['IP Address', 'MAC Address', 'Hostname', 'Interface', 'Status', 'Lease Start', 'Lease End'];
  const rows = leases.map((l) => [
    l.ip_address,
    l.mac_address,
    l.hostname ?? '',
    l.interface,
    l.status,
    l.starts,
    l.ends,
  ]);
  const csvContent = [headers.join(','), ...rows.map((r) => r.map((c) => `"${c}"`).join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `dhcp-leases-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

export function DhcpLeasesPage() {
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<LeaseStatus | 'all'>('all');
  const [sortField, setSortField] = useState<SortField>('ip_address');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const {
    data: leasesData,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: servicesQueryKeys.dhcpLeases,
    queryFn: fetchDhcpLeases,
    refetchInterval: 30000,
  });

  const leases = leasesData?.data ?? [];

  const handleSort = useCallback(
    (field: SortField) => {
      if (sortField === field) {
        setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
      } else {
        setSortField(field);
        setSortDirection('asc');
      }
    },
    [sortField],
  );

  const filteredAndSortedLeases = useMemo(() => {
    let result = leases;

    if (statusFilter !== 'all') {
      result = result.filter((l) => l.status === statusFilter);
    }

    if (searchText.trim()) {
      const lowerSearch = searchText.toLowerCase().trim();
      result = result.filter(
        (l) =>
          l.ip_address.toLowerCase().includes(lowerSearch) ||
          l.mac_address.toLowerCase().includes(lowerSearch) ||
          (l.hostname?.toLowerCase().includes(lowerSearch) ?? false),
      );
    }

    result = [...result].sort((a, b) => {
      const aVal = a[sortField] ?? '';
      const bVal = b[sortField] ?? '';
      const comparison = String(aVal).localeCompare(String(bVal));
      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [leases, statusFilter, searchText, sortField, sortDirection]);

  if (isLoading) {
    return (
      <Box>
        <PageHeader title="DHCP Leases" />
        <Paper sx={{ p: 3 }}>
          <Skeleton height={48} sx={{ mb: 2 }} />
          <Skeleton height={300} />
        </Paper>
      </Box>
    );
  }

  if (isError) {
    return (
      <Box>
        <PageHeader title="DHCP Leases" />
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography color="error" sx={{ mb: 2 }}>
            Failed to load DHCP leases.
          </Typography>
          <Button variant="outlined" onClick={() => refetch()}>
            Retry
          </Button>
        </Paper>
      </Box>
    );
  }

  return (
    <Box>
      <PageHeader
        title="DHCP Leases"
        subtitle={`${filteredAndSortedLeases.length} of ${leases.length} leases`}
        actions={
          <>
            <Button
              startIcon={<RefreshIcon />}
              onClick={() => refetch()}
              aria-label="Refresh leases"
            >
              Refresh
            </Button>
            <Button
              variant="contained"
              startIcon={<DownloadIcon />}
              onClick={() => exportLeasesToCsv(filteredAndSortedLeases)}
              disabled={filteredAndSortedLeases.length === 0}
              aria-label="Export leases as CSV"
            >
              Export CSV
            </Button>
          </>
        }
      />

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
          <TextField
            size="small"
            placeholder="Search by IP, MAC, or hostname..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            sx={{ minWidth: 300 }}
            aria-label="Search DHCP leases"
          />
          <Box sx={{ display: 'flex', gap: 1 }}>
            {STATUS_FILTERS.map((filter) => (
              <Chip
                key={filter.value}
                label={filter.label}
                clickable
                color={statusFilter === filter.value ? 'primary' : 'default'}
                variant={statusFilter === filter.value ? 'filled' : 'outlined'}
                onClick={() => setStatusFilter(filter.value)}
                aria-pressed={statusFilter === filter.value}
              />
            ))}
          </Box>
        </Box>
      </Paper>

      {/* Table */}
      <Paper>
        {filteredAndSortedLeases.length === 0 ? (
          <EmptyState message="No DHCP leases match your filters." />
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  {[
                    { field: 'ip_address' as const, label: 'IP Address' },
                    { field: 'mac_address' as const, label: 'MAC Address' },
                    { field: 'hostname' as const, label: 'Hostname' },
                    { field: 'interface' as const, label: 'Interface' },
                    { field: 'status' as const, label: 'Status' },
                    { field: 'starts' as const, label: 'Lease Start' },
                    { field: 'ends' as const, label: 'Lease End' },
                  ].map((col) => (
                    <TableCell key={col.field} sortDirection={sortField === col.field ? sortDirection : false}>
                      <TableSortLabel
                        active={sortField === col.field}
                        direction={sortField === col.field ? sortDirection : 'asc'}
                        onClick={() => handleSort(col.field)}
                      >
                        {col.label}
                      </TableSortLabel>
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredAndSortedLeases.map((lease) => (
                  <TableRow key={`${lease.ip_address}-${lease.mac_address}`}>
                    <TableCell>{lease.ip_address}</TableCell>
                    <TableCell sx={{ fontFamily: 'monospace' }}>{lease.mac_address}</TableCell>
                    <TableCell>{lease.hostname || '-'}</TableCell>
                    <TableCell>{lease.interface.toUpperCase()}</TableCell>
                    <TableCell>
                      <StatusChip
                        status={leaseStatusToChipStatus(lease.status)}
                        label={lease.status.charAt(0).toUpperCase() + lease.status.slice(1)}
                      />
                    </TableCell>
                    <TableCell>{formatLeaseTime(lease.starts)}</TableCell>
                    <TableCell>{formatLeaseTime(lease.ends)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>
    </Box>
  );
}
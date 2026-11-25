import { useQuery } from '@tanstack/react-query';
import {
  Box,
  Alert,
  Button,
  Skeleton,
} from '@mui/material';
import { DataTable } from '@/components/shared/DataTable';
import { fetchVirtualIps } from '@/api/modules/nat';
import type { VirtualIp } from '@/api/modules/nat';

const VIP_MODE_LABELS: Record<VirtualIp['mode'], string> = {
  carp: 'CARP',
  ipalias: 'IP Alias',
  proxyarp: 'Proxy ARP',
  other: 'Other',
};

export function VirtualIpsPage() {
  const { data: vips, isLoading, error, refetch } = useQuery({
    queryKey: ['virtual-ips'],
    queryFn: fetchVirtualIps,
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
        Failed to load Virtual IPs.
      </Alert>
    );
  }

  const columns = [
    {
      key: 'subnet',
      header: 'IP Address',
      render: (row: VirtualIp) => `${row.subnet}/${row.subnet_bits}`,
    },
    { key: 'subnet_bits', header: 'Subnet' },
    { key: 'interface', header: 'Interface' },
    {
      key: 'mode',
      header: 'Type',
      render: (row: VirtualIp) => VIP_MODE_LABELS[row.mode] ?? row.mode,
    },
    { key: 'descr', header: 'Description' },
  ];

  return (
    <Box>
      <Alert severity="info" sx={{ mb: 2 }}>
        Virtual IP management requires pfSense REST API v2 VIP endpoints. This view is read-only.
      </Alert>

      <DataTable
        columns={columns}
        rows={(vips ?? []) as (VirtualIp & Record<string, unknown>)[]}
        emptyMessage="No Virtual IPs configured."
      />
    </Box>
  );
}
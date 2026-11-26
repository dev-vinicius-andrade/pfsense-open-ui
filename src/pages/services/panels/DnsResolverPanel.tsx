import { Box } from '@mui/material';
import { DnsResolverTab } from '../DnsResolverTab';
import { useServicesContext } from '../ServicesContext';

interface DnsResolverPanelProps {
  panelId: string;
}

export function DnsResolverPanel({ panelId }: DnsResolverPanelProps) {
  const { activeTab } = useServicesContext();

  if (activeTab !== 'dns-resolver') return null;

  return (
    <Box data-panel-id={panelId}>
      <DnsResolverTab />
    </Box>
  );
}
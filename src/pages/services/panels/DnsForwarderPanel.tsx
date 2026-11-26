import { Box } from '@mui/material';
import { DnsForwarderTab } from '../DnsForwarderTab';
import { useServicesContext } from '../ServicesContext';

interface DnsForwarderPanelProps {
  panelId: string;
}

export function DnsForwarderPanel({ panelId }: DnsForwarderPanelProps) {
  const { activeTab } = useServicesContext();

  if (activeTab !== 'dns-forwarder') return null;

  return (
    <Box data-panel-id={panelId}>
      <DnsForwarderTab />
    </Box>
  );
}
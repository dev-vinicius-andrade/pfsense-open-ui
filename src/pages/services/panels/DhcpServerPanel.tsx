import { Box } from '@mui/material';
import { DhcpServerTab } from '../DhcpServerTab';
import { useServicesContext } from '../ServicesContext';

interface DhcpServerPanelProps {
  panelId: string;
}

export function DhcpServerPanel({ panelId }: DhcpServerPanelProps) {
  const { activeTab } = useServicesContext();

  if (activeTab !== 'dhcp') return null;

  return (
    <Box data-panel-id={panelId}>
      <DhcpServerTab />
    </Box>
  );
}
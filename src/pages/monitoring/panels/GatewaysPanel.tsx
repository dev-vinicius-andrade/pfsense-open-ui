import { Box } from '@mui/material';
import { GatewaysPage } from '../GatewaysPage';
import { useMonitoringContext } from '../MonitoringContext';

interface GatewaysPanelProps {
  panelId: string;
}

export function GatewaysPanel({ panelId }: GatewaysPanelProps) {
  const { activeTab } = useMonitoringContext();

  if (activeTab !== 'gateways') return null;

  return (
    <Box data-panel-id={panelId}>
      <GatewaysPage />
    </Box>
  );
}
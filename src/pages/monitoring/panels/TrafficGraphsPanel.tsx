import { Box } from '@mui/material';
import { TrafficGraphsPage } from '../TrafficGraphsPage';
import { useMonitoringContext } from '../MonitoringContext';

interface TrafficGraphsPanelProps {
  panelId: string;
}

export function TrafficGraphsPanel({ panelId }: TrafficGraphsPanelProps) {
  const { activeTab } = useMonitoringContext();

  if (activeTab !== 'traffic') return null;

  return (
    <Box data-panel-id={panelId}>
      <TrafficGraphsPage />
    </Box>
  );
}
import { Box } from '@mui/material';
import { LiveLogsPage } from '../LiveLogsPage';
import { useMonitoringContext } from '../MonitoringContext';

interface LiveLogsPanelProps {
  panelId: string;
}

export function LiveLogsPanel({ panelId }: LiveLogsPanelProps) {
  const { activeTab } = useMonitoringContext();

  if (activeTab !== 'logs') return null;

  return (
    <Box data-panel-id={panelId}>
      <LiveLogsPage />
    </Box>
  );
}
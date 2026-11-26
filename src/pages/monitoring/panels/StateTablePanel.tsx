import { Box } from '@mui/material';
import { StateTablePage } from '../StateTablePage';
import { useMonitoringContext } from '../MonitoringContext';

interface StateTablePanelProps {
  panelId: string;
}

export function StateTablePanel({ panelId }: StateTablePanelProps) {
  const { activeTab } = useMonitoringContext();

  if (activeTab !== 'states') return null;

  return (
    <Box data-panel-id={panelId}>
      <StateTablePage />
    </Box>
  );
}
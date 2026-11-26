import { Box } from '@mui/material';
import { CronJobsTab } from '../CronJobsTab';
import { useServicesContext } from '../ServicesContext';

interface CronJobsPanelProps {
  panelId: string;
}

export function CronJobsPanel({ panelId }: CronJobsPanelProps) {
  const { activeTab } = useServicesContext();

  if (activeTab !== 'cron') return null;

  return (
    <Box data-panel-id={panelId}>
      <CronJobsTab />
    </Box>
  );
}
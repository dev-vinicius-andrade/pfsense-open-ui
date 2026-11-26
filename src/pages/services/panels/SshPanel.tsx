import { Box } from '@mui/material';
import { SshTab } from '../SshTab';
import { useServicesContext } from '../ServicesContext';

interface SshPanelProps {
  panelId: string;
}

export function SshPanel({ panelId }: SshPanelProps) {
  const { activeTab } = useServicesContext();

  if (activeTab !== 'ssh') return null;

  return (
    <Box data-panel-id={panelId}>
      <SshTab />
    </Box>
  );
}
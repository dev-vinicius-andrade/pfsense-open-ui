import { Box } from '@mui/material';
import { NtpTab } from '../NtpTab';
import { useServicesContext } from '../ServicesContext';

interface NtpPanelProps {
  panelId: string;
}

export function NtpPanel({ panelId }: NtpPanelProps) {
  const { activeTab } = useServicesContext();

  if (activeTab !== 'ntp') return null;

  return (
    <Box data-panel-id={panelId}>
      <NtpTab />
    </Box>
  );
}
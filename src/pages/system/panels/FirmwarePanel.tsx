import { Box } from '@mui/material';
import { FirmwareTab } from '../FirmwareTab';
import { useSystemContext } from '../SystemContext';

interface FirmwarePanelProps {
  panelId: string;
}

export function FirmwarePanel({ panelId }: FirmwarePanelProps) {
  const { activeTab } = useSystemContext();

  if (activeTab !== 'firmware') return null;

  return (
    <Box data-panel-id={panelId}>
      <FirmwareTab />
    </Box>
  );
}
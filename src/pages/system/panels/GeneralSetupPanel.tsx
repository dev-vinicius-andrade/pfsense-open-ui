import { Box } from '@mui/material';
import { GeneralSetupTab } from '../GeneralSetupTab';
import { useSystemContext } from '../SystemContext';

interface GeneralSetupPanelProps {
  panelId: string;
}

export function GeneralSetupPanel({ panelId }: GeneralSetupPanelProps) {
  const { activeTab } = useSystemContext();

  if (activeTab !== 'general') return null;

  return (
    <Box data-panel-id={panelId}>
      <GeneralSetupTab />
    </Box>
  );
}
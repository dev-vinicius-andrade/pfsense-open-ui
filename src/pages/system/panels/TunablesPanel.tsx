import { Box } from '@mui/material';
import { TunablesTab } from '../TunablesTab';
import { useSystemContext } from '../SystemContext';

interface TunablesPanelProps {
  panelId: string;
}

export function TunablesPanel({ panelId }: TunablesPanelProps) {
  const { activeTab } = useSystemContext();

  if (activeTab !== 'tunables') return null;

  return (
    <Box data-panel-id={panelId}>
      <TunablesTab />
    </Box>
  );
}
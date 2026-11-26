import { Box } from '@mui/material';
import { UsersTab } from '../UsersTab';
import { useSystemContext } from '../SystemContext';

interface UsersPanelProps {
  panelId: string;
}

export function UsersPanel({ panelId }: UsersPanelProps) {
  const { activeTab } = useSystemContext();

  if (activeTab !== 'users') return null;

  return (
    <Box data-panel-id={panelId}>
      <UsersTab />
    </Box>
  );
}
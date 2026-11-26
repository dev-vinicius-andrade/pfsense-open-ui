import { Box } from '@mui/material';
import { PackagesTab } from '../PackagesTab';
import { useSystemContext } from '../SystemContext';

interface PackagesPanelProps {
  panelId: string;
}

export function PackagesPanel({ panelId }: PackagesPanelProps) {
  const { activeTab } = useSystemContext();

  if (activeTab !== 'packages') return null;

  return (
    <Box data-panel-id={panelId}>
      <PackagesTab />
    </Box>
  );
}
import { Box } from '@mui/material';
import { CertificatesTab } from '../CertificatesTab';
import { useSystemContext } from '../SystemContext';

interface CertificatesPanelProps {
  panelId: string;
}

export function CertificatesPanel({ panelId }: CertificatesPanelProps) {
  const { activeTab } = useSystemContext();

  if (activeTab !== 'certificates') return null;

  return (
    <Box data-panel-id={panelId}>
      <CertificatesTab />
    </Box>
  );
}
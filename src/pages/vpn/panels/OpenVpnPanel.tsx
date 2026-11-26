import { Box } from '@mui/material';
import { OpenVpnTab } from '../OpenVpnTab';
import { useVpnContext } from '../VpnContext';

interface OpenVpnPanelProps {
  panelId: string;
}

export function OpenVpnPanel({ panelId }: OpenVpnPanelProps) {
  const { activeTab } = useVpnContext();

  if (activeTab !== 'openvpn') return null;

  return (
    <Box data-panel-id={panelId}>
      <OpenVpnTab />
    </Box>
  );
}
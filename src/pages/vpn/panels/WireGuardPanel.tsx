import { Box } from '@mui/material';
import { WireGuardTab } from '../WireGuardTab';
import { useVpnContext } from '../VpnContext';

interface WireGuardPanelProps {
  panelId: string;
}

export function WireGuardPanel({ panelId }: WireGuardPanelProps) {
  const { activeTab } = useVpnContext();

  if (activeTab !== 'wireguard') return null;

  return (
    <Box data-panel-id={panelId}>
      <WireGuardTab />
    </Box>
  );
}
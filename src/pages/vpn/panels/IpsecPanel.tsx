import { Box } from '@mui/material';
import { IpsecTab } from '../IpsecTab';
import { useVpnContext } from '../VpnContext';

interface IpsecPanelProps {
  panelId: string;
}

export function IpsecPanel({ panelId }: IpsecPanelProps) {
  const { activeTab } = useVpnContext();

  if (activeTab !== 'ipsec') return null;

  return (
    <Box data-panel-id={panelId}>
      <IpsecTab />
    </Box>
  );
}
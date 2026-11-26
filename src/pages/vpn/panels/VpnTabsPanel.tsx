import { useMemo, useCallback } from 'react';
import { Paper } from '@mui/material';
import { ConfigurableTabs } from '@/components/shared/ConfigurableTabs';
import { useVpnContext, VPN_TAB_IDS, type VpnTabId } from '../VpnContext';

const VPN_TABS = [
  { id: 'openvpn', label: 'OpenVPN' },
  { id: 'wireguard', label: 'WireGuard' },
  { id: 'ipsec', label: 'IPsec' },
] as const;

interface VpnTabsPanelProps {
  panelId: string;
}

export function VpnTabsPanel({ panelId }: VpnTabsPanelProps) {
  const { activeTab, setActiveTab } = useVpnContext();

  const handleTabChange = useCallback(
    (tabId: string) => {
      if ((VPN_TAB_IDS as readonly string[]).includes(tabId)) {
        setActiveTab(tabId as VpnTabId);
      }
    },
    [setActiveTab],
  );

  const tabs = useMemo(() => [...VPN_TABS], []);

  return (
    <Paper sx={{ overflow: 'hidden' }} data-panel-id={panelId}>
      <ConfigurableTabs
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        ariaLabel="VPN configuration tabs"
      >
        <></>
      </ConfigurableTabs>
    </Paper>
  );
}
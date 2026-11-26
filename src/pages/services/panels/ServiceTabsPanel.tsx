import { useMemo, useCallback } from 'react';
import { Paper } from '@mui/material';
import { ConfigurableTabs } from '@/components/shared/ConfigurableTabs';
import { useServicesContext, SERVICE_TAB_IDS, type ServiceTabId } from '../ServicesContext';

const SERVICE_TABS = [
  { id: 'dhcp', label: 'DHCP Server' },
  { id: 'dns-resolver', label: 'DNS Resolver' },
  { id: 'dns-forwarder', label: 'DNS Forwarder' },
  { id: 'ntp', label: 'NTP' },
  { id: 'ssh', label: 'SSH' },
  { id: 'cron', label: 'Cron Jobs' },
] as const;

interface ServiceTabsPanelProps {
  panelId: string;
}

export function ServiceTabsPanel({ panelId }: ServiceTabsPanelProps) {
  const { activeTab, setActiveTab } = useServicesContext();

  const handleTabChange = useCallback(
    (tabId: string) => {
      if ((SERVICE_TAB_IDS as readonly string[]).includes(tabId)) {
        setActiveTab(tabId as ServiceTabId);
      }
    },
    [setActiveTab],
  );

  const tabs = useMemo(() => [...SERVICE_TABS], []);

  return (
    <Paper sx={{ overflow: 'hidden' }} data-panel-id={panelId}>
      <ConfigurableTabs
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        ariaLabel="Service configuration tabs"
      >
        <></>
      </ConfigurableTabs>
    </Paper>
  );
}
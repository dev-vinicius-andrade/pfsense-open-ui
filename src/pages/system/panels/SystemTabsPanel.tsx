import { useMemo, useCallback } from 'react';
import { Paper } from '@mui/material';
import { ConfigurableTabs } from '@/components/shared/ConfigurableTabs';
import { useSystemContext, SYSTEM_TAB_IDS, type SystemTabId } from '../SystemContext';

const SYSTEM_TABS = [
  { id: 'general', label: 'General Setup' },
  { id: 'users', label: 'Users & Groups' },
  { id: 'certificates', label: 'Certificates' },
  { id: 'firmware', label: 'Firmware' },
  { id: 'packages', label: 'Packages' },
  { id: 'tunables', label: 'Tunables' },
  { id: 'diagnostics', label: 'Diagnostics' },
] as const;

interface SystemTabsPanelProps {
  panelId: string;
}

export function SystemTabsPanel({ panelId }: SystemTabsPanelProps) {
  const { activeTab, setActiveTab } = useSystemContext();

  const handleTabChange = useCallback(
    (tabId: string) => {
      if ((SYSTEM_TAB_IDS as readonly string[]).includes(tabId)) {
        setActiveTab(tabId as SystemTabId);
      }
    },
    [setActiveTab],
  );

  const tabs = useMemo(() => [...SYSTEM_TABS], []);

  return (
    <Paper sx={{ overflow: 'hidden' }} data-panel-id={panelId}>
      <ConfigurableTabs
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        ariaLabel="System administration tabs"
      >
        <></>
      </ConfigurableTabs>
    </Paper>
  );
}
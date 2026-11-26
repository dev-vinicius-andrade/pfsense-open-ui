import { useMemo, useCallback } from 'react';
import { Paper } from '@mui/material';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import ListAltIcon from '@mui/icons-material/ListAlt';
import TableChartIcon from '@mui/icons-material/TableChart';
import NetworkCheckIcon from '@mui/icons-material/NetworkCheck';
import { ConfigurableTabs, type TabItem } from '@/components/shared/ConfigurableTabs';
import { useMonitoringContext, MONITORING_TAB_IDS, type MonitoringTabId } from '../MonitoringContext';

const MONITORING_TABS: readonly (TabItem & { id: MonitoringTabId })[] = [
  { id: 'traffic', label: 'Traffic Graphs', icon: ShowChartIcon },
  { id: 'logs', label: 'Live Logs', icon: ListAltIcon },
  { id: 'states', label: 'State Table', icon: TableChartIcon },
  { id: 'gateways', label: 'Gateways', icon: NetworkCheckIcon },
] as const;

interface MonitoringTabsPanelProps {
  panelId: string;
}

export function MonitoringTabsPanel({ panelId }: MonitoringTabsPanelProps) {
  const { activeTab, setActiveTab } = useMonitoringContext();

  const handleTabChange = useCallback(
    (tabId: string) => {
      if ((MONITORING_TAB_IDS as readonly string[]).includes(tabId)) {
        setActiveTab(tabId as MonitoringTabId);
      }
    },
    [setActiveTab],
  );

  const tabs = useMemo(() => [...MONITORING_TABS], []);

  return (
    <Paper sx={{ overflow: 'hidden' }} data-panel-id={panelId}>
      <ConfigurableTabs
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        ariaLabel="Monitoring tabs"
      >
        <></>
      </ConfigurableTabs>
    </Paper>
  );
}
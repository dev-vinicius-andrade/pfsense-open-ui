import { useState } from 'react';
import { Box, Tab, Tabs, Paper } from '@mui/material';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import ListAltIcon from '@mui/icons-material/ListAlt';
import TableChartIcon from '@mui/icons-material/TableChart';
import NetworkCheckIcon from '@mui/icons-material/NetworkCheck';
import { PageHeader } from '@/components/shared/PageHeader';
import { TrafficGraphsPage } from './TrafficGraphsPage';
import { LiveLogsPage } from './LiveLogsPage';
import { StateTablePage } from './StateTablePage';
import { GatewaysPage } from './GatewaysPage';

const TABS = [
  { id: 'traffic', label: 'Traffic Graphs', icon: <ShowChartIcon fontSize="small" /> },
  { id: 'logs', label: 'Live Logs', icon: <ListAltIcon fontSize="small" /> },
  { id: 'states', label: 'State Table', icon: <TableChartIcon fontSize="small" /> },
  { id: 'gateways', label: 'Gateways', icon: <NetworkCheckIcon fontSize="small" /> },
] as const;

type TabId = (typeof TABS)[number]['id'];

export function MonitoringPage() {
  const [activeTab, setActiveTab] = useState<TabId>('traffic');

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <PageHeader title="Real-Time Monitoring" />

      <Paper sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs
          value={activeTab}
          onChange={(_, value: TabId) => setActiveTab(value)}
          variant="scrollable"
          scrollButtons="auto"
          aria-label="Monitoring tabs"
        >
          {TABS.map((tab) => (
            <Tab
              key={tab.id}
              value={tab.id}
              label={tab.label}
              icon={tab.icon}
              iconPosition="start"
              id={`monitoring-tab-${tab.id}`}
              aria-controls={`monitoring-tabpanel-${tab.id}`}
            />
          ))}
        </Tabs>
      </Paper>

      <Box
        role="tabpanel"
        id={`monitoring-tabpanel-${activeTab}`}
        aria-labelledby={`monitoring-tab-${activeTab}`}
      >
        {activeTab === 'traffic' && <TrafficGraphsPage />}
        {activeTab === 'logs' && <LiveLogsPage />}
        {activeTab === 'states' && <StateTablePage />}
        {activeTab === 'gateways' && <GatewaysPage />}
      </Box>
    </Box>
  );
}
import { lazy } from 'react';
import { registerPanels } from '@/layout/panelRegistry';
import type { PanelDefinition } from '@/layout/types';

const MonitoringTabsPanel = lazy(() =>
  import('./panels/MonitoringTabsPanel').then((m) => ({ default: m.MonitoringTabsPanel })),
);
const TrafficGraphsPanel = lazy(() =>
  import('./panels/TrafficGraphsPanel').then((m) => ({ default: m.TrafficGraphsPanel })),
);
const LiveLogsPanel = lazy(() =>
  import('./panels/LiveLogsPanel').then((m) => ({ default: m.LiveLogsPanel })),
);
const StateTablePanel = lazy(() =>
  import('./panels/StateTablePanel').then((m) => ({ default: m.StateTablePanel })),
);
const GatewaysPanel = lazy(() =>
  import('./panels/GatewaysPanel').then((m) => ({ default: m.GatewaysPanel })),
);

export const MONITORING_PANELS: PanelDefinition[] = [
  {
    id: 'monitoring-tabs',
    title: 'Monitoring Tabs',
    description: 'Navigate between monitoring views',
    component: MonitoringTabsPanel,
    defaultLayout: { x: 0, y: 0, width: '100%', height: 64 },
    category: 'navigation',
    minWidth: 4,
    minHeight: 1,
    locked: true,
  },
  {
    id: 'traffic-graphs',
    title: 'Traffic Graphs',
    description: 'Real-time traffic graph visualization',
    component: TrafficGraphsPanel,
    defaultLayout: { x: 0, y: 64, width: '100%', height: 512 },
    category: 'monitoring',
    minWidth: 6,
    minHeight: 4,
  },
  {
    id: 'live-logs',
    title: 'Live Logs',
    description: 'Real-time firewall log viewer',
    component: LiveLogsPanel,
    defaultLayout: { x: 0, y: 64, width: '100%', height: 512 },
    category: 'monitoring',
    minWidth: 6,
    minHeight: 4,
  },
  {
    id: 'state-table',
    title: 'State Table',
    description: 'Active firewall state entries',
    component: StateTablePanel,
    defaultLayout: { x: 0, y: 64, width: '100%', height: 512 },
    category: 'monitoring',
    minWidth: 6,
    minHeight: 4,
  },
  {
    id: 'gateways',
    title: 'Gateways',
    description: 'Gateway status and monitoring',
    component: GatewaysPanel,
    defaultLayout: { x: 0, y: 64, width: '100%', height: 512 },
    category: 'monitoring',
    minWidth: 6,
    minHeight: 4,
  },
];

// Auto-register on module load
registerPanels('monitoring', MONITORING_PANELS);
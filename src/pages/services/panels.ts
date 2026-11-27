import { lazy } from 'react';
import { registerPanels } from '@/layout/panelRegistry';
import type { PanelDefinition } from '@/layout/types';

const ServiceTabsPanel = lazy(() =>
  import('./panels/ServiceTabsPanel').then((m) => ({ default: m.ServiceTabsPanel })),
);
const DhcpServerPanel = lazy(() =>
  import('./panels/DhcpServerPanel').then((m) => ({ default: m.DhcpServerPanel })),
);
const DnsResolverPanel = lazy(() =>
  import('./panels/DnsResolverPanel').then((m) => ({ default: m.DnsResolverPanel })),
);
const DnsForwarderPanel = lazy(() =>
  import('./panels/DnsForwarderPanel').then((m) => ({ default: m.DnsForwarderPanel })),
);
const NtpPanel = lazy(() =>
  import('./panels/NtpPanel').then((m) => ({ default: m.NtpPanel })),
);
const SshPanel = lazy(() =>
  import('./panels/SshPanel').then((m) => ({ default: m.SshPanel })),
);
const CronJobsPanel = lazy(() =>
  import('./panels/CronJobsPanel').then((m) => ({ default: m.CronJobsPanel })),
);

export const SERVICES_PANELS: PanelDefinition[] = [
  {
    id: 'service-tabs',
    title: 'Service Tabs',
    description: 'Navigate between services',
    component: ServiceTabsPanel,
    defaultLayout: { x: 0, y: 0, width: '100%', height: 64 },
    category: 'navigation',
    minWidth: 200,
    minHeight: 48,
    locked: true,
  },
  {
    id: 'dhcp-server',
    title: 'DHCP Server',
    description: 'DHCP server configuration and static mappings',
    component: DhcpServerPanel,
    defaultLayout: { x: 0, y: 64, width: '100%', height: 512 },
    category: 'services',
    minWidth: 300,
    minHeight: 200,
  },
  {
    id: 'dns-resolver',
    title: 'DNS Resolver',
    description: 'Unbound DNS resolver settings',
    component: DnsResolverPanel,
    defaultLayout: { x: 0, y: 64, width: '100%', height: 512 },
    category: 'services',
    minWidth: 300,
    minHeight: 200,
  },
  {
    id: 'dns-forwarder',
    title: 'DNS Forwarder',
    description: 'DNS forwarder settings and host overrides',
    component: DnsForwarderPanel,
    defaultLayout: { x: 0, y: 64, width: '100%', height: 512 },
    category: 'services',
    minWidth: 300,
    minHeight: 200,
  },
  {
    id: 'ntp',
    title: 'NTP',
    description: 'Network Time Protocol settings',
    component: NtpPanel,
    defaultLayout: { x: 0, y: 64, width: '100%', height: 512 },
    category: 'services',
    minWidth: 300,
    minHeight: 200,
  },
  {
    id: 'ssh',
    title: 'SSH',
    description: 'Secure Shell server settings',
    component: SshPanel,
    defaultLayout: { x: 0, y: 64, width: '100%', height: 512 },
    category: 'services',
    minWidth: 300,
    minHeight: 200,
  },
  {
    id: 'cron-jobs',
    title: 'Cron Jobs',
    description: 'Scheduled task management',
    component: CronJobsPanel,
    defaultLayout: { x: 0, y: 64, width: '100%', height: 512 },
    category: 'services',
    minWidth: 300,
    minHeight: 200,
  },
];

// Auto-register on module load
registerPanels('services', SERVICES_PANELS);
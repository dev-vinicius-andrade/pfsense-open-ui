import { lazy } from 'react';
import { registerPanels } from '@/layout/panelRegistry';
import type { PanelDefinition } from '@/layout/types';

// System (settings) panels
const SystemTabsPanel = lazy(() =>
  import('./panels/SystemTabsPanel').then((m) => ({ default: m.SystemTabsPanel })),
);
const GeneralSetupPanel = lazy(() =>
  import('./panels/GeneralSetupPanel').then((m) => ({ default: m.GeneralSetupPanel })),
);
const UsersPanel = lazy(() =>
  import('./panels/UsersPanel').then((m) => ({ default: m.UsersPanel })),
);
const CertificatesPanel = lazy(() =>
  import('./panels/CertificatesPanel').then((m) => ({ default: m.CertificatesPanel })),
);
const FirmwarePanel = lazy(() =>
  import('./panels/FirmwarePanel').then((m) => ({ default: m.FirmwarePanel })),
);
const PackagesPanel = lazy(() =>
  import('./panels/PackagesPanel').then((m) => ({ default: m.PackagesPanel })),
);
const TunablesPanel = lazy(() =>
  import('./panels/TunablesPanel').then((m) => ({ default: m.TunablesPanel })),
);
const DiagnosticsPanel = lazy(() =>
  import('./panels/DiagnosticsPanel').then((m) => ({ default: m.DiagnosticsPanel })),
);

export const SYSTEM_PANELS: PanelDefinition[] = [
  {
    id: 'system-tabs',
    title: 'System Tabs',
    description: 'Navigate between system settings',
    component: SystemTabsPanel,
    defaultLayout: { x: 0, y: 0, width: '100%', height: 64 },
    category: 'navigation',
    minWidth: 4,
    minHeight: 1,
    locked: true,
  },
  {
    id: 'general-setup',
    title: 'General Setup',
    description: 'General system configuration',
    component: GeneralSetupPanel,
    defaultLayout: { x: 0, y: 64, width: '100%', height: 512 },
    category: 'settings',
    minWidth: 6,
    minHeight: 4,
  },
  {
    id: 'users',
    title: 'Users & Groups',
    description: 'User and group management',
    component: UsersPanel,
    defaultLayout: { x: 0, y: 64, width: '100%', height: 512 },
    category: 'settings',
    minWidth: 6,
    minHeight: 4,
  },
  {
    id: 'certificates',
    title: 'Certificates',
    description: 'Certificate authority and certificate management',
    component: CertificatesPanel,
    defaultLayout: { x: 0, y: 64, width: '100%', height: 512 },
    category: 'settings',
    minWidth: 6,
    minHeight: 4,
  },
  {
    id: 'firmware',
    title: 'Firmware',
    description: 'Firmware update and upgrade',
    component: FirmwarePanel,
    defaultLayout: { x: 0, y: 64, width: '100%', height: 512 },
    category: 'settings',
    minWidth: 6,
    minHeight: 4,
  },
  {
    id: 'packages',
    title: 'Packages',
    description: 'Package installation and management',
    component: PackagesPanel,
    defaultLayout: { x: 0, y: 64, width: '100%', height: 512 },
    category: 'settings',
    minWidth: 6,
    minHeight: 4,
  },
  {
    id: 'tunables',
    title: 'Tunables',
    description: 'System tunable parameters',
    component: TunablesPanel,
    defaultLayout: { x: 0, y: 64, width: '100%', height: 512 },
    category: 'settings',
    minWidth: 6,
    minHeight: 4,
  },
  {
    id: 'diagnostics',
    title: 'Diagnostics',
    description: 'System diagnostics and tools',
    component: DiagnosticsPanel,
    defaultLayout: { x: 0, y: 64, width: '100%', height: 512 },
    category: 'settings',
    minWidth: 6,
    minHeight: 4,
  },
];

// ARP table panel
const ArpTablePanel = lazy(() =>
  import('./panels/ArpTablePanel').then((m) => ({ default: m.ArpTablePanel })),
);

export const ARP_TABLE_PANELS: PanelDefinition[] = [
  {
    id: 'arp-table',
    title: 'ARP Table',
    description: 'ARP table entries with search and filtering',
    component: ArpTablePanel,
    defaultLayout: { x: 0, y: 0, width: '100%', height: 640 },
    category: 'primary',
    minWidth: 6,
    minHeight: 4,
  },
];

// Auto-register on module load
registerPanels('settings', SYSTEM_PANELS);
registerPanels('arp-table', ARP_TABLE_PANELS);
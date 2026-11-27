import { lazy } from 'react';
import { registerPanels } from '@/layout/panelRegistry';
import type { PanelDefinition } from '@/layout/types';

// --- Main Interfaces page panels ---
const InterfaceListPanel = lazy(() =>
  import('./panels/InterfaceListPanel').then((m) => ({ default: m.InterfaceListPanel })),
);

export const INTERFACES_PANELS: PanelDefinition[] = [
  {
    id: 'interface-list',
    title: 'Interface Assignments',
    description: 'View and manage network interface assignments',
    component: InterfaceListPanel,
    defaultLayout: { x: 0, y: 0, width: '100%', height: 512 },
    category: 'primary',
    minWidth: 300,
    minHeight: 200,
  },
];

registerPanels('interfaces', INTERFACES_PANELS);

// --- VLANs page panels ---
const VlansPanel = lazy(() =>
  import('./panels/VlansPanel').then((m) => ({ default: m.VlansPanel })),
);

export const VLANS_PANELS: PanelDefinition[] = [
  {
    id: 'vlans-list',
    title: 'VLANs',
    description: 'VLAN configuration and management',
    component: VlansPanel,
    defaultLayout: { x: 0, y: 0, width: '100%', height: 512 },
    category: 'primary',
    minWidth: 300,
    minHeight: 200,
  },
];

registerPanels('interfaces-vlans', VLANS_PANELS);

// --- Bridges page panels ---
const BridgesPanel = lazy(() =>
  import('./panels/BridgesPanel').then((m) => ({ default: m.BridgesPanel })),
);

export const BRIDGES_PANELS: PanelDefinition[] = [
  {
    id: 'bridges-list',
    title: 'Bridges',
    description: 'Bridge group configuration',
    component: BridgesPanel,
    defaultLayout: { x: 0, y: 0, width: '100%', height: 512 },
    category: 'primary',
    minWidth: 300,
    minHeight: 200,
  },
];

registerPanels('interfaces-bridges', BRIDGES_PANELS);

// --- GRE Tunnels page panels ---
const GreTunnelsPanel = lazy(() =>
  import('./panels/GreTunnelsPanel').then((m) => ({ default: m.GreTunnelsPanel })),
);

export const GRE_PANELS: PanelDefinition[] = [
  {
    id: 'gre-tunnels-list',
    title: 'GRE Tunnels',
    description: 'GRE tunnel configuration',
    component: GreTunnelsPanel,
    defaultLayout: { x: 0, y: 0, width: '100%', height: 512 },
    category: 'primary',
    minWidth: 300,
    minHeight: 200,
  },
];

registerPanels('interfaces-gre', GRE_PANELS);

// --- LAGG page panels ---
const LaggPanel = lazy(() =>
  import('./panels/LaggPanel').then((m) => ({ default: m.LaggPanel })),
);

export const LAGG_PANELS: PanelDefinition[] = [
  {
    id: 'lagg-list',
    title: 'LAGG',
    description: 'Link aggregation configuration',
    component: LaggPanel,
    defaultLayout: { x: 0, y: 0, width: '100%', height: 512 },
    category: 'primary',
    minWidth: 300,
    minHeight: 200,
  },
];

registerPanels('interfaces-lagg', LAGG_PANELS);

// --- Interface Groups page panels ---
const InterfaceGroupsPanel = lazy(() =>
  import('./panels/InterfaceGroupsPanel').then((m) => ({ default: m.InterfaceGroupsPanel })),
);

export const INTERFACE_GROUPS_PANELS: PanelDefinition[] = [
  {
    id: 'interface-groups-list',
    title: 'Interface Groups',
    description: 'Interface group management',
    component: InterfaceGroupsPanel,
    defaultLayout: { x: 0, y: 0, width: '100%', height: 512 },
    category: 'primary',
    minWidth: 300,
    minHeight: 200,
  },
];

registerPanels('interfaces-groups', INTERFACE_GROUPS_PANELS);

// --- Virtual IPs page panels ---
const VirtualIpsPanel = lazy(() =>
  import('./panels/VirtualIpsPanel').then((m) => ({ default: m.VirtualIpsPanel })),
);

export const VIRTUAL_IPS_PANELS: PanelDefinition[] = [
  {
    id: 'virtual-ips-list',
    title: 'Virtual IPs',
    description: 'Virtual IP address management',
    component: VirtualIpsPanel,
    defaultLayout: { x: 0, y: 0, width: '100%', height: 512 },
    category: 'primary',
    minWidth: 300,
    minHeight: 200,
  },
];

registerPanels('interfaces-vips', VIRTUAL_IPS_PANELS);
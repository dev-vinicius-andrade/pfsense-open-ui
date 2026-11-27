import { lazy } from 'react';
import { registerPanels } from '@/layout/panelRegistry';
import type { PanelDefinition } from '@/layout/types';

const VpnTabsPanel = lazy(() =>
  import('./panels/VpnTabsPanel').then((m) => ({ default: m.VpnTabsPanel })),
);
const OpenVpnPanel = lazy(() =>
  import('./panels/OpenVpnPanel').then((m) => ({ default: m.OpenVpnPanel })),
);
const WireGuardPanel = lazy(() =>
  import('./panels/WireGuardPanel').then((m) => ({ default: m.WireGuardPanel })),
);
const IpsecPanel = lazy(() =>
  import('./panels/IpsecPanel').then((m) => ({ default: m.IpsecPanel })),
);

export const VPN_PANELS: PanelDefinition[] = [
  {
    id: 'vpn-tabs',
    title: 'VPN Tabs',
    description: 'Navigate between VPN types',
    component: VpnTabsPanel,
    defaultLayout: { x: 0, y: 0, width: '100%', height: 64 },
    category: 'navigation',
    minWidth: 4,
    minHeight: 1,
    locked: true,
  },
  {
    id: 'openvpn',
    title: 'OpenVPN',
    description: 'OpenVPN server and client configuration',
    component: OpenVpnPanel,
    defaultLayout: { x: 0, y: 64, width: '100%', height: 512 },
    category: 'vpn',
    minWidth: 6,
    minHeight: 4,
  },
  {
    id: 'wireguard',
    title: 'WireGuard',
    description: 'WireGuard tunnel and peer configuration',
    component: WireGuardPanel,
    defaultLayout: { x: 0, y: 64, width: '100%', height: 512 },
    category: 'vpn',
    minWidth: 6,
    minHeight: 4,
  },
  {
    id: 'ipsec',
    title: 'IPsec',
    description: 'IPsec Phase 1 and Phase 2 configuration',
    component: IpsecPanel,
    defaultLayout: { x: 0, y: 64, width: '100%', height: 512 },
    category: 'vpn',
    minWidth: 6,
    minHeight: 4,
  },
];

// Auto-register on module load
registerPanels('vpn', VPN_PANELS);
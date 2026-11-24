export interface NavItemConfig {
  id: string;
  label: string;
  path: string;
  icon: string;
}

export const DEFAULT_NAV_ITEMS: NavItemConfig[] = [
  { id: 'dashboard', label: 'Dashboard', path: '/dashboard', icon: 'Dashboard' },
  { id: 'firewall', label: 'Firewall', path: '/firewall', icon: 'Security' },
  { id: 'nat', label: 'NAT', path: '/nat', icon: 'SwapHoriz' },
  { id: 'interfaces', label: 'Interfaces', path: '/interfaces', icon: 'SettingsEthernet' },
  { id: 'vpn', label: 'VPN', path: '/vpn', icon: 'VpnKey' },
  { id: 'services', label: 'Services', path: '/services', icon: 'Dns' },
  { id: 'settings', label: 'Settings', path: '/system', icon: 'Settings' },
  { id: 'monitoring', label: 'Monitoring', path: '/monitoring', icon: 'MonitorHeart' },
  { id: 'ui-preferences', label: 'UI Preferences', path: '/ui-preferences', icon: 'Palette' },
];
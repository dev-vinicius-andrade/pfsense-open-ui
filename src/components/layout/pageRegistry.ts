export interface PageEntry {
  id: string;
  label: string;
  path: string;
  icon: string;
  category: string;
  isTopLevel: boolean;
}

export const PAGE_REGISTRY: PageEntry[] = [
  // Top-level sections
  { id: 'dashboard', label: 'Dashboard', path: '/dashboard', icon: 'Dashboard', category: 'dashboard', isTopLevel: true },
  { id: 'firewall', label: 'Firewall Rules', path: '/firewall', icon: 'Security', category: 'firewall', isTopLevel: true },
  { id: 'nat', label: 'NAT', path: '/nat', icon: 'SwapHoriz', category: 'nat', isTopLevel: true },
  { id: 'interfaces', label: 'Interfaces', path: '/interfaces', icon: 'SettingsEthernet', category: 'interfaces', isTopLevel: true },
  { id: 'vpn', label: 'VPN', path: '/vpn', icon: 'VpnKey', category: 'vpn', isTopLevel: true },
  { id: 'services', label: 'Services', path: '/services', icon: 'Dns', category: 'services', isTopLevel: true },
  { id: 'system', label: 'System', path: '/system', icon: 'Settings', category: 'system', isTopLevel: true },
  { id: 'monitoring', label: 'Monitoring', path: '/monitoring', icon: 'MonitorHeart', category: 'monitoring', isTopLevel: true },
  { id: 'settings', label: 'Settings', path: '/settings', icon: 'Settings', category: 'settings', isTopLevel: true },

  // Firewall sub-pages
  { id: 'firewall-aliases', label: 'Aliases', path: '/firewall/aliases', icon: 'Label', category: 'firewall', isTopLevel: false },
  { id: 'firewall-schedules', label: 'Schedules', path: '/firewall/schedules', icon: 'Schedule', category: 'firewall', isTopLevel: false },

  // NAT sub-pages
  { id: 'nat-port-forwards', label: 'Port Forwards', path: '/nat/port-forwards', icon: 'CallMade', category: 'nat', isTopLevel: false },
  { id: 'nat-outbound', label: 'Outbound NAT', path: '/nat/outbound', icon: 'CallReceived', category: 'nat', isTopLevel: false },
  { id: 'nat-one-to-one', label: '1:1 NAT', path: '/nat/one-to-one', icon: 'SwapCalls', category: 'nat', isTopLevel: false },

  // Interface sub-pages
  { id: 'interfaces-vlans', label: 'VLANs', path: '/interfaces/vlans', icon: 'AccountTree', category: 'interfaces', isTopLevel: false },
  { id: 'interfaces-bridges', label: 'Bridges', path: '/interfaces/bridges', icon: 'Hub', category: 'interfaces', isTopLevel: false },

  // VPN sub-pages
  { id: 'vpn-openvpn', label: 'OpenVPN', path: '/vpn/openvpn', icon: 'VpnLock', category: 'vpn', isTopLevel: false },
  { id: 'vpn-wireguard', label: 'WireGuard', path: '/vpn/wireguard', icon: 'Shield', category: 'vpn', isTopLevel: false },
  { id: 'vpn-ipsec', label: 'IPsec', path: '/vpn/ipsec', icon: 'Lock', category: 'vpn', isTopLevel: false },

  // Services sub-pages
  { id: 'dhcp-server', label: 'DHCP Server', path: '/services/dhcp', icon: 'Router', category: 'services', isTopLevel: false },
  { id: 'dhcp-static-mappings', label: 'DHCP Static Mappings', path: '/services/dhcp/static', icon: 'Assignment', category: 'services', isTopLevel: false },
  { id: 'dhcp-leases', label: 'DHCP Leases', path: '/services/dhcp/leases', icon: 'ListAlt', category: 'services', isTopLevel: false },
  { id: 'dns-resolver', label: 'DNS Resolver', path: '/services/dns', icon: 'Dns', category: 'services', isTopLevel: false },
  { id: 'dns-host-overrides', label: 'DNS Host Overrides', path: '/services/dns/overrides', icon: 'EditAttributes', category: 'services', isTopLevel: false },
  { id: 'ntp', label: 'NTP', path: '/services/ntp', icon: 'AccessTime', category: 'services', isTopLevel: false },
  { id: 'ssh', label: 'SSH', path: '/services/ssh', icon: 'Terminal', category: 'services', isTopLevel: false },
  { id: 'cron-jobs', label: 'Cron Jobs', path: '/services/cron', icon: 'Timer', category: 'services', isTopLevel: false },

  // System sub-pages
  { id: 'system-users', label: 'Users', path: '/system/users', icon: 'People', category: 'system', isTopLevel: false },
  { id: 'system-certificates', label: 'Certificates', path: '/system/certificates', icon: 'VerifiedUser', category: 'system', isTopLevel: false },
  { id: 'system-firmware', label: 'Firmware', path: '/system/firmware', icon: 'SystemUpdate', category: 'system', isTopLevel: false },
  { id: 'system-diagnostics', label: 'Diagnostics', path: '/system/diagnostics', icon: 'BugReport', category: 'system', isTopLevel: false },
  { id: 'terminal', label: 'Terminal', path: '/system/terminal', icon: 'Code', category: 'system', isTopLevel: false },
  { id: 'system-general', label: 'General Setup', path: '/system/general', icon: 'Tune', category: 'system', isTopLevel: false },
  { id: 'system-packages', label: 'Packages', path: '/system/packages', icon: 'Inventory', category: 'system', isTopLevel: false },
  { id: 'system-tunables', label: 'Tunables', path: '/system/tunables', icon: 'Build', category: 'system', isTopLevel: false },

  // Monitoring sub-pages
  { id: 'monitoring-traffic', label: 'Traffic Graphs', path: '/monitoring/traffic', icon: 'ShowChart', category: 'monitoring', isTopLevel: false },
  { id: 'monitoring-logs', label: 'Live Logs', path: '/monitoring/logs', icon: 'Receipt', category: 'monitoring', isTopLevel: false },
  { id: 'monitoring-states', label: 'State Table', path: '/monitoring/states', icon: 'TableChart', category: 'monitoring', isTopLevel: false },
  { id: 'monitoring-gateways', label: 'Gateways', path: '/monitoring/gateways', icon: 'CellTower', category: 'monitoring', isTopLevel: false },
];

export function getPagesByCategory(): Map<string, PageEntry[]> {
  const map = new Map<string, PageEntry[]>();
  for (const page of PAGE_REGISTRY) {
    const list = map.get(page.category) ?? [];
    list.push(page);
    map.set(page.category, list);
  }
  return map;
}

export function getPageById(id: string): PageEntry | undefined {
  return PAGE_REGISTRY.find((p) => p.id === id);
}
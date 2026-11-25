/**
 * Mock API client for demo mode.
 * When VITE_DEMO_MODE=true, this replaces the real Axios client
 * so the app renders with sample data on GitHub Pages.
 */

import {
  MOCK_SYSTEM_STATUS,
  MOCK_GATEWAYS,
  MOCK_INTERFACES,
  MOCK_SERVICES,
  MOCK_FIREWALL_RULES,
  MOCK_NAT_PORT_FORWARDS,
  MOCK_DHCP_LEASES,
  MOCK_ARP_ENTRIES,
  MOCK_USERS,
  MOCK_LOGS,
  MOCK_STATE_TABLE_SIZE,
  MOCK_ALIASES,
  MOCK_SCHEDULES,
  MOCK_FIREWALL_ADVANCED_SETTINGS,
} from './mockData';

const delay = (ms = 200) => new Promise((resolve) => setTimeout(resolve, ms));

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type MockResponse = any;

const ROUTES: Record<string, () => MockResponse> = {
  // Status endpoints — must match ApiResponse<{ items: T[] }> shape expected by status.ts
  'GET /api/v2/status/system': () => ({ data: MOCK_SYSTEM_STATUS }),
  'GET /api/v2/status/gateways': () => ({ data: { items: MOCK_GATEWAYS } }),
  'GET /api/v2/status/interfaces': () => ({ data: { items: MOCK_INTERFACES } }),
  'GET /api/v2/status/services': () => ({ data: { items: MOCK_SERVICES } }),
  'GET /api/v2/system/version': () => ({ data: { version: MOCK_SYSTEM_STATUS.version, platform: MOCK_SYSTEM_STATUS.platform } }),
  'GET /api/v2/firewall/states/size': () => ({ data: MOCK_STATE_TABLE_SIZE }),
  // Firewall
  'GET /api/v2/firewall/rules': () => ({ data: MOCK_FIREWALL_RULES }),
  'GET /api/v2/firewall/nat/port_forwards': () => ({ data: MOCK_NAT_PORT_FORWARDS }),
  'GET /api/v2/firewall/nat/outbound/mappings': () => ({ data: [] }),
  'GET /api/v2/firewall/nat/one_to_one/mappings': () => ({ data: [] }),
  'GET /api/v2/firewall/aliases': () => ({ data: MOCK_ALIASES }),
  'GET /api/v2/firewall/schedules': () => ({ data: MOCK_SCHEDULES }),
  'GET /api/v2/firewall/advanced_settings': () => ({ data: MOCK_FIREWALL_ADVANCED_SETTINGS }),
  'GET /api/v2/firewall/states': () => ({ data: [] }),
  'GET /api/v2/firewall/virtual_ips': () => ({
    data: {
      items: [
        { id: 0, mode: 'carp', interface: 'wan', type: 'single', subnet: '198.51.100.10', subnet_bits: 32, descr: 'WAN CARP VIP', noexpand: false },
        { id: 1, mode: 'ipalias', interface: 'lan', type: 'single', subnet: '192.168.1.100', subnet_bits: 32, descr: 'LAN IP Alias', noexpand: false },
        { id: 2, mode: 'proxyarp', interface: 'opt1', type: 'network', subnet: '10.10.10.0', subnet_bits: 24, descr: 'DMZ Proxy ARP Range', noexpand: true },
      ],
    },
  }),
  'GET /api/v2/firewall/nat/outbound/mode': () => ({ data: { mode: 'automatic' } }),
  // Interfaces
  'GET /api/v2/interfaces': () => ({ data: MOCK_INTERFACES }),
  'GET /api/v2/interface/available_interfaces': () => ({ data: [] }),
  'GET /api/v2/interface/vlans': () => ({ data: [] }),
  'GET /api/v2/interface/bridges': () => ({ data: [] }),
  'GET /api/v2/interface/laggs': () => ({
    data: {
      items: [
        { id: 'lagg0', members: ['em0', 'em1'], proto: 'lacp', descr: 'WAN LAGG', lacptimeout: 'fast' },
        { id: 'lagg1', members: ['em2', 'em3'], proto: 'failover', descr: 'LAN Failover' },
      ],
    },
  }),
  'GET /api/v2/interface/gres': () => ({
    data: {
      items: [
        { id: 'gre0', localaddr: '192.168.1.1', remoteaddr: '10.0.0.1', address: '172.16.0.1', subnet: 30, descr: 'Site-to-Site GRE' },
        { id: 'gre1', localaddr: '192.168.1.1', remoteaddr: '10.0.0.2', address: '172.16.0.5', subnet: 30, descr: 'Branch Office Tunnel' },
      ],
    },
  }),
  'GET /api/v2/interface/groups': () => ({
    data: {
      items: [
        { id: 'grp0', name: 'WANGROUP', members: ['wan', 'opt1'], descr: 'WAN Interfaces Group' },
        { id: 'grp1', name: 'LANGROUP', members: ['lan', 'opt2'], descr: 'LAN Interfaces Group' },
      ],
    },
  }),
  // VPN
  'GET /api/v2/vpn/openvpn/servers': () => ({ data: [] }),
  'GET /api/v2/vpn/openvpn/clients': () => ({ data: [] }),
  'GET /api/v2/vpn/wireguard/tunnels': () => ({ data: [] }),
  'GET /api/v2/vpn/wireguard/peers': () => ({ data: [] }),
  'GET /api/v2/vpn/wireguard/settings': () => ({ data: {} }),
  'GET /api/v2/vpn/ipsec/phase1s': () => ({ data: [] }),
  'GET /api/v2/vpn/ipsec/phase2s': () => ({ data: [] }),
  'GET /api/v2/status/openvpn/servers': () => ({ data: [] }),
  'GET /api/v2/status/wireguard/tunnels': () => ({ data: [] }),
  'GET /api/v2/status/ipsec/sas': () => ({ data: [] }),
  // System
  'GET /api/v2/system/certificates': () => ({ data: [] }),
  'GET /api/v2/users': () => ({ data: MOCK_USERS }),
  'GET /api/v2/user_groups': () => ({ data: [{ name: 'admins' }, { name: 'viewers' }] }),
  'GET /api/v2/system/hostname': () => ({ data: { hostname: 'pfsense-demo', domain: 'localdomain' } }),
  'GET /api/v2/system/timezone': () => ({ data: { timezone: 'America/Sao_Paulo' } }),
  'GET /api/v2/system/dns': () => ({ data: { servers: ['1.1.1.1', '8.8.8.8'] } }),
  'GET /api/v2/system/update': () => ({ data: { status: 'up-to-date' } }),
  'GET /api/v2/system/packages': () => ({ data: [] }),
  'GET /api/v2/system/tunables': () => ({ data: [] }),
  'GET /api/v2/diagnostics/arp_table': () => ({ data: MOCK_ARP_ENTRIES }),
    // Services
  'GET /api/v2/services/dhcp_servers': () => ({ data: [] }),
  'GET /api/v2/services/dhcp_server/static_mappings': () => ({
    data: [
      { id: 1, mac_address: '00:1A:2B:3C:4D:5E', ip_address: '192.168.1.10', hostname: 'gateway-printer', description: 'Office printer', interface: 'lan' },
      { id: 2, mac_address: 'AA:BB:CC:DD:EE:01', ip_address: '192.168.1.20', hostname: 'nas-server', description: 'NAS storage', interface: 'lan' },
      { id: 3, mac_address: 'AA:BB:CC:DD:EE:02', ip_address: '192.168.1.30', hostname: 'dev-workstation', description: 'Developer workstation', interface: 'lan' },
      { id: 4, mac_address: '11:22:33:44:55:66', ip_address: '10.10.10.10', hostname: 'web-server', description: 'Public web server', interface: 'dmz' },
      { id: 5, mac_address: '11:22:33:44:55:77', ip_address: '10.10.10.20', hostname: 'mail-server', description: 'Mail relay', interface: 'dmz' },
      { id: 6, mac_address: 'DE:AD:BE:EF:00:01', ip_address: '172.16.0.10', hostname: 'smart-thermostat', description: 'IoT thermostat', interface: 'iot' },
      { id: 7, mac_address: 'DE:AD:BE:EF:00:02', ip_address: '172.16.0.20', hostname: 'security-camera', description: 'Front door camera', interface: 'iot' },
      { id: 8, mac_address: 'DE:AD:BE:EF:00:03', ip_address: '172.16.0.30', hostname: 'smart-lock', description: 'Main entrance lock', interface: 'iot' },
    ],
  }),
  'GET /api/v2/status/dhcp_server/leases': () => ({ data: MOCK_DHCP_LEASES }),
  'GET /api/v2/services/dns_resolver/settings': () => ({ data: {} }),
  'GET /api/v2/services/dns_resolver/host_overrides': () => ({ data: [] }),
  'GET /api/v2/services/ntp/settings': () => ({ data: {} }),
  'GET /api/v2/services/ntp/time_servers': () => ({ data: [] }),
  'GET /api/v2/services/ssh': () => ({ data: {} }),
  'GET /api/v2/services/cron_jobs': () => ({ data: [] }),
  // DNS Forwarder
  'GET /api/v2/services/dns_forwarder/settings': () => ({ data: {} }),
  'GET /api/v2/services/dns_forwarder/host_overrides': () => ({ data: [] }),
};

const LOG_ROUTES: Record<string, () => MockResponse> = {
  'GET /api/v2/status/logs/firewall': () => ({ data: MOCK_LOGS.filter((l) => l.source === 'firewall') }),
  'GET /api/v2/status/logs/system': () => ({ data: MOCK_LOGS.filter((l) => l.source === 'system') }),
  'GET /api/v2/status/logs/openvpn': () => ({ data: [] }),
  'GET /api/v2/status/logs/dhcp': () => ({ data: MOCK_LOGS.filter((l) => l.source === 'dhcpd') }),
  'GET /api/v2/status/logs/auth': () => {
    return { data: MOCK_LOGS.filter((l) => l.message.includes('logged in')) };
  },
};

export async function mockFetch(method: string, url: string): Promise<MockResponse> {
  await delay();
  // Normalize URL: strip query params and ensure /api/v2 prefix for matching
  const cleanUrl = url.split('?')[0];
  const normalizedUrl = cleanUrl.startsWith('/api/v2') ? cleanUrl : `/api/v2${cleanUrl}`;
  const key = `${method.toUpperCase()} ${normalizedUrl}`;
  const handler = ROUTES[key] || LOG_ROUTES[key];
  if (handler) return handler();
  // Default: return empty data for unhandled GET routes
  if (method.toUpperCase() === 'GET') return { data: [] };
  // Mutations succeed silently in demo mode
  return { code: 200, message: 'OK (demo mode)' };
}

export const IS_DEMO = import.meta.env.VITE_DEMO_MODE === 'true';
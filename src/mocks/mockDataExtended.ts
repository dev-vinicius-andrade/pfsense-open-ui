/**
 * Extended mock data for data source registry endpoints not covered by mockClient.ts.
 * These match the responseShape definitions in dataSourceRegistry.ts.
 */

export const MOCK_SYSTEM_STATUS_EXTENDED = {
  cpu_usage: 23,
  memory_usage: 45,
  disk_usage: 38,
  uptime: 86400,
  load_average: [0.42, 0.38, 0.35],
};

export const MOCK_OPENVPN_STATUS = [
  { name: 'vpn-server-1', status: 'connected', remote_ip: '10.8.0.1', connected_since: '2026-11-20T10:00:00Z' },
];

export const MOCK_WIREGUARD_STATUS = [
  { interface: 'wg0', status: 'active', peers: 2, last_handshake: '2026-11-24T08:30:00Z' },
];

export const MOCK_FIREWALL_RULES_COUNT = [
  { id: '1', action: 'pass', interface: 'wan', protocol: 'tcp' },
  { id: '2', action: 'pass', interface: 'lan', protocol: 'udp' },
  { id: '3', action: 'block', interface: 'wan', protocol: 'tcp' },
];
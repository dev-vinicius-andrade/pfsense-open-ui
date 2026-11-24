/**
 * Mock data for GitHub Pages demo deployment.
 * Activated when VITE_DEMO_MODE=true — all API calls return this data
 * instead of hitting a real pfSense instance.
 */

export const MOCK_SYSTEM_STATUS = {
  cpu_usage: 12,
  memory_usage: 34,
  disk_usage: 22,
  uptime: 1_232_000, // seconds (~14d 6h)
  load_average: [0.42, 0.38, 0.35],
  version: '2.9.0-RELEASE',
  platform: 'Netgate SG-3100',
};

export const MOCK_GATEWAYS = [
  { name: 'WAN_GW', address: '203.0.113.1', status: 'online', latency: 12.4, loss: 0 },
  { name: 'WAN_GWv6', address: '2001:db8::1', status: 'online', latency: 18.7, loss: 0 },
];

export const MOCK_INTERFACES = [
  { id: 'wan', name: 'WAN', descr: 'WAN', status: 'up', ipaddr: '203.0.113.42/24', media: '1000baseT <full-duplex>', in_bytes: 1_245_678_900, out_bytes: 876_543_210 },
  { id: 'lan', name: 'LAN', descr: 'LAN', status: 'up', ipaddr: '192.168.1.1/24', media: '1000baseT <full-duplex>', in_bytes: 987_654_321, out_bytes: 1_123_456_789 },
  { id: 'opt1', name: 'DMZ', descr: 'DMZ', status: 'up', ipaddr: '10.10.10.1/24', media: '1000baseT <full-duplex>', in_bytes: 45_678_900, out_bytes: 34_567_890 },
  { id: 'opt2', name: 'IOT', descr: 'IOT', status: 'down', ipaddr: '172.16.0.1/24', media: 'autoselect', in_bytes: 0, out_bytes: 0 },
];

export const MOCK_SERVICES = [
  { name: 'dhcpd', description: 'DHCP Server', status: 'running' },
  { name: 'unbound', description: 'DNS Resolver', status: 'running' },
  { name: 'ntpd', description: 'NTP Service', status: 'running' },
  { name: 'sshd', description: 'Secure Shell', status: 'running' },
  { name: 'openvpn', description: 'OpenVPN Server', status: 'running' },
  { name: 'wireguard', description: 'WireGuard', status: 'stopped' },
];

export const MOCK_FIREWALL_RULES = [
  { id: 0, enabled: true, action: 'pass', protocol: 'tcp', source: 'any', destination: 'any', port: '443', description: 'Allow HTTPS outbound', interface: 'lan' },
  { id: 1, enabled: true, action: 'pass', protocol: 'tcp', source: 'any', destination: 'any', port: '80', description: 'Allow HTTP outbound', interface: 'lan' },
  { id: 2, enabled: true, action: 'pass', protocol: 'udp', source: 'any', destination: 'any', port: '53', description: 'Allow DNS outbound', interface: 'lan' },
  { id: 3, enabled: false, action: 'block', protocol: 'any', source: '192.168.1.100', destination: 'any', port: '', description: 'Block guest device', interface: 'lan' },
  { id: 4, enabled: true, action: 'pass', protocol: 'tcp', source: 'any', destination: '192.168.1.10', port: '22', description: 'SSH to management server', interface: 'lan' },
  { id: 5, enabled: true, action: 'block', protocol: 'any', source: 'any', destination: 'any', port: '', description: 'Default deny', interface: 'wan' },
];

export const MOCK_NAT_PORT_FORWARDS = [
  { id: 0, enabled: true, interface: 'wan', protocol: 'tcp', source: 'any', destination: 'wan_address', dest_port: '443', target_ip: '192.168.1.10', target_port: '443', description: 'HTTPS to web server' },
  { id: 1, enabled: true, interface: 'wan', protocol: 'tcp', source: 'any', destination: 'wan_address', dest_port: '2222', target_ip: '192.168.1.10', target_port: '22', description: 'SSH to management (alt port)' },
];

export const MOCK_DHCP_LEASES = [
  { ip: '192.168.1.100', mac: 'aa:bb:cc:dd:ee:01', hostname: 'desktop-pc', start: '2026-11-23T08:00:00Z', end: '2026-11-24T08:00:00Z', status: 'active' },
  { ip: '192.168.1.101', mac: 'aa:bb:cc:dd:ee:02', hostname: 'laptop', start: '2026-11-23T10:30:00Z', end: '2026-11-24T10:30:00Z', status: 'active' },
  { ip: '192.168.1.102', mac: 'aa:bb:cc:dd:ee:03', hostname: 'phone', start: '2026-11-23T12:00:00Z', end: '2026-11-24T12:00:00Z', status: 'active' },
  { ip: '192.168.1.150', mac: 'aa:bb:cc:dd:ee:10', hostname: 'printer', start: '2026-11-20T00:00:00Z', end: '2027-11-20T00:00:00Z', status: 'static' },
];

export const MOCK_USERS = [
  { username: 'admin', scope: 'local', groups: ['admins'], privileges: ['page-all'], disabled: false },
  { username: 'readonly', scope: 'local', groups: ['viewers'], privileges: ['page-dashboard-all', 'page-status-all'], disabled: false },
];

export const MOCK_LOGS = Array.from({ length: 50 }, (_, i) => ({
  timestamp: new Date(Date.now() - i * 60_000).toISOString(),
  severity: i % 20 === 0 ? 'error' : i % 7 === 0 ? 'warning' : 'info',
  source: ['firewall', 'system', 'dhcpd', 'unbound'][i % 4],
  message: [
    'Blocked TCP 10.0.0.5:44321 → 203.0.113.42:22 (WAN)',
    'User admin logged in from 192.168.1.100',
    'DHCPDISCOVER from aa:bb:cc:dd:ee:04 via lan',
    'resolvconf: nameserver updated',
    'kernel: igb0: link state changed to UP',
    'unbound: query A example.com from 192.168.1.101',
  ][i % 6],
}));

export const MOCK_STATE_TABLE_SIZE = { count: 247, max: 131072, usage_percent: (247 / 131072) * 100 };
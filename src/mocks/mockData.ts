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
  { ip_address: '192.168.1.100', mac_address: 'aa:bb:cc:dd:ee:01', hostname: 'desktop-pc', starts: '2026-11-23T08:00:00Z', ends: '2026-11-24T08:00:00Z', status: 'active', interface: 'lan' },
  { ip_address: '192.168.1.101', mac_address: 'aa:bb:cc:dd:ee:02', hostname: 'laptop', starts: '2026-11-23T10:30:00Z', ends: '2026-11-24T10:30:00Z', status: 'active', interface: 'lan' },
  { ip_address: '192.168.1.102', mac_address: 'aa:bb:cc:dd:ee:03', hostname: 'phone', starts: '2026-11-23T12:00:00Z', ends: '2026-11-24T12:00:00Z', status: 'active', interface: 'lan' },
  { ip_address: '192.168.1.150', mac_address: 'aa:bb:cc:dd:ee:10', hostname: 'printer', starts: '2026-11-20T00:00:00Z', ends: '2027-11-20T00:00:00Z', status: 'active', interface: 'lan' },
  { ip_address: '192.168.1.103', mac_address: 'aa:bb:cc:dd:ee:04', hostname: 'tablet', starts: '2026-11-22T06:00:00Z', ends: '2026-11-23T06:00:00Z', status: 'expired', interface: 'lan' },
  { ip_address: '192.168.1.104', mac_address: 'aa:bb:cc:dd:ee:05', hostname: 'guest-phone', starts: '2026-11-23T14:00:00Z', ends: '2026-11-23T14:30:00Z', status: 'released', interface: 'opt1' },
  { ip_address: '10.10.10.50', mac_address: 'aa:bb:cc:dd:ee:06', hostname: 'dmz-server', starts: '2026-11-23T09:00:00Z', ends: '2026-11-24T09:00:00Z', status: 'active', interface: 'opt1' },
];

export const MOCK_ARP_ENTRIES = [
  { ip_address: '192.168.1.100', mac_address: 'aa:bb:cc:dd:ee:01', interface: 'lan', expires: '1200', type: 'dynamic' as const },
  { ip_address: '192.168.1.101', mac_address: 'aa:bb:cc:dd:ee:02', interface: 'lan', expires: '900', type: 'dynamic' as const },
  { ip_address: '192.168.1.102', mac_address: 'aa:bb:cc:dd:ee:03', interface: 'lan', expires: '600', type: 'dynamic' as const },
  { ip_address: '192.168.1.1', mac_address: '00:11:22:33:44:55', interface: 'wan', type: 'permanent' as const },
  { ip_address: '10.10.10.50', mac_address: 'aa:bb:cc:dd:ee:06', interface: 'opt1', expires: '1800', type: 'dynamic' as const },
  { ip_address: '192.168.1.150', mac_address: 'aa:bb:cc:dd:ee:10', interface: 'lan', type: 'static' as const },
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

export const MOCK_ALIASES = [
  { name: 'RFC1918', type: 'network' as const, description: 'Private RFC1918 networks', content: ['10.0.0.0/8', '172.16.0.0/12', '192.168.0.0/16'] },
  { name: 'WebServers', type: 'host' as const, description: 'Production web servers', content: ['192.168.1.10', '192.168.1.11'] },
  { name: 'AllowedPorts', type: 'port' as const, description: 'Commonly allowed outbound ports', content: ['80', '443', '53', '22'] },
  { name: 'BlockList', type: 'url' as const, description: 'External blocklist feed', content: ['https://example.com/blocklist.txt'] },
];

export const MOCK_SCHEDULES = [
  { name: 'BusinessHours', description: 'Monday-Friday 8am-6pm', timerange: [{ month: '', day: 'Mon,Tue,Wed,Thu,Fri', hour: '8:00-18:00' }] },
  { name: 'Weekend', description: 'Saturday and Sunday all day', timerange: [{ month: '', day: 'Sat,Sun', hour: '0:00-23:59' }] },
  { name: 'MaintenanceWindow', description: 'Sunday 2am-4am maintenance', timerange: [{ month: '', day: 'Sun', hour: '2:00-4:00' }] },
];

export const MOCK_FIREWALL_ADVANCED_SETTINGS = {
  disable_filter: false,
  allow_private_networks: false,
  bogon_networks: true,
  rfc_1918: true,
  max_states: 131072,
  max_src_nodes: 1000,
  max_src_conn: 1000,
  max_src_conn_rate_count: 100,
  max_src_conn_rate_seconds: 10,
};
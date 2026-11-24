export interface DataSourceDefinition {
  id: string;
  label: string;
  description: string;
  endpoint: string;
  method: 'GET';
  responseShape: Record<string, string>;
  defaultFieldMapping?: Record<string, string>;
  category: string;
}

export const DATA_SOURCE_REGISTRY: DataSourceDefinition[] = [
  {
    id: 'system-cpu',
    label: 'CPU Usage',
    description: 'Current CPU utilization percentage',
    endpoint: '/status/system',
    method: 'GET',
    responseShape: { cpu_usage: 'number' },
    defaultFieldMapping: { value: 'cpu_usage' },
    category: 'system',
  },
  {
    id: 'system-memory',
    label: 'Memory Usage',
    description: 'Current memory utilization percentage',
    endpoint: '/status/system',
    method: 'GET',
    responseShape: { memory_usage: 'number' },
    defaultFieldMapping: { value: 'memory_usage' },
    category: 'system',
  },
  {
    id: 'system-disk',
    label: 'Disk Usage',
    description: 'Current disk utilization percentage',
    endpoint: '/status/system',
    method: 'GET',
    responseShape: { disk_usage: 'number' },
    defaultFieldMapping: { value: 'disk_usage' },
    category: 'system',
  },
  {
    id: 'system-uptime',
    label: 'Uptime',
    description: 'System uptime in seconds',
    endpoint: '/status/system',
    method: 'GET',
    responseShape: { uptime: 'number' },
    defaultFieldMapping: { value: 'uptime' },
    category: 'system',
  },
  {
    id: 'system-load',
    label: 'Load Average',
    description: '1/5/15 minute load averages',
    endpoint: '/status/system',
    method: 'GET',
    responseShape: { load_average: 'number[]' },
    category: 'system',
  },
  {
    id: 'gateway-status',
    label: 'Gateway Status',
    description: 'Gateway monitoring status list',
    endpoint: '/status/gateways',
    method: 'GET',
    responseShape: { items: 'Gateway[]' },
    category: 'network',
  },
  {
    id: 'interface-status',
    label: 'Interface Status',
    description: 'Network interface status and traffic',
    endpoint: '/status/interfaces',
    method: 'GET',
    responseShape: { items: 'InterfaceStatus[]' },
    category: 'network',
  },
  {
    id: 'service-status',
    label: 'Service Status',
    description: 'Running services list',
    endpoint: '/status/services',
    method: 'GET',
    responseShape: { items: 'Service[]' },
    category: 'services',
  },
  {
    id: 'state-table-size',
    label: 'State Table',
    description: 'Firewall state table usage',
    endpoint: '/firewall/states/size',
    method: 'GET',
    responseShape: { count: 'number', max: 'number', usage_percent: 'number' },
    defaultFieldMapping: { value: 'usage_percent' },
    category: 'security',
  },
  {
    id: 'dhcp-leases',
    label: 'DHCP Leases',
    description: 'Active DHCP lease list',
    endpoint: '/status/dhcp_server/leases',
    method: 'GET',
    responseShape: { data: 'DhcpLease[]' },
    category: 'services',
  },
  {
    id: 'firewall-rules-count',
    label: 'Firewall Rules Count',
    description: 'Total number of firewall rules',
    endpoint: '/firewall/rules',
    method: 'GET',
    responseShape: { data: 'FirewallRule[]' },
    category: 'security',
  },
  {
    id: 'openvpn-status',
    label: 'OpenVPN Status',
    description: 'OpenVPN server connection status',
    endpoint: '/status/openvpn/servers',
    method: 'GET',
    responseShape: { data: 'OpenVpnStatus[]' },
    category: 'services',
  },
  {
    id: 'wireguard-status',
    label: 'WireGuard Status',
    description: 'WireGuard tunnel status',
    endpoint: '/status/wireguard/tunnels',
    method: 'GET',
    responseShape: { data: 'WireGuardStatus[]' },
    category: 'services',
  },
  {
    id: 'system-version',
    label: 'System Version',
    description: 'pfSense version information',
    endpoint: '/system/version',
    method: 'GET',
    responseShape: { version: 'string', platform: 'string' },
    category: 'system',
  },
];

export function getDataSourceById(id: string): DataSourceDefinition | undefined {
  return DATA_SOURCE_REGISTRY.find((ds) => ds.id === id);
}

export function getDataSourcesByCategory(): Map<string, DataSourceDefinition[]> {
  const map = new Map<string, DataSourceDefinition[]>();
  for (const ds of DATA_SOURCE_REGISTRY) {
    const list = map.get(ds.category) ?? [];
    list.push(ds);
    map.set(ds.category, list);
  }
  return map;
}
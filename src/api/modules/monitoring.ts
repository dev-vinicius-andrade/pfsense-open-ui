import { get, del } from '@/api/client';
import type { ApiResponse, PaginatedResponse } from '@/api/types';

// --- Types ---

export interface InterfaceTrafficCounters {
  [interfaceName: string]: {
    name: string;
    status: 'up' | 'down' | 'unknown';
    'in-bytes': number;
    'out-bytes': number;
    'in-packets': number;
    'out-packets': number;
    'in-errors': number;
    'out-errors': number;
    speed?: string;
    mac?: string;
    mtu?: number;
  };
}

export type LogSeverity = 'error' | 'warning' | 'info' | 'debug';
export type LogSource = 'firewall' | 'system' | 'openvpn' | 'dhcp' | 'auth';

export interface LogEntry {
  timestamp: string;
  severity: LogSeverity;
  source: string;
  message: string;
  raw?: string;
}

export interface FirewallState {
  id: string;
  protocol: string;
  source: string;
  'source-port': string;
  destination: string;
  'dest-port': string;
  state: string;
  age: number;
  expiry: number;
  bytes?: number;
  packets?: number;
}

export interface GatewayStatus {
  name: string;
  address: string;
  status: 'online' | 'offline' | 'lossy' | 'latency';
  latency: number;
  loss: number;
  monitor: string;
  description?: string;
}

export interface StateTableSize {
  count: number;
  limit: number;
  usage_percent: number;
}

// --- Query Params ---

export interface LogQueryParams {
  limit?: number;
  offset?: number;
  severity?: LogSeverity;
  search?: string;
}

export interface StateTableQueryParams {
  page?: number;
  perPage?: number;
  search?: string;
  protocol?: string;
}

// --- API Functions ---

const LOG_ENDPOINTS: Record<LogSource, string> = {
  firewall: '/status/logs/firewall',
  system: '/status/logs/system',
  openvpn: '/status/logs/openvpn',
  dhcp: '/status/logs/dhcp',
  auth: '/status/logs/auth',
};

export async function fetchInterfaceCounters(): Promise<ApiResponse<InterfaceTrafficCounters>> {
  return get<ApiResponse<InterfaceTrafficCounters>>('/status/interfaces');
}

export async function fetchLogs(
  source: LogSource,
  params?: LogQueryParams,
): Promise<ApiResponse<LogEntry[]>> {
  const endpoint = LOG_ENDPOINTS[source];
  return get<ApiResponse<LogEntry[]>>(endpoint, { params });
}

export async function fetchFirewallStates(
  params?: StateTableQueryParams,
): Promise<PaginatedResponse<FirewallState>> {
  return get<PaginatedResponse<FirewallState>>('/firewall/states', { params });
}

export async function killFirewallState(stateId: string): Promise<ApiResponse<null>> {
  return del<ApiResponse<null>>('/firewall/states', {
    data: { id: stateId },
  });
}

export async function fetchStateTableSize(): Promise<ApiResponse<StateTableSize>> {
  return get<ApiResponse<StateTableSize>>('/firewall/states/size');
}

export async function fetchGateways(): Promise<ApiResponse<GatewayStatus[]>> {
  return get<ApiResponse<GatewayStatus[]>>('/status/gateways');
}
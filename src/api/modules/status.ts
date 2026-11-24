import { get } from '../client';
import type { ApiResponse, SystemVersion } from '../types';

// --- System Status ---

export interface SystemStatus {
  cpu_usage: number;
  memory_usage: number;
  disk_usage: number;
  uptime: number;
  load_average: [number, number, number];
  temp?: number;
}

export async function fetchSystemStatus(): Promise<SystemStatus> {
  const response = await get<ApiResponse<SystemStatus>>('/status/system');
  return response.data;
}

// --- Gateway Status ---

export interface Gateway {
  name: string;
  address: string;
  status: 'online' | 'offline' | 'warning' | 'unknown';
  latency: number;
  loss: number;
  monitor: string;
  description: string;
}

export interface GatewaysResponse {
  items: Gateway[];
}

export async function fetchGateways(): Promise<Gateway[]> {
  const response = await get<ApiResponse<GatewaysResponse>>('/status/gateways');
  return response.data.items;
}

// --- Interface Status ---

export interface InterfaceStatus {
  id: string;
  descr: string;
  status: 'up' | 'down' | 'no carrier' | 'unknown';
  ipaddr: string;
  ipaddrv6?: string;
  macaddr: string;
  mtu: number;
  in_bytes: number;
  out_bytes: number;
  in_packets: number;
  out_packets: number;
  speed?: string;
  media?: string;
}

export interface InterfacesResponse {
  items: InterfaceStatus[];
}

export async function fetchInterfaces(): Promise<InterfaceStatus[]> {
  const response = await get<ApiResponse<InterfacesResponse>>('/status/interfaces');
  return response.data.items;
}

// --- Services Status ---

export interface Service {
  id: string;
  name: string;
  status: 'running' | 'stopped' | 'unknown';
  category: string;
  description: string;
}

export interface ServicesResponse {
  items: Service[];
}

export async function fetchServices(): Promise<Service[]> {
  const response = await get<ApiResponse<ServicesResponse>>('/status/services');
  return response.data.items;
}

// --- System Version ---

export async function fetchSystemVersion(): Promise<SystemVersion> {
  const response = await get<ApiResponse<SystemVersion>>('/system/version');
  return response.data;
}

// --- Firewall States Size ---

export interface StateTableSize {
  count: number;
  max: number;
  usage_percent: number;
}

export async function fetchStateTableSize(): Promise<StateTableSize> {
  const response = await get<ApiResponse<StateTableSize>>('/firewall/states/size');
  return response.data;
}
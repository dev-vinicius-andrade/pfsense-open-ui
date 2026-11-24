import { get, post, patch, put, del } from '../client';
import type { ApiResponse } from '../types';

// --- Port Forward ---

export interface PortForward {
  id: number;
  disabled: boolean;
  noreplyto: boolean;
  natreflection: 'default' | 'enable' | 'purenat' | 'disable';
  interface: string;
  ipprotocol: 'inet' | 'inet6';
  protocol: 'tcp' | 'udp' | 'tcp/udp' | 'icmp' | 'esp' | 'ah' | 'gre' | 'ipv6' | 'igmp' | 'pim' | 'ospf';
  source: string;
  sourceport?: string;
  destination: string;
  destport: string;
  target: string;
  local_port: string;
  descr: string;
  nosync: boolean;
}

export interface PortForwardsResponse {
  items: PortForward[];
}

export async function fetchPortForwards(): Promise<PortForward[]> {
  const response = await get<ApiResponse<PortForwardsResponse>>('/firewall/nat/port_forwards');
  return response.data.items;
}

export async function fetchPortForward(id: number): Promise<PortForward> {
  const response = await get<ApiResponse<PortForward>>('/firewall/nat/port_forward', {
    params: { id },
  });
  return response.data;
}

export async function createPortForward(data: Partial<PortForward>): Promise<PortForward> {
  const response = await post<ApiResponse<PortForward>>('/firewall/nat/port_forward', data);
  return response.data;
}

export async function updatePortForward(id: number, data: Partial<PortForward>): Promise<PortForward> {
  const response = await patch<ApiResponse<PortForward>>('/firewall/nat/port_forward', {
    id,
    ...data,
  });
  return response.data;
}

export async function deletePortForward(id: number): Promise<void> {
  await del('/firewall/nat/port_forward', { params: { id } });
}

export async function reorderPortForwards(ids: number[]): Promise<void> {
  await put('/firewall/nat/port_forwards', ids);
}

// --- Outbound NAT Mode ---

export type NatMode = 'automatic' | 'hybrid' | 'manual';

export interface NatModeResponse {
  mode: NatMode;
}

export async function fetchOutboundNatMode(): Promise<NatMode> {
  const response = await get<ApiResponse<NatModeResponse>>('/firewall/nat/outbound/mode');
  return response.data.mode;
}

export async function updateOutboundNatMode(mode: NatMode): Promise<void> {
  await patch('/firewall/nat/outbound/mode', { mode });
}

// --- Outbound NAT Mapping ---

export interface OutboundNatMapping {
  id: number;
  disabled: boolean;
  nonat: boolean;
  interface: string;
  ipprotocol: 'inet' | 'inet6';
  protocol: 'tcp' | 'udp' | 'tcp/udp' | 'icmp' | 'esp' | 'ah' | 'gre' | 'ipv6' | 'igmp' | 'pim' | 'ospf' | 'any';
  source: string;
  sourceport?: string;
  destination: string;
  destport?: string;
  target: string;
  targetport?: string;
  staticnatport: boolean;
  nosync: boolean;
  descr: string;
}

export interface OutboundNatMappingsResponse {
  items: OutboundNatMapping[];
}

export async function fetchOutboundNatMappings(): Promise<OutboundNatMapping[]> {
  const response = await get<ApiResponse<OutboundNatMappingsResponse>>('/firewall/nat/outbound/mappings');
  return response.data.items;
}

export async function fetchOutboundNatMapping(id: number): Promise<OutboundNatMapping> {
  const response = await get<ApiResponse<OutboundNatMapping>>('/firewall/nat/outbound/mapping', {
    params: { id },
  });
  return response.data;
}

export async function createOutboundNatMapping(data: Partial<OutboundNatMapping>): Promise<OutboundNatMapping> {
  const response = await post<ApiResponse<OutboundNatMapping>>('/firewall/nat/outbound/mapping', data);
  return response.data;
}

export async function updateOutboundNatMapping(
  id: number,
  data: Partial<OutboundNatMapping>,
): Promise<OutboundNatMapping> {
  const response = await patch<ApiResponse<OutboundNatMapping>>('/firewall/nat/outbound/mapping', {
    id,
    ...data,
  });
  return response.data;
}

export async function deleteOutboundNatMapping(id: number): Promise<void> {
  await del('/firewall/nat/outbound/mapping', { params: { id } });
}

export async function reorderOutboundNatMappings(ids: number[]): Promise<void> {
  await put('/firewall/nat/outbound/mappings', ids);
}

// --- 1:1 NAT Mapping ---

export interface OneToOneNatMapping {
  id: number;
  disabled: boolean;
  interface: string;
  ipprotocol: 'inet' | 'inet6';
  external: string;
  source: string;
  destination: string;
  descr: string;
  natreflection: 'default' | 'enable' | 'disable';
  nosync: boolean;
}

export interface OneToOneNatMappingsResponse {
  items: OneToOneNatMapping[];
}

export async function fetchOneToOneNatMappings(): Promise<OneToOneNatMapping[]> {
  const response = await get<ApiResponse<OneToOneNatMappingsResponse>>('/firewall/nat/one_to_one/mappings');
  return response.data.items;
}

export async function fetchOneToOneNatMapping(id: number): Promise<OneToOneNatMapping> {
  const response = await get<ApiResponse<OneToOneNatMapping>>('/firewall/nat/one_to_one/mapping', {
    params: { id },
  });
  return response.data;
}

export async function createOneToOneNatMapping(data: Partial<OneToOneNatMapping>): Promise<OneToOneNatMapping> {
  const response = await post<ApiResponse<OneToOneNatMapping>>('/firewall/nat/one_to_one/mapping', data);
  return response.data;
}

export async function updateOneToOneNatMapping(
  id: number,
  data: Partial<OneToOneNatMapping>,
): Promise<OneToOneNatMapping> {
  const response = await patch<ApiResponse<OneToOneNatMapping>>('/firewall/nat/one_to_one/mapping', {
    id,
    ...data,
  });
  return response.data;
}

export async function deleteOneToOneNatMapping(id: number): Promise<void> {
  await del('/firewall/nat/one_to_one/mapping', { params: { id } });
}

export async function reorderOneToOneNatMappings(ids: number[]): Promise<void> {
  await put('/firewall/nat/one_to_one/mappings', ids);
}

// --- Virtual IPs ---

export interface VirtualIp {
  id: number;
  mode: 'proxyarp' | 'carp' | 'other' | 'ipalias';
  interface: string;
  type: 'single' | 'network' | 'range';
  subnet: string;
  subnet_bits: number;
  descr: string;
  noexpand: boolean;
}

export interface VirtualIpsResponse {
  items: VirtualIp[];
}

export async function fetchVirtualIps(): Promise<VirtualIp[]> {
  const response = await get<ApiResponse<VirtualIpsResponse>>('/firewall/virtual_ips');
  return response.data.items;
}
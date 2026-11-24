import { get, post, patch, del } from '../client';
import type { ApiResponse } from '../types';

// --- Types ---

export type Ipv4ConfigType = 'none' | 'static' | 'dhcp' | 'pppoe' | 'pptp' | 'l2tp';
export type Ipv6ConfigType = 'none' | 'static' | 'slaac' | 'dhcp6' | '6to4' | 'track6';
export type InterfaceStatus = 'up' | 'down' | 'no carrier' | 'unknown';

export interface InterfaceConfig {
  id: string;
  if: string;
  descr: string;
  enable: boolean;
  ipv4_type: Ipv4ConfigType;
  ipv4_address?: string;
  ipv4_subnet?: number;
  ipv4_gateway?: string;
  ipv6_type: Ipv6ConfigType;
  ipv6_address?: string;
  ipv6_subnet?: number;
  ipv6_gateway?: string;
  mtu?: number;
  mss?: number;
  speed_duplex?: string;
  macaddr?: string;
  blockpriv: boolean;
  blockbogons: boolean;
  status?: InterfaceStatus;
}

export interface InterfacesResponse {
  items: InterfaceConfig[];
}

export interface AvailableInterface {
  port: string;
  descr: string;
  macaddr: string;
  media?: string;
}

export interface AvailableInterfacesResponse {
  items: AvailableInterface[];
}

export interface Vlan {
  id: string;
  if: string;
  tag: number;
  pcp?: number;
  descr?: string;
}

export interface VlansResponse {
  items: Vlan[];
}

export interface Bridge {
  id: string;
  members: string[];
  descr?: string;
  stp?: boolean;
  maxaddr?: number;
  timeout?: number;
}

export interface BridgesResponse {
  items: Bridge[];
}

export type LaggProtocol = 'lacp' | 'failover' | 'loadbalance' | 'roundrobin' | 'none';

export interface Lagg {
  id: string;
  members: string[];
  proto: LaggProtocol;
  descr?: string;
  lacptimeout?: 'fast' | 'slow';
}

export interface LaggsResponse {
  items: Lagg[];
}

export interface Gre {
  id: string;
  localaddr: string;
  remoteaddr: string;
  address?: string;
  subnet?: number;
  descr?: string;
}

export interface GresResponse {
  items: Gre[];
}

export interface InterfaceGroup {
  id: string;
  name: string;
  members: string[];
  descr?: string;
}

export interface InterfaceGroupsResponse {
  items: InterfaceGroup[];
}

// --- Interfaces ---

export async function fetchInterfaces(): Promise<InterfaceConfig[]> {
  const response = await get<ApiResponse<InterfacesResponse>>('/interfaces');
  return response.data.items;
}

export interface UpdateInterfacePayload {
  descr: string;
  enable: boolean;
  ipv4_type: Ipv4ConfigType;
  ipv4_address?: string;
  ipv4_subnet?: number;
  ipv4_gateway?: string;
  pppoe_username?: string;
  pppoe_password?: string;
  pppoe_service?: string;
  ipv6_type: Ipv6ConfigType;
  ipv6_address?: string;
  ipv6_subnet?: number;
  ipv6_gateway?: string;
  mtu?: number;
  mss?: number;
  speed_duplex?: string;
  macaddr?: string;
  blockpriv: boolean;
  blockbogons: boolean;
}

export async function updateInterface(
  id: string,
  payload: UpdateInterfacePayload,
): Promise<void> {
  await patch(`/interface?id=${encodeURIComponent(id)}`, payload);
}

export async function deleteInterface(id: string): Promise<void> {
  await del(`/interfaces?id=${encodeURIComponent(id)}`);
}

// --- Available Interfaces ---

export async function fetchAvailableInterfaces(): Promise<AvailableInterface[]> {
  const response = await get<ApiResponse<AvailableInterfacesResponse>>('/interface/available_interfaces');
  return response.data.items;
}

// --- VLANs ---

export async function fetchVlans(): Promise<Vlan[]> {
  const response = await get<ApiResponse<VlansResponse>>('/interface/vlans');
  return response.data.items;
}

export async function deleteVlan(id: string): Promise<void> {
  await del(`/interface/vlans?id=${encodeURIComponent(id)}`);
}

// --- Bridges ---

export async function fetchBridges(): Promise<Bridge[]> {
  const response = await get<ApiResponse<BridgesResponse>>('/interface/bridges');
  return response.data.items;
}

export async function deleteBridge(id: string): Promise<void> {
  await del(`/interface/bridges?id=${encodeURIComponent(id)}`);
}

// --- LAGGs ---

export async function fetchLaggs(): Promise<Lagg[]> {
  const response = await get<ApiResponse<LaggsResponse>>('/interface/laggs');
  return response.data.items;
}

export async function deleteLagg(id: string): Promise<void> {
  await del(`/interface/laggs?id=${encodeURIComponent(id)}`);
}

// --- GRE Tunnels ---

export async function fetchGres(): Promise<Gre[]> {
  const response = await get<ApiResponse<GresResponse>>('/interface/gres');
  return response.data.items;
}

export async function deleteGre(id: string): Promise<void> {
  await del(`/interface/gres?id=${encodeURIComponent(id)}`);
}

// --- Interface Groups ---

export async function fetchInterfaceGroups(): Promise<InterfaceGroup[]> {
  const response = await get<ApiResponse<InterfaceGroupsResponse>>('/interface/groups');
  return response.data.items;
}

export async function deleteInterfaceGroup(id: string): Promise<void> {
  await del(`/interface/groups?id=${encodeURIComponent(id)}`);
}

// --- Apply Changes ---

export async function applyInterfaceChanges(): Promise<void> {
  await post('/interface/apply');
}
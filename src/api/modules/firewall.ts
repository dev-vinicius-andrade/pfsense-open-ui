import { get, post, put, patch, del } from '@/api/client';
import type { ApiResponse } from '@/api/types';

// --- Types ---

export type FirewallAction = 'pass' | 'block' | 'reject';
export type FirewallProtocol = 'tcp' | 'udp' | 'tcp/udp' | 'icmp' | 'any';
export type AddressFamily = 'inet' | 'inet6' | 'inet46';
export type SourceDestType = 'single' | 'network' | 'alias' | 'any';

export interface FirewallRule {
  id: number;
  position: number;
  enabled: boolean;
  action: FirewallAction;
  interface: string;
  address_family: AddressFamily;
  protocol: FirewallProtocol;
  source_type: SourceDestType;
  source_address?: string;
  source_port?: string;
  destination_type: SourceDestType;
  destination_address?: string;
  destination_port?: string;
  schedule?: string;
  description: string;
  created_at?: string;
  updated_at?: string;
}

export interface FirewallRuleCreateInput {
  enabled?: boolean;
  action: FirewallAction;
  interface: string;
  address_family?: AddressFamily;
  protocol: FirewallProtocol;
  source_type: SourceDestType;
  source_address?: string;
  source_port?: string;
  destination_type: SourceDestType;
  destination_address?: string;
  destination_port?: string;
  schedule?: string;
  description: string;
}

export interface FirewallRuleUpdateInput extends Partial<FirewallRuleCreateInput> {
  position?: number;
}

export interface Alias {
  name: string;
  type: 'host' | 'network' | 'port' | 'url' | 'url_ports' | 'urltable' | 'urltable_ports';
  description: string;
  content: string[];
}

export interface Schedule {
  name: string;
  description: string;
  timerange: Array<{
    month: string;
    day: string;
    hour: string;
  }>;
}

export interface FirewallAdvancedSettings {
  disable_filter: boolean;
  allow_private_networks: boolean;
  bogon_networks: boolean;
  rfc_1918: boolean;
  max_states: number;
  max_src_nodes: number;
  max_src_conn: number;
  max_src_conn_rate_count: number;
  max_src_conn_rate_seconds: number;
}

// --- Query Keys ---

export const firewallQueryKeys = {
  rules: ['firewall', 'rules'] as const,
  rule: (id: number) => ['firewall', 'rule', id] as const,
  aliases: ['firewall', 'aliases'] as const,
  schedules: ['firewall', 'schedules'] as const,
  advancedSettings: ['firewall', 'advancedSettings'] as const,
};

// --- API Functions ---

export async function fetchFirewallRules(): Promise<ApiResponse<FirewallRule[]>> {
  return get<ApiResponse<FirewallRule[]>>('/firewall/rules');
}

export async function fetchFirewallRule(id: number): Promise<ApiResponse<FirewallRule>> {
  return get<ApiResponse<FirewallRule>>('/firewall/rule', { params: { id } });
}

export async function createFirewallRule(
  input: FirewallRuleCreateInput,
): Promise<ApiResponse<FirewallRule>> {
  return post<ApiResponse<FirewallRule>>('/firewall/rule', input);
}

export async function updateFirewallRule(
  id: number,
  input: FirewallRuleUpdateInput,
): Promise<ApiResponse<FirewallRule>> {
  return patch<ApiResponse<FirewallRule>>('/firewall/rule', { id, ...input });
}

export async function deleteFirewallRule(id: number): Promise<ApiResponse<null>> {
  return del<ApiResponse<null>>('/firewall/rule', { params: { id } });
}

export async function reorderFirewallRules(
  rules: FirewallRule[],
): Promise<ApiResponse<FirewallRule[]>> {
  return put<ApiResponse<FirewallRule[]>>('/firewall/rules', rules);
}

export async function bulkDeleteFirewallRules(ids: number[]): Promise<ApiResponse<null>> {
  return del<ApiResponse<null>>('/firewall/rules', { data: { ids } });
}

export async function fetchAliases(): Promise<ApiResponse<Alias[]>> {
  return get<ApiResponse<Alias[]>>('/firewall/aliases');
}

export async function fetchSchedules(): Promise<ApiResponse<Schedule[]>> {
  return get<ApiResponse<Schedule[]>>('/firewall/schedules');
}

export async function applyFirewallChanges(): Promise<ApiResponse<null>> {
  return post<ApiResponse<null>>('/firewall/apply');
}

export async function fetchFirewallAdvancedSettings(): Promise<
  ApiResponse<FirewallAdvancedSettings>
> {
  return get<ApiResponse<FirewallAdvancedSettings>>('/firewall/advanced_settings');
}

export async function updateFirewallAdvancedSettings(
  settings: Partial<FirewallAdvancedSettings>,
): Promise<ApiResponse<FirewallAdvancedSettings>> {
  return patch<ApiResponse<FirewallAdvancedSettings>>('/firewall/advanced_settings', settings);
}
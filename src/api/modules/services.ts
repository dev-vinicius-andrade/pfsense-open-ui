import { get, post, put, patch, del } from '@/api/client';
import type { ApiResponse } from '@/api/types';

// --- DHCP Types ---

export interface DhcpServerConfig {
  interface: string;
  enable: boolean;
  range_from: string;
  range_to: string;
  default_lease_time: number;
  max_lease_time: number;
  gateway?: string;
  domain_name?: string;
  dns_servers?: string[];
  deny_unknown_clients: boolean;
  ignore_bootp: boolean;
}

export interface DhcpStaticMapping {
  id: number;
  mac_address: string;
  ip_address: string;
  hostname?: string;
  description?: string;
  interface: string;
}

export interface DhcpStaticMappingCreateInput {
  mac_address: string;
  ip_address: string;
  hostname?: string;
  description?: string;
  interface: string;
}

export interface DhcpAddressPool {
  id: number;
  range_from: string;
  range_to: string;
  interface: string;
  description?: string;
}

export interface DhcpLease {
  ip_address: string;
  mac_address: string;
  hostname?: string;
  starts: string;
  ends: string;
  status: 'active' | 'expired' | 'released';
  interface: string;
}

// --- DNS Resolver Types ---

export interface DnsResolverSettings {
  enable: boolean;
  port: number;
  network_interfaces: string[];
  outgoing_network_interfaces: string[];
  strict_interface_binding: boolean;
  enable_dnssec: boolean;
  hide_identity: boolean;
  hide_version: boolean;
  prefetch: boolean;
  prefetch_key: boolean;
  harden_glue: boolean;
  harden_dnssec_stripped: boolean;
  harden_below_nxdomain: boolean;
  harden_referral_path: boolean;
  aggressive_nsec: boolean;
  log_queries: boolean;
  cache_size: number;
}

export interface DnsHostOverride {
  id: number;
  host: string;
  domain: string;
  ip_address: string;
  description?: string;
  aliases?: Array<{ host: string; domain: string; description?: string }>;
}

export interface DnsHostOverrideCreateInput {
  host: string;
  domain: string;
  ip_address: string;
  description?: string;
}

export interface DnsDomainOverride {
  id: number;
  domain: string;
  ip_address: string;
  description?: string;
  forwarder_type: 'forward' | 'stub';
}

// --- NTP Types ---

export interface NtpTimeServer {
  id: number;
  server: string;
  prefer: boolean;
  min_poll: number;
  max_poll: number;
  ispool: boolean;
}

export interface NtpSettings {
  enable: boolean;
  orphan_mode: boolean;
  orphan_stratum: number;
  stats_graph: boolean;
  log_peer: boolean;
  log_sys: boolean;
  kiss_of_death: boolean;
  leap_second: boolean;
  interfaces: string[];
}

// --- SSH Types ---

export interface SshSettings {
  enable: boolean;
  port: number;
  root_login: boolean;
  password_auth: boolean;
  permit_agent_forwarding: boolean;
  permit_tunnel: boolean;
  idle_timeout: number;
  login_grace_time: number;
  max_sessions: number;
  max_startups: string;
}

// --- Cron Job Types ---

export interface CronJob {
  id: number;
  minute: string;
  hour: string;
  day_of_month: string;
  month: string;
  day_of_week: string;
  command: string;
  user: string;
  description?: string;
}

export interface CronJobCreateInput {
  minute: string;
  hour: string;
  day_of_month: string;
  month: string;
  day_of_week: string;
  command: string;
  user: string;
  description?: string;
}

// --- DNS Forwarder Types ---

export interface DnsForwarderSettings {
  enable: boolean;
  port: number;
  network_interfaces: string[];
  enable_dnssec: boolean;
  log_queries: boolean;
  strict_binding: boolean;
}

export interface DnsForwarderHostOverride {
  id: number;
  host: string;
  domain: string;
  ip_address: string;
  description?: string;
}

export interface DnsForwarderHostOverrideCreateInput {
  host: string;
  domain: string;
  ip_address: string;
  description?: string;
}

// --- Query Keys ---

export const servicesQueryKeys = {
  dhcpServers: ['services', 'dhcpServers'] as const,
  dhcpServer: (iface: string) => ['services', 'dhcpServer', iface] as const,
  dhcpStaticMappings: ['services', 'dhcpStaticMappings'] as const,
  dhcpAddressPools: ['services', 'dhcpAddressPools'] as const,
  dhcpLeases: ['services', 'dhcpLeases'] as const,
  dnsResolverSettings: ['services', 'dnsResolverSettings'] as const,
  dnsHostOverrides: ['services', 'dnsHostOverrides'] as const,
  dnsDomainOverrides: ['services', 'dnsDomainOverrides'] as const,
  dnsForwarderSettings: ['services', 'dnsForwarderSettings'] as const,
  dnsForwarderHostOverrides: ['services', 'dnsForwarderHostOverrides'] as const,
  ntpSettings: ['services', 'ntpSettings'] as const,
  ntpTimeServers: ['services', 'ntpTimeServers'] as const,
  sshSettings: ['services', 'sshSettings'] as const,
  cronJobs: ['services', 'cronJobs'] as const,
};

// --- DHCP Server API Functions ---

export async function fetchDhcpServers(): Promise<ApiResponse<DhcpServerConfig[]>> {
  return get<ApiResponse<DhcpServerConfig[]>>('/services/dhcp_servers');
}

export async function updateDhcpServers(
  configs: DhcpServerConfig[],
): Promise<ApiResponse<DhcpServerConfig[]>> {
  return put<ApiResponse<DhcpServerConfig[]>>('/services/dhcp_servers', configs);
}

export async function fetchDhcpStaticMappings(): Promise<ApiResponse<DhcpStaticMapping[]>> {
  return get<ApiResponse<DhcpStaticMapping[]>>('/services/dhcp_server/static_mappings');
}

export async function fetchDhcpStaticMapping(id: number): Promise<ApiResponse<DhcpStaticMapping>> {
  return get<ApiResponse<DhcpStaticMapping>>('/services/dhcp_server/static_mapping', { params: { id } });
}

export async function createDhcpStaticMapping(
  input: DhcpStaticMappingCreateInput,
): Promise<ApiResponse<DhcpStaticMapping>> {
  return post<ApiResponse<DhcpStaticMapping>>('/services/dhcp_server/static_mapping', input);
}

export async function updateDhcpStaticMapping(
  id: number,
  input: Partial<DhcpStaticMappingCreateInput>,
): Promise<ApiResponse<DhcpStaticMapping>> {
  return patch<ApiResponse<DhcpStaticMapping>>('/services/dhcp_server/static_mapping', { id, ...input });
}

export async function deleteDhcpStaticMapping(id: number): Promise<ApiResponse<null>> {
  return del<ApiResponse<null>>('/services/dhcp_server/static_mapping', { params: { id } });
}

export async function fetchDhcpAddressPools(): Promise<ApiResponse<DhcpAddressPool[]>> {
  return get<ApiResponse<DhcpAddressPool[]>>('/services/dhcp_server/address_pools');
}

export async function applyDhcpChanges(): Promise<ApiResponse<null>> {
  return post<ApiResponse<null>>('/services/dhcp_server/apply');
}

export async function fetchDhcpLeases(): Promise<ApiResponse<DhcpLease[]>> {
  return get<ApiResponse<DhcpLease[]>>('/status/dhcp_server/leases');
}

// --- DNS Resolver API Functions ---

export async function fetchDnsResolverSettings(): Promise<ApiResponse<DnsResolverSettings>> {
  return get<ApiResponse<DnsResolverSettings>>('/services/dns_resolver/settings');
}

export async function updateDnsResolverSettings(
  settings: Partial<DnsResolverSettings>,
): Promise<ApiResponse<DnsResolverSettings>> {
  return patch<ApiResponse<DnsResolverSettings>>('/services/dns_resolver/settings', settings);
}

export async function fetchDnsHostOverrides(): Promise<ApiResponse<DnsHostOverride[]>> {
  return get<ApiResponse<DnsHostOverride[]>>('/services/dns_resolver/host_overrides');
}

export async function fetchDnsHostOverride(id: number): Promise<ApiResponse<DnsHostOverride>> {
  return get<ApiResponse<DnsHostOverride>>('/services/dns_resolver/host_override', { params: { id } });
}

export async function createDnsHostOverride(
  input: DnsHostOverrideCreateInput,
): Promise<ApiResponse<DnsHostOverride>> {
  return post<ApiResponse<DnsHostOverride>>('/services/dns_resolver/host_override', input);
}

export async function updateDnsHostOverride(
  id: number,
  input: Partial<DnsHostOverrideCreateInput>,
): Promise<ApiResponse<DnsHostOverride>> {
  return patch<ApiResponse<DnsHostOverride>>('/services/dns_resolver/host_override', { id, ...input });
}

export async function deleteDnsHostOverride(id: number): Promise<ApiResponse<null>> {
  return del<ApiResponse<null>>('/services/dns_resolver/host_override', { params: { id } });
}

export async function applyDnsResolverChanges(): Promise<ApiResponse<null>> {
  return post<ApiResponse<null>>('/services/dns_resolver/apply');
}

// --- NTP API Functions ---

export async function fetchNtpSettings(): Promise<ApiResponse<NtpSettings>> {
  return get<ApiResponse<NtpSettings>>('/services/ntp/settings');
}

export async function updateNtpSettings(
  settings: Partial<NtpSettings>,
): Promise<ApiResponse<NtpSettings>> {
  return patch<ApiResponse<NtpSettings>>('/services/ntp/settings', settings);
}

export async function fetchNtpTimeServers(): Promise<ApiResponse<NtpTimeServer[]>> {
  return get<ApiResponse<NtpTimeServer[]>>('/services/ntp/time_servers');
}

export async function updateTimeServers(
  servers: NtpTimeServer[],
): Promise<ApiResponse<NtpTimeServer[]>> {
  return put<ApiResponse<NtpTimeServer[]>>('/services/ntp/time_servers', servers);
}

// --- SSH API Functions ---

export async function fetchSshSettings(): Promise<ApiResponse<SshSettings>> {
  return get<ApiResponse<SshSettings>>('/services/ssh');
}

export async function updateSshSettings(
  settings: Partial<SshSettings>,
): Promise<ApiResponse<SshSettings>> {
  return patch<ApiResponse<SshSettings>>('/services/ssh', settings);
}

// --- Cron Jobs API Functions ---

export async function fetchCronJobs(): Promise<ApiResponse<CronJob[]>> {
  return get<ApiResponse<CronJob[]>>('/services/cron_jobs');
}

export async function fetchCronJob(id: number): Promise<ApiResponse<CronJob>> {
  return get<ApiResponse<CronJob>>('/services/cron_job', { params: { id } });
}

export async function createCronJob(input: CronJobCreateInput): Promise<ApiResponse<CronJob>> {
  return post<ApiResponse<CronJob>>('/services/cron_job', input);
}

export async function updateCronJob(
  id: number,
  input: Partial<CronJobCreateInput>,
): Promise<ApiResponse<CronJob>> {
  return patch<ApiResponse<CronJob>>('/services/cron_job', { id, ...input });
}

export async function deleteCronJob(id: number): Promise<ApiResponse<null>> {
  return del<ApiResponse<null>>('/services/cron_job', { params: { id } });
}

// --- DNS Forwarder API Functions ---

export async function fetchDnsForwarderSettings(): Promise<ApiResponse<DnsForwarderSettings>> {
  return get<ApiResponse<DnsForwarderSettings>>('/services/dns_forwarder/settings');
}

export async function updateDnsForwarderSettings(
  settings: Partial<DnsForwarderSettings>,
): Promise<ApiResponse<DnsForwarderSettings>> {
  return patch<ApiResponse<DnsForwarderSettings>>('/services/dns_forwarder/settings', settings);
}

export async function fetchDnsForwarderHostOverrides(): Promise<ApiResponse<DnsForwarderHostOverride[]>> {
  return get<ApiResponse<DnsForwarderHostOverride[]>>('/services/dns_forwarder/host_overrides');
}

export async function createDnsForwarderHostOverride(
  input: DnsForwarderHostOverrideCreateInput,
): Promise<ApiResponse<DnsForwarderHostOverride>> {
  return post<ApiResponse<DnsForwarderHostOverride>>('/services/dns_forwarder/host_override', input);
}

export async function updateDnsForwarderHostOverride(
  id: number,
  input: Partial<DnsForwarderHostOverrideCreateInput>,
): Promise<ApiResponse<DnsForwarderHostOverride>> {
  return patch<ApiResponse<DnsForwarderHostOverride>>('/services/dns_forwarder/host_override', { id, ...input });
}

export async function deleteDnsForwarderHostOverride(id: number): Promise<ApiResponse<null>> {
  return del<ApiResponse<null>>('/services/dns_forwarder/host_override', { params: { id } });
}

export async function applyDnsForwarderChanges(): Promise<ApiResponse<null>> {
  return post<ApiResponse<null>>('/services/dns_forwarder/apply');
}
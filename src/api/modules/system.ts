import { get, post, patch, del } from '@/api/client';
import type { ApiResponse } from '@/api/types';

// --- Types ---

export interface User {
  username: string;
  password?: string;
  full_name: string;
  email: string;
  disabled: boolean;
  groups: string[];
  privileges: string[];
  scope: 'local' | 'remote';
  auth_server?: string;
}

export interface UserGroup {
  name: string;
  description: string;
  members: string[];
  privileges: string[];
  scope: 'local' | 'remote';
}

export interface Certificate {
  refid: string;
  descr: string;
  caref: string;
  crt: string;
  csr?: string;
  prv?: string;
  type: 'server' | 'user' | 'ca' | 'crl';
  issuer?: string;
  subject?: string;
  not_before?: string;
  not_after?: string;
  serial?: string;
  purpose?: string;
}

export interface SystemHostname {
  hostname: string;
  domain: string;
}

export interface SystemTimezone {
  timezone: string;
}

export interface SystemDns {
  dns_servers: string[];
  dns_gateway_override: boolean;
  dns_allow_override: boolean;
}

export interface InstalledPackage {
  name: string;
  version: string;
  category: string;
  summary: string;
  website?: string;
  maintainer?: string;
}

export interface Tunable {
  name: string;
  value: string;
  description: string;
  type: 'loader' | 'sysctl';
}

export interface PingResult {
  source_address: string;
  destination_address: string;
  count: number;
  transmitted: number;
  received: number;
  percent_loss: number;
  min_rtt: number;
  avg_rtt: number;
  max_rtt: number;
  output: string;
}

export interface ArpEntry {
  ip_address: string;
  mac_address: string;
  interface: string;
  expires?: string;
  type: 'dynamic' | 'static' | 'permanent';
}


export interface FirmwareUpdateStatus {
  update_available: boolean;
  current_version: string;
  new_version?: string;
  release_date?: string;
  changelog?: string;
  size?: string;
}

export interface PrivilegeNode {
  id: string;
  label: string;
  children?: PrivilegeNode[];
}

// --- Query Keys ---

export const systemQueryKeys = {
  users: ['system', 'users'] as const,
  user: (username: string) => ['system', 'user', username] as const,
  userGroups: ['system', 'userGroups'] as const,
  userGroup: (name: string) => ['system', 'userGroup', name] as const,
  hostname: ['system', 'hostname'] as const,
  timezone: ['system', 'timezone'] as const,
  dns: ['system', 'dns'] as const,
  certificates: ['system', 'certificates'] as const,
  certificate: (refid: string) => ['system', 'certificate', refid] as const,
  version: ['system', 'version'] as const,
  packages: ['system', 'packages'] as const,
  tunables: ['system', 'tunables'] as const,
  tunable: (name: string) => ['system', 'tunable', name] as const,
  firmwareUpdate: ['system', 'firmwareUpdate'] as const,
  arpTable: ['system', 'arpTable'] as const,
  };

// --- User API Functions ---

export async function fetchUsers(): Promise<ApiResponse<User[]>> {
  return get<ApiResponse<User[]>>('/users');
}

export async function fetchUser(username: string): Promise<ApiResponse<User>> {
  return get<ApiResponse<User>>('/user', { params: { username } });
}

export async function createUser(input: Partial<User>): Promise<ApiResponse<User>> {
  return post<ApiResponse<User>>('/user', input);
}

export async function updateUser(
  username: string,
  input: Partial<User>,
): Promise<ApiResponse<User>> {
  return patch<ApiResponse<User>>('/user', { username, ...input });
}

export async function deleteUser(username: string): Promise<ApiResponse<null>> {
  return del<ApiResponse<null>>('/user', { params: { username } });
}

// --- User Group API Functions ---

export async function fetchUserGroups(): Promise<ApiResponse<UserGroup[]>> {
  return get<ApiResponse<UserGroup[]>>('/user_groups');
}

export async function fetchUserGroup(name: string): Promise<ApiResponse<UserGroup>> {
  return get<ApiResponse<UserGroup>>('/user_group', { params: { name } });
}

export async function createUserGroup(input: Partial<UserGroup>): Promise<ApiResponse<UserGroup>> {
  return post<ApiResponse<UserGroup>>('/user_group', input);
}

export async function updateUserGroup(
  name: string,
  input: Partial<UserGroup>,
): Promise<ApiResponse<UserGroup>> {
  return patch<ApiResponse<UserGroup>>('/user_group', { name, ...input });
}

export async function deleteUserGroup(name: string): Promise<ApiResponse<null>> {
  return del<ApiResponse<null>>('/user_group', { params: { name } });
}

// --- System Settings API Functions ---

export async function fetchHostname(): Promise<ApiResponse<SystemHostname>> {
  return get<ApiResponse<SystemHostname>>('/system/hostname');
}

export async function updateHostname(
  input: Partial<SystemHostname>,
): Promise<ApiResponse<SystemHostname>> {
  return patch<ApiResponse<SystemHostname>>('/system/hostname', input);
}

export async function fetchTimezone(): Promise<ApiResponse<SystemTimezone>> {
  return get<ApiResponse<SystemTimezone>>('/system/timezone');
}

export async function updateTimezone(
  input: Partial<SystemTimezone>,
): Promise<ApiResponse<SystemTimezone>> {
  return patch<ApiResponse<SystemTimezone>>('/system/timezone', input);
}

export async function fetchDns(): Promise<ApiResponse<SystemDns>> {
  return get<ApiResponse<SystemDns>>('/system/dns');
}

export async function updateDns(input: Partial<SystemDns>): Promise<ApiResponse<SystemDns>> {
  return patch<ApiResponse<SystemDns>>('/system/dns', input);
}

// --- Certificate API Functions ---

export async function fetchCertificates(): Promise<ApiResponse<Certificate[]>> {
  return get<ApiResponse<Certificate[]>>('/system/certificates');
}

export async function fetchCertificate(refid: string): Promise<ApiResponse<Certificate>> {
  return get<ApiResponse<Certificate>>('/system/certificate', { params: { refid } });
}

export async function createCertificate(input: Partial<Certificate>): Promise<ApiResponse<Certificate>> {
  return post<ApiResponse<Certificate>>('/system/certificate', input);
}

export async function updateCertificate(
  refid: string,
  input: Partial<Certificate>,
): Promise<ApiResponse<Certificate>> {
  return patch<ApiResponse<Certificate>>('/system/certificate', { refid, ...input });
}

export async function deleteCertificate(refid: string): Promise<ApiResponse<null>> {
  return del<ApiResponse<null>>('/system/certificate', { params: { refid } });
}

// --- Firmware / Version API Functions ---

export async function fetchSystemVersion(): Promise<ApiResponse<{ version: string; build_date: string; platform: string; branch: string }>> {
  return get<ApiResponse<{ version: string; build_date: string; platform: string; branch: string }>>('/system/version');
}

export async function checkFirmwareUpdate(): Promise<ApiResponse<FirmwareUpdateStatus>> {
  return get<ApiResponse<FirmwareUpdateStatus>>('/system/update');
}

export async function applyFirmwareUpdate(): Promise<ApiResponse<{ message: string }>> {
  return post<ApiResponse<{ message: string }>>('/system/update');
}

// --- Packages API Functions ---

export async function fetchPackages(): Promise<ApiResponse<InstalledPackage[]>> {
  return get<ApiResponse<InstalledPackage[]>>('/system/packages');
}

export async function deletePackage(name: string): Promise<ApiResponse<null>> {
  return del<ApiResponse<null>>('/system/packages', { params: { name } });
}

// --- Tunables API Functions ---

export async function fetchTunables(): Promise<ApiResponse<Tunable[]>> {
  return get<ApiResponse<Tunable[]>>('/system/tunables');
}

export async function fetchTunable(name: string): Promise<ApiResponse<Tunable>> {
  return get<ApiResponse<Tunable>>('/system/tunable', { params: { name } });
}

export async function createTunable(input: Partial<Tunable>): Promise<ApiResponse<Tunable>> {
  return post<ApiResponse<Tunable>>('/system/tunable', input);
}

export async function updateTunable(
  name: string,
  input: Partial<Tunable>,
): Promise<ApiResponse<Tunable>> {
  return patch<ApiResponse<Tunable>>('/system/tunable', { name, ...input });
}

export async function deleteTunable(name: string): Promise<ApiResponse<null>> {
  return del<ApiResponse<null>>('/system/tunable', { params: { name } });
}

// --- Diagnostics API Functions ---

export async function runPing(host: string, count?: number): Promise<ApiResponse<PingResult>> {
  return post<ApiResponse<PingResult>>('/diagnostics/ping', { host, count });
}

export async function fetchArpTable(): Promise<ApiResponse<ArpEntry[]>> {
  return get<ApiResponse<ArpEntry[]>>('/diagnostics/arp_table');
}


export async function haltSystem(): Promise<ApiResponse<{ message: string }>> {
  return post<ApiResponse<{ message: string }>>('/diagnostics/halt_system');
}


export async function executeCommand(command: string): Promise<ApiResponse<{ output: string }>> {
  return post<ApiResponse<{ output: string }>>('/diagnostics/command_prompt', { command });
}
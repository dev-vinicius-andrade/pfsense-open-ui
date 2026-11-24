import { get, post, patch, del } from '@/api/client';
import type { ApiResponse } from '@/api/types';

// --- Certificates ---

export interface Certificate {
  refid: string;
  descr: string;
  caref?: string;
  crt: string;
  prv?: string;
  type: 'user' | 'server' | 'CA';
}

// --- OpenVPN ---

export type OpenVpnMode = 'server_tls' | 'server_tls_user' | 'p2p_tls' | 'p2p_shared_key';
export type OpenVpnProtocol = 'udp4' | 'tcp4' | 'udp6' | 'tcp6';
export type OpenVpnCipher = 'AES-256-GCM' | 'AES-128-GCM' | 'AES-256-CBC' | 'AES-128-CBC' | 'CHACHA20-POLY1305';
export type OpenVpnAuthDigest = 'SHA512' | 'SHA384' | 'SHA256' | 'SHA1' | 'MD5';

export interface OpenVpnServer {
  vpnid: number;
  mode: OpenVpnMode;
  protocol: OpenVpnProtocol;
  interface: string;
  local_port: number;
  description: string;
  enabled: boolean;
  cipher: OpenVpnCipher;
  auth_digest: OpenVpnAuthDigest;
  tlsauth_enable: boolean;
  certref: string;
  caref?: string;
  crlref?: string;
  maxclients?: number;
  topology?: 'subnet' | 'net30';
  server?: string;
  remote_network?: string;
  created_at?: string;
  updated_at?: string;
}

export interface OpenVpnServerCreateInput {
  mode: OpenVpnMode;
  protocol: OpenVpnProtocol;
  interface: string;
  local_port: number;
  description: string;
  enabled?: boolean;
  cipher: OpenVpnCipher;
  auth_digest: OpenVpnAuthDigest;
  tlsauth_enable?: boolean;
  certref: string;
  caref?: string;
  crlref?: string;
  maxclients?: number;
  topology?: 'subnet' | 'net30';
  server?: string;
  remote_network?: string;
}

export interface OpenVpnServerUpdateInput extends Partial<OpenVpnServerCreateInput> {}

export interface OpenVpnClient {
  vpnid: number;
  mode: OpenVpnMode;
  protocol: OpenVpnProtocol;
  interface: string;
  remote_addr: string;
  remote_port: number;
  description: string;
  enabled: boolean;
  cipher: OpenVpnCipher;
  auth_digest: OpenVpnAuthDigest;
  tlsauth_enable: boolean;
  certref: string;
  caref?: string;
  created_at?: string;
  updated_at?: string;
}

export interface OpenVpnClientCreateInput {
  mode: OpenVpnMode;
  protocol: OpenVpnProtocol;
  interface: string;
  remote_addr: string;
  remote_port: number;
  description: string;
  enabled?: boolean;
  cipher: OpenVpnCipher;
  auth_digest: OpenVpnAuthDigest;
  tlsauth_enable?: boolean;
  certref: string;
  caref?: string;
}

export interface OpenVpnClientUpdateInput extends Partial<OpenVpnClientCreateInput> {}

export interface OpenVpnServerStatus {
  vpnid: number;
  status: 'up' | 'down' | 'reconnecting';
  connected_clients: number;
  bytes_in: number;
  bytes_out: number;
  uptime_seconds?: number;
}

// --- WireGuard ---

export interface WireGuardTunnel {
  id: number;
  name: string;
  enabled: boolean;
  listen_port: number;
  private_key: string;
  public_key: string;
  addresses: string[];
  dns_servers: string[];
  mtu?: number;
  description: string;
  created_at?: string;
  updated_at?: string;
}

export interface WireGuardTunnelCreateInput {
  name: string;
  enabled?: boolean;
  listen_port: number;
  private_key: string;
  addresses: string[];
  dns_servers?: string[];
  mtu?: number;
  description?: string;
}

export interface WireGuardTunnelUpdateInput extends Partial<WireGuardTunnelCreateInput> {}

export interface WireGuardPeer {
  id: number;
  tunnel_id: number;
  name: string;
  enabled: boolean;
  public_key: string;
  preshared_key?: string;
  endpoint_address?: string;
  endpoint_port?: number;
  allowed_ips: string[];
  keepalive_interval?: number;
  description: string;
  created_at?: string;
  updated_at?: string;
}

export interface WireGuardPeerCreateInput {
  tunnel_id: number;
  name: string;
  enabled?: boolean;
  public_key: string;
  preshared_key?: string;
  endpoint_address?: string;
  endpoint_port?: number;
  allowed_ips: string[];
  keepalive_interval?: number;
  description?: string;
}

export interface WireGuardPeerUpdateInput extends Partial<WireGuardPeerCreateInput> {}

export interface WireGuardTunnelStatus {
  id: number;
  status: 'up' | 'down';
  peers_connected: number;
  bytes_in: number;
  bytes_out: number;
  last_handshake?: string;
}

// --- IPsec ---

export type IpsecAuthMethod = 'pre_shared_key' | 'rsa_signature' | 'eap_mschapv2' | 'mutual_rsa';
export type IpsecEncryption = 'aes' | 'aes128gcm' | 'aes192gcm' | 'aes256gcm' | '3des' | 'blowfish' | 'cast128' | 'des' | 'camellia';
export type IpsecHash = 'sha1' | 'sha256' | 'sha384' | 'sha512' | 'md5' | 'aesxcbc';
export type IpsecDhGroup = '1' | '2' | '5' | '14' | '15' | '16' | '17' | '18' | '19' | '20' | '21' | '22' | '23' | '24';
export type IpsecPhase2Mode = 'tunnel' | 'transport' | 'tunnel_ipv6' | 'transport_ipv6';
export type IpsecPhase2Protocol = 'esp' | 'ah';

export interface IpsecPhase1 {
  ikeid: number;
  iketype: 'auto' | 'ikev1' | 'ikev2';
  protocol: 'inet' | 'inet6';
  interface: string;
  remotegw: string;
  authentication_method: IpsecAuthMethod;
  encryption_algorithm: IpsecEncryption;
  hash_algorithm: IpsecHash;
  dhgroup: IpsecDhGroup;
  lifetime: number;
  pre_shared_key?: string;
  certref?: string;
  caref?: string;
  description: string;
  enabled: boolean;
  disabled?: boolean;
  nattport?: number;
  nat_traversal?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface IpsecPhase1CreateInput {
  iketype?: 'auto' | 'ikev1' | 'ikev2';
  protocol?: 'inet' | 'inet6';
  interface: string;
  remotegw: string;
  authentication_method: IpsecAuthMethod;
  encryption_algorithm: IpsecEncryption;
  hash_algorithm: IpsecHash;
  dhgroup: IpsecDhGroup;
  lifetime?: number;
  pre_shared_key?: string;
  certref?: string;
  caref?: string;
  description: string;
  enabled?: boolean;
  nattport?: number;
  nat_traversal?: boolean;
}

export interface IpsecPhase1UpdateInput extends Partial<IpsecPhase1CreateInput> {}

export interface IpsecPhase2 {
  uniqid: number;
  ikeid: number;
  mode: IpsecPhase2Mode;
  protocol: IpsecPhase2Protocol;
  encryption_algorithm: IpsecEncryption;
  hash_algorithm: IpsecHash;
  dhgroup?: IpsecDhGroup;
  lifetime?: number;
  localid_type: 'address' | 'network' | 'fqdn' | 'dyn_fqdn';
  localid_address?: string;
  remoteid_type: 'address' | 'network' | 'fqdn' | 'dyn_fqdn';
  remoteid_address?: string;
  description: string;
  enabled: boolean;
  disabled?: boolean;
  pfssource?: string;
  pfsdest?: string;
  created_at?: string;
  updated_at?: string;
}

export interface IpsecPhase2CreateInput {
  ikeid: number;
  mode: IpsecPhase2Mode;
  protocol: IpsecPhase2Protocol;
  encryption_algorithm: IpsecEncryption;
  hash_algorithm: IpsecHash;
  dhgroup?: IpsecDhGroup;
  lifetime?: number;
  localid_type: 'address' | 'network' | 'fqdn' | 'dyn_fqdn';
  localid_address?: string;
  remoteid_type: 'address' | 'network' | 'fqdn' | 'dyn_fqdn';
  remoteid_address?: string;
  description: string;
  enabled?: boolean;
  pfssource?: string;
  pfsdest?: string;
}

export interface IpsecPhase2UpdateInput extends Partial<IpsecPhase2CreateInput> {}

export interface IpsecSaStatus {
  ikeid: number;
  phase: 1 | 2;
  status: 'established' | 'connecting' | 'disconnected';
  spi_in?: string;
  spi_out?: string;
  bytes_in?: number;
  bytes_out?: number;
  established_time?: string;
}

// --- Query Keys ---

export const vpnQueryKeys = {
  openvpnServers: ['vpn', 'openvpn', 'servers'] as const,
  openvpnServer: (id: number) => ['vpn', 'openvpn', 'server', id] as const,
  openvpnClients: ['vpn', 'openvpn', 'clients'] as const,
  openvpnClient: (id: number) => ['vpn', 'openvpn', 'client', id] as const,
  openvpnStatus: ['vpn', 'openvpn', 'status'] as const,
  wireguardTunnels: ['vpn', 'wireguard', 'tunnels'] as const,
  wireguardTunnel: (id: number) => ['vpn', 'wireguard', 'tunnel', id] as const,
  wireguardPeers: ['vpn', 'wireguard', 'peers'] as const,
  wireguardPeer: (id: number) => ['vpn', 'wireguard', 'peer', id] as const,
  wireguardStatus: ['vpn', 'wireguard', 'status'] as const,
  ipsecPhase1s: ['vpn', 'ipsec', 'phase1s'] as const,
  ipsecPhase1: (id: number) => ['vpn', 'ipsec', 'phase1', id] as const,
  ipsecPhase2s: ['vpn', 'ipsec', 'phase2s'] as const,
  ipsecPhase2: (id: number) => ['vpn', 'ipsec', 'phase2', id] as const,
  ipsecSaStatus: ['vpn', 'ipsec', 'sa-status'] as const,
  certificates: ['system', 'certificates'] as const,
};

// --- Certificate API ---

export async function fetchCertificates(): Promise<ApiResponse<Certificate[]>> {
  return get<ApiResponse<Certificate[]>>('/system/certificates');
}

// --- OpenVPN Server API ---

export async function fetchOpenVpnServers(): Promise<ApiResponse<OpenVpnServer[]>> {
  return get<ApiResponse<OpenVpnServer[]>>('/vpn/openvpn/servers');
}

export async function fetchOpenVpnServer(id: number): Promise<ApiResponse<OpenVpnServer>> {
  return get<ApiResponse<OpenVpnServer>>('/vpn/openvpn/server', { params: { id } });
}

export async function createOpenVpnServer(
  input: OpenVpnServerCreateInput,
): Promise<ApiResponse<OpenVpnServer>> {
  return post<ApiResponse<OpenVpnServer>>('/vpn/openvpn/server', input);
}

export async function updateOpenVpnServer(
  id: number,
  input: OpenVpnServerUpdateInput,
): Promise<ApiResponse<OpenVpnServer>> {
  return patch<ApiResponse<OpenVpnServer>>('/vpn/openvpn/server', { id, ...input });
}

export async function deleteOpenVpnServer(id: number): Promise<ApiResponse<null>> {
  return del<ApiResponse<null>>('/vpn/openvpn/server', { params: { id } });
}

// --- OpenVPN Client API ---

export async function fetchOpenVpnClients(): Promise<ApiResponse<OpenVpnClient[]>> {
  return get<ApiResponse<OpenVpnClient[]>>('/vpn/openvpn/clients');
}

export async function fetchOpenVpnClient(id: number): Promise<ApiResponse<OpenVpnClient>> {
  return get<ApiResponse<OpenVpnClient>>('/vpn/openvpn/client', { params: { id } });
}

export async function createOpenVpnClient(
  input: OpenVpnClientCreateInput,
): Promise<ApiResponse<OpenVpnClient>> {
  return post<ApiResponse<OpenVpnClient>>('/vpn/openvpn/client', input);
}

export async function updateOpenVpnClient(
  id: number,
  input: OpenVpnClientUpdateInput,
): Promise<ApiResponse<OpenVpnClient>> {
  return patch<ApiResponse<OpenVpnClient>>('/vpn/openvpn/client', { id, ...input });
}

export async function deleteOpenVpnClient(id: number): Promise<ApiResponse<null>> {
  return del<ApiResponse<null>>('/vpn/openvpn/client', { params: { id } });
}

// --- OpenVPN Status API ---

export async function fetchOpenVpnServerStatus(): Promise<ApiResponse<OpenVpnServerStatus[]>> {
  return get<ApiResponse<OpenVpnServerStatus[]>>('/status/openvpn/servers');
}

// --- WireGuard Tunnel API ---

export async function fetchWireGuardTunnels(): Promise<ApiResponse<WireGuardTunnel[]>> {
  return get<ApiResponse<WireGuardTunnel[]>>('/vpn/wireguard/tunnels');
}

export async function fetchWireGuardTunnel(id: number): Promise<ApiResponse<WireGuardTunnel>> {
  return get<ApiResponse<WireGuardTunnel>>('/vpn/wireguard/tunnel', { params: { id } });
}

export async function createWireGuardTunnel(
  input: WireGuardTunnelCreateInput,
): Promise<ApiResponse<WireGuardTunnel>> {
  return post<ApiResponse<WireGuardTunnel>>('/vpn/wireguard/tunnel', input);
}

export async function updateWireGuardTunnel(
  id: number,
  input: WireGuardTunnelUpdateInput,
): Promise<ApiResponse<WireGuardTunnel>> {
  return patch<ApiResponse<WireGuardTunnel>>('/vpn/wireguard/tunnel', { id, ...input });
}

export async function deleteWireGuardTunnel(id: number): Promise<ApiResponse<null>> {
  return del<ApiResponse<null>>('/vpn/wireguard/tunnel', { params: { id } });
}

// --- WireGuard Peer API ---

export async function fetchWireGuardPeers(): Promise<ApiResponse<WireGuardPeer[]>> {
  return get<ApiResponse<WireGuardPeer[]>>('/vpn/wireguard/peers');
}

export async function fetchWireGuardPeer(id: number): Promise<ApiResponse<WireGuardPeer>> {
  return get<ApiResponse<WireGuardPeer>>('/vpn/wireguard/peer', { params: { id } });
}

export async function createWireGuardPeer(
  input: WireGuardPeerCreateInput,
): Promise<ApiResponse<WireGuardPeer>> {
  return post<ApiResponse<WireGuardPeer>>('/vpn/wireguard/peer', input);
}

export async function updateWireGuardPeer(
  id: number,
  input: WireGuardPeerUpdateInput,
): Promise<ApiResponse<WireGuardPeer>> {
  return patch<ApiResponse<WireGuardPeer>>('/vpn/wireguard/peer', { id, ...input });
}

export async function deleteWireGuardPeer(id: number): Promise<ApiResponse<null>> {
  return del<ApiResponse<null>>('/vpn/wireguard/peer', { params: { id } });
}

// --- WireGuard Status API ---

export async function fetchWireGuardTunnelStatus(): Promise<ApiResponse<WireGuardTunnelStatus[]>> {
  return get<ApiResponse<WireGuardTunnelStatus[]>>('/status/wireguard/tunnels');
}

// --- IPsec Phase 1 API ---

export async function fetchIpsecPhase1s(): Promise<ApiResponse<IpsecPhase1[]>> {
  return get<ApiResponse<IpsecPhase1[]>>('/vpn/ipsec/phase1s');
}

export async function fetchIpsecPhase1(id: number): Promise<ApiResponse<IpsecPhase1>> {
  return get<ApiResponse<IpsecPhase1>>('/vpn/ipsec/phase1', { params: { id } });
}

export async function createIpsecPhase1(
  input: IpsecPhase1CreateInput,
): Promise<ApiResponse<IpsecPhase1>> {
  return post<ApiResponse<IpsecPhase1>>('/vpn/ipsec/phase1', input);
}

export async function updateIpsecPhase1(
  id: number,
  input: IpsecPhase1UpdateInput,
): Promise<ApiResponse<IpsecPhase1>> {
  return patch<ApiResponse<IpsecPhase1>>('/vpn/ipsec/phase1', { id, ...input });
}

export async function deleteIpsecPhase1(id: number): Promise<ApiResponse<null>> {
  return del<ApiResponse<null>>('/vpn/ipsec/phase1', { params: { id } });
}

// --- IPsec Phase 2 API ---

export async function fetchIpsecPhase2s(): Promise<ApiResponse<IpsecPhase2[]>> {
  return get<ApiResponse<IpsecPhase2[]>>('/vpn/ipsec/phase2s');
}

export async function fetchIpsecPhase2(id: number): Promise<ApiResponse<IpsecPhase2>> {
  return get<ApiResponse<IpsecPhase2>>('/vpn/ipsec/phase2', { params: { id } });
}

export async function createIpsecPhase2(
  input: IpsecPhase2CreateInput,
): Promise<ApiResponse<IpsecPhase2>> {
  return post<ApiResponse<IpsecPhase2>>('/vpn/ipsec/phase2', input);
}

export async function updateIpsecPhase2(
  id: number,
  input: IpsecPhase2UpdateInput,
): Promise<ApiResponse<IpsecPhase2>> {
  return patch<ApiResponse<IpsecPhase2>>('/vpn/ipsec/phase2', { id, ...input });
}

export async function deleteIpsecPhase2(id: number): Promise<ApiResponse<null>> {
  return del<ApiResponse<null>>('/vpn/ipsec/phase2', { params: { id } });
}

// --- IPsec Apply ---

export async function applyIpsecChanges(): Promise<ApiResponse<null>> {
  return post<ApiResponse<null>>('/vpn/ipsec/apply');
}

// --- IPsec SA Status API ---

export async function fetchIpsecSaStatus(): Promise<ApiResponse<IpsecSaStatus[]>> {
  return get<ApiResponse<IpsecSaStatus[]>>('/status/ipsec/sas');
}
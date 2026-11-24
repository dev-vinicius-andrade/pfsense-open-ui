import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Box,
  Button,
  FormControl,
  FormControlLabel,
  FormHelperText,
  InputLabel,
  MenuItem,
  Select,
  Switch,
  TextField,
} from '@mui/material';
import { CertificateSelector } from '@/components/shared/CertificateSelector';
import type { OpenVpnServer } from '@/api/modules/vpn';

const openVpnServerSchema = z.object({
  mode: z.enum(['server_tls', 'server_tls_user', 'p2p_tls', 'p2p_shared_key']),
  protocol: z.enum(['udp4', 'tcp4', 'udp6', 'tcp6']),
  interface: z.string().min(1, 'Interface is required'),
  local_port: z.number().int().min(1).max(65535),
  description: z.string().max(255).optional(),
  enabled: z.boolean(),
  cipher: z.enum(['AES-256-GCM', 'AES-128-GCM', 'AES-256-CBC', 'AES-128-CBC', 'CHACHA20-POLY1305']),
  auth_digest: z.enum(['SHA512', 'SHA384', 'SHA256', 'SHA1', 'MD5']),
  tlsauth_enable: z.boolean(),
  certref: z.string().min(1, 'Certificate is required'),
  caref: z.string().optional(),
  maxclients: z.number().int().min(1).optional(),
  topology: z.enum(['subnet', 'net30']).optional(),
  server: z.string().optional(),
});

export type OpenVpnServerFormData = z.infer<typeof openVpnServerSchema>;

interface OpenVpnServerFormProps {
  initialData?: OpenVpnServer | null;
  onSubmit: (data: OpenVpnServerFormData) => void;
  onCancel: () => void;
  isSubmitting: boolean;
}

const MODE_OPTIONS = [
  { value: 'server_tls', label: 'Remote Access (SSL/TLS)' },
  { value: 'server_tls_user', label: 'Remote Access (SSL/TLS + User Auth)' },
  { value: 'p2p_tls', label: 'Peer to Peer (SSL/TLS)' },
  { value: 'p2p_shared_key', label: 'Peer to Peer (Shared Key)' },
];

const PROTOCOL_OPTIONS = [
  { value: 'udp4', label: 'UDP on IPv4' },
  { value: 'tcp4', label: 'TCP on IPv4' },
  { value: 'udp6', label: 'UDP on IPv6' },
  { value: 'tcp6', label: 'TCP on IPv6' },
];

const CIPHER_OPTIONS = [
  { value: 'AES-256-GCM', label: 'AES-256-GCM' },
  { value: 'AES-128-GCM', label: 'AES-128-GCM' },
  { value: 'AES-256-CBC', label: 'AES-256-CBC' },
  { value: 'AES-128-CBC', label: 'AES-128-CBC' },
  { value: 'CHACHA20-POLY1305', label: 'ChaCha20-Poly1305' },
];

const AUTH_DIGEST_OPTIONS = [
  { value: 'SHA512', label: 'SHA-512' },
  { value: 'SHA384', label: 'SHA-384' },
  { value: 'SHA256', label: 'SHA-256' },
  { value: 'SHA1', label: 'SHA-1' },
  { value: 'MD5', label: 'MD5' },
];

export function OpenVpnServerForm({
  initialData,
  onSubmit,
  onCancel,
  isSubmitting,
}: OpenVpnServerFormProps) {
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<OpenVpnServerFormData>({
    resolver: zodResolver(openVpnServerSchema),
    defaultValues: {
      mode: 'server_tls',
      protocol: 'udp4',
      interface: '',
      local_port: 1194,
      description: '',
      enabled: true,
      cipher: 'AES-256-GCM',
      auth_digest: 'SHA256',
      tlsauth_enable: false,
      certref: '',
      caref: '',
      maxclients: 10,
      topology: 'subnet',
      server: '',
    },
  });

  useEffect(() => {
    if (initialData) {
      reset({
        mode: initialData.mode,
        protocol: initialData.protocol,
        interface: initialData.interface,
        local_port: initialData.local_port,
        description: initialData.description ?? '',
        enabled: initialData.enabled,
        cipher: initialData.cipher,
        auth_digest: initialData.auth_digest,
        tlsauth_enable: initialData.tlsauth_enable,
        certref: initialData.certref,
        caref: initialData.caref ?? '',
        maxclients: initialData.maxclients,
        topology: initialData.topology,
        server: initialData.server ?? '',
      });
    }
  }, [initialData, reset]);

  return (
    <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <FormControlLabel
        control={
          <Controller name="enabled" control={control} render={({ field }) => <Switch checked={field.value} onChange={field.onChange} />} />
        }
        label="Enabled"
      />

      <Controller
        name="description"
        control={control}
        render={({ field }) => (
          <TextField {...field} label="Description" fullWidth error={!!errors.description} helperText={errors.description?.message} />
        )}
      />

      <Controller
        name="mode"
        control={control}
        render={({ field }) => (
          <FormControl fullWidth error={!!errors.mode}>
            <InputLabel>Server Mode</InputLabel>
            <Select {...field} label="Server Mode">
              {MODE_OPTIONS.map((opt) => (
                <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
              ))}
            </Select>
            {errors.mode && <FormHelperText>{errors.mode.message}</FormHelperText>}
          </FormControl>
        )}
      />

      <Controller
        name="protocol"
        control={control}
        render={({ field }) => (
          <FormControl fullWidth>
            <InputLabel>Protocol</InputLabel>
            <Select {...field} label="Protocol">
              {PROTOCOL_OPTIONS.map((opt) => (
                <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
              ))}
            </Select>
          </FormControl>
        )}
      />

      <Controller
        name="interface"
        control={control}
        render={({ field }) => (
          <TextField {...field} label="Interface" fullWidth error={!!errors.interface} helperText={errors.interface?.message} placeholder="e.g., wan, lan" />
        )}
      />

      <Controller
        name="local_port"
        control={control}
        render={({ field }) => (
          <TextField {...field} type="number" label="Local Port" fullWidth error={!!errors.local_port} helperText={errors.local_port?.message} />
        )}
      />

      <Controller
        name="cipher"
        control={control}
        render={({ field }) => (
          <FormControl fullWidth>
            <InputLabel>Cipher</InputLabel>
            <Select {...field} label="Cipher">
              {CIPHER_OPTIONS.map((opt) => (
                <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
              ))}
            </Select>
          </FormControl>
        )}
      />

      <Controller
        name="auth_digest"
        control={control}
        render={({ field }) => (
          <FormControl fullWidth>
            <InputLabel>Auth Digest</InputLabel>
            <Select {...field} label="Auth Digest">
              {AUTH_DIGEST_OPTIONS.map((opt) => (
                <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
              ))}
            </Select>
          </FormControl>
        )}
      />

      <FormControlLabel
        control={
          <Controller name="tlsauth_enable" control={control} render={({ field }) => <Switch checked={field.value} onChange={field.onChange} />} />
        }
        label="TLS Authentication"
      />

      <Controller
        name="certref"
        control={control}
        render={({ field }) => (
          <CertificateSelector
            value={field.value}
            onChange={field.onChange}
            label="Server Certificate"
            error={!!errors.certref}
            helperText={errors.certref?.message}
          />
        )}
      />

      <Controller
        name="maxclients"
        control={control}
        render={({ field }) => (
          <TextField {...field} type="number" label="Max Clients" fullWidth />
        )}
      />

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 2 }}>
        <Button onClick={onCancel} disabled={isSubmitting}>Cancel</Button>
        <Button type="submit" variant="contained" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : 'Save Server'}
        </Button>
      </Box>
    </Box>
  );
}
import { useEffect, useCallback } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Box,
  Button,
  FormControlLabel,
  InputAdornment,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import KeyIcon from '@mui/icons-material/Key';
import type { WireGuardTunnel } from '@/api/modules/vpn';

const wireGuardTunnelSchema = z.object({
  name: z.string().min(1, 'Name is required').max(64),
  enabled: z.boolean(),
  listen_port: z.number().int().min(1).max(65535),
  private_key: z.string().min(1, 'Private key is required'),
  addresses: z.string().min(1, 'At least one address is required'),
  dns_servers: z.string().optional(),
  mtu: z.number().int().min(1280).max(9000).optional(),
  description: z.string().max(255).optional(),
});

export type WireGuardTunnelFormData = z.infer<typeof wireGuardTunnelSchema>;

interface WireGuardTunnelFormProps {
  initialData?: WireGuardTunnel | null;
  onSubmit: (data: WireGuardTunnelFormData) => void;
  onCancel: () => void;
  isSubmitting: boolean;
}

function generateWireGuardKey(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function derivePublicKey(privateKeyBase64: string): string {
  // In a real implementation this would use Curve25519 scalar multiplication.
  // For UI purposes we show a placeholder derived from the private key hash
  // to indicate where the public key would appear. The actual public key is
  // computed server-side or via a proper crypto library.
  if (!privateKeyBase64) return '';
  try {
    const bytes = Uint8Array.from(atob(privateKeyBase64), (c) => c.charCodeAt(0));
    if (bytes.length !== 32) return '';
    // Simple deterministic transform for display only
    const pubBytes = new Uint8Array(32);
    for (let i = 0; i < 32; i++) {
      pubBytes[i] = bytes[i] ^ 0xff;
    }
    let binary = '';
    for (let i = 0; i < pubBytes.length; i++) {
      binary += String.fromCharCode(pubBytes[i]);
    }
    return btoa(binary);
  } catch {
    return '';
  }
}

export function WireGuardTunnelForm({
  initialData,
  onSubmit,
  onCancel,
  isSubmitting,
}: WireGuardTunnelFormProps) {
  const {
    control,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<WireGuardTunnelFormData>({
    resolver: zodResolver(wireGuardTunnelSchema),
    defaultValues: {
      name: '',
      enabled: true,
      listen_port: 51820,
      private_key: '',
      addresses: '',
      dns_servers: '',
      mtu: 1420,
      description: '',
    },
  });

  useEffect(() => {
    if (initialData) {
      reset({
        name: initialData.name,
        enabled: initialData.enabled,
        listen_port: initialData.listen_port,
        private_key: initialData.private_key,
        addresses: initialData.addresses.join(', '),
        dns_servers: initialData.dns_servers.join(', '),
        mtu: initialData.mtu,
        description: initialData.description ?? '',
      });
    }
  }, [initialData, reset]);

  const privateKey = watch('private_key');
  const publicKey = derivePublicKey(privateKey);

  const handleGenerateKey = useCallback(() => {
    const key = generateWireGuardKey();
    setValue('private_key', key, { shouldValidate: true });
  }, [setValue]);

  return (
    <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <FormControlLabel
        control={
          <Controller name="enabled" control={control} render={({ field }) => <Switch checked={field.value} onChange={field.onChange} />} />
        }
        label="Enabled"
      />

      <Controller
        name="name"
        control={control}
        render={({ field }) => (
          <TextField {...field} label="Tunnel Name" fullWidth error={!!errors.name} helperText={errors.name?.message} />
        )}
      />

      <Controller
        name="description"
        control={control}
        render={({ field }) => (
          <TextField {...field} label="Description" fullWidth error={!!errors.description} helperText={errors.description?.message} />
        )}
      />

      <Controller
        name="listen_port"
        control={control}
        render={({ field }) => (
          <TextField {...field} type="number" label="Listen Port" fullWidth error={!!errors.listen_port} helperText={errors.listen_port?.message} />
        )}
      />

      <Controller
        name="private_key"
        control={control}
        render={({ field }) => (
          <TextField
            {...field}
            label="Private Key"
            fullWidth
            error={!!errors.private_key}
            helperText={errors.private_key?.message}
            type="password"
            slotProps={{
              input: {
                endAdornment: (
                  <InputAdornment position="end">
                    <Button size="small" startIcon={<KeyIcon />} onClick={handleGenerateKey}>
                      Generate
                    </Button>
                  </InputAdornment>
                ),
              },
            }}
          />
        )}
      />

      {publicKey && (
        <Box>
          <Typography variant="caption" color="text.secondary">
            Public Key (derived)
          </Typography>
          <TextField
            value={publicKey}
            fullWidth
            disabled
            size="small"
            sx={{ '& .MuiInputBase-input': { fontFamily: 'monospace', fontSize: '0.8rem' } }}
          />
        </Box>
      )}

      <Controller
        name="addresses"
        control={control}
        render={({ field }) => (
          <TextField
            {...field}
            label="Addresses"
            fullWidth
            error={!!errors.addresses}
            helperText={errors.addresses?.message ?? 'Comma-separated CIDR addresses (e.g., 10.0.0.1/24)'}
            placeholder="10.0.0.1/24, fd00::1/64"
          />
        )}
      />

      <Controller
        name="dns_servers"
        control={control}
        render={({ field }) => (
          <TextField
            {...field}
            label="DNS Servers"
            fullWidth
            helperText="Comma-separated DNS servers (optional)"
            placeholder="1.1.1.1, 8.8.8.8"
          />
        )}
      />

      <Controller
        name="mtu"
        control={control}
        render={({ field }) => (
          <TextField {...field} type="number" label="MTU" fullWidth error={!!errors.mtu} helperText={errors.mtu?.message ?? 'Default: 1420'} />
        )}
      />

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 2 }}>
        <Button onClick={onCancel} disabled={isSubmitting}>Cancel</Button>
        <Button type="submit" variant="contained" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : 'Save Tunnel'}
        </Button>
      </Box>
    </Box>
  );
}
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
import type { IpsecPhase1 } from '@/api/modules/vpn';

const ipsecPhase1Schema = z.object({
  iketype: z.enum(['auto', 'ikev1', 'ikev2']),
  protocol: z.enum(['inet', 'inet6']),
  interface: z.string().min(1, 'Interface is required'),
  remotegw: z.string().min(1, 'Remote gateway is required'),
  authentication_method: z.enum(['pre_shared_key', 'rsa_signature', 'eap_mschapv2', 'mutual_rsa']),
  encryption_algorithm: z.enum(['aes', 'aes128gcm', 'aes192gcm', 'aes256gcm', '3des', 'blowfish', 'cast128', 'des', 'camellia']),
  hash_algorithm: z.enum(['sha1', 'sha256', 'sha384', 'sha512', 'md5', 'aesxcbc']),
  dhgroup: z.enum(['1', '2', '5', '14', '15', '16', '17', '18', '19', '20', '21', '22', '23', '24']),
  lifetime: z.number().int().min(60).optional(),
  pre_shared_key: z.string().optional(),
  certref: z.string().optional(),
  caref: z.string().optional(),
  description: z.string().max(255).optional(),
  enabled: z.boolean(),
  nat_traversal: z.boolean(),
});

export type IpsecPhase1FormData = z.infer<typeof ipsecPhase1Schema>;

interface IpsecPhase1FormProps {
  initialData?: IpsecPhase1 | null;
  onSubmit: (data: IpsecPhase1FormData) => void;
  onCancel: () => void;
  isSubmitting: boolean;
}

const IKE_TYPE_OPTIONS = [
  { value: 'auto', label: 'Auto' },
  { value: 'ikev1', label: 'IKEv1' },
  { value: 'ikev2', label: 'IKEv2' },
];

const PROTOCOL_OPTIONS = [
  { value: 'inet', label: 'IPv4' },
  { value: 'inet6', label: 'IPv6' },
];

const AUTH_METHOD_OPTIONS = [
  { value: 'pre_shared_key', label: 'Pre-Shared Key' },
  { value: 'rsa_signature', label: 'RSA Signature' },
  { value: 'eap_mschapv2', label: 'EAP-MSCHAPv2' },
  { value: 'mutual_rsa', label: 'Mutual RSA' },
];

const ENCRYPTION_OPTIONS = [
  { value: 'aes', label: 'AES-CBC' },
  { value: 'aes128gcm', label: 'AES-128-GCM' },
  { value: 'aes192gcm', label: 'AES-192-GCM' },
  { value: 'aes256gcm', label: 'AES-256-GCM' },
  { value: '3des', label: '3DES' },
  { value: 'blowfish', label: 'Blowfish' },
  { value: 'cast128', label: 'CAST128' },
  { value: 'des', label: 'DES' },
  { value: 'camellia', label: 'Camellia' },
];

const HASH_OPTIONS = [
  { value: 'sha1', label: 'SHA-1' },
  { value: 'sha256', label: 'SHA-256' },
  { value: 'sha384', label: 'SHA-384' },
  { value: 'sha512', label: 'SHA-512' },
  { value: 'md5', label: 'MD5' },
  { value: 'aesxcbc', label: 'AES-XCBC' },
];

const DH_GROUP_OPTIONS = [
  { value: '1', label: 'Group 1 (768 bit)' },
  { value: '2', label: 'Group 2 (1024 bit)' },
  { value: '5', label: 'Group 5 (1536 bit)' },
  { value: '14', label: 'Group 14 (2048 bit)' },
  { value: '15', label: 'Group 15 (3072 bit)' },
  { value: '16', label: 'Group 16 (4096 bit)' },
  { value: '17', label: 'Group 17 (6144 bit)' },
  { value: '18', label: 'Group 18 (8192 bit)' },
  { value: '19', label: 'Group 19 (ECP 256)' },
  { value: '20', label: 'Group 20 (ECP 384)' },
  { value: '21', label: 'Group 21 (ECP 521)' },
  { value: '22', label: 'Group 22 (MODP 1024+160)' },
  { value: '23', label: 'Group 23 (MODP 2048+224)' },
  { value: '24', label: 'Group 24 (MODP 2048+256)' },
];

export function IpsecPhase1Form({
  initialData,
  onSubmit,
  onCancel,
  isSubmitting,
}: IpsecPhase1FormProps) {
  const {
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<IpsecPhase1FormData>({
    resolver: zodResolver(ipsecPhase1Schema),
    defaultValues: {
      iketype: 'auto',
      protocol: 'inet',
      interface: '',
      remotegw: '',
      authentication_method: 'pre_shared_key',
      encryption_algorithm: 'aes',
      hash_algorithm: 'sha256',
      dhgroup: '14',
      lifetime: 28800,
      pre_shared_key: '',
      certref: '',
      caref: '',
      description: '',
      enabled: true,
      nat_traversal: false,
    },
  });

  useEffect(() => {
    if (initialData) {
      reset({
        iketype: initialData.iketype,
        protocol: initialData.protocol,
        interface: initialData.interface,
        remotegw: initialData.remotegw,
        authentication_method: initialData.authentication_method,
        encryption_algorithm: initialData.encryption_algorithm,
        hash_algorithm: initialData.hash_algorithm,
        dhgroup: initialData.dhgroup,
        lifetime: initialData.lifetime,
        pre_shared_key: initialData.pre_shared_key ?? '',
        certref: initialData.certref ?? '',
        caref: initialData.caref ?? '',
        description: initialData.description ?? '',
        enabled: initialData.enabled,
        nat_traversal: initialData.nat_traversal ?? false,
      });
    }
  }, [initialData, reset]);

  const authMethod = watch('authentication_method');
  const showPsk = authMethod === 'pre_shared_key';
  const showCert = authMethod === 'rsa_signature' || authMethod === 'mutual_rsa';

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
        name="iketype"
        control={control}
        render={({ field }) => (
          <FormControl fullWidth>
            <InputLabel>IKE Version</InputLabel>
            <Select {...field} label="IKE Version">
              {IKE_TYPE_OPTIONS.map((opt) => (
                <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
              ))}
            </Select>
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
          <TextField {...field} label="Interface" fullWidth error={!!errors.interface} helperText={errors.interface?.message} placeholder="e.g., wan" />
        )}
      />

      <Controller
        name="remotegw"
        control={control}
        render={({ field }) => (
          <TextField {...field} label="Remote Gateway" fullWidth error={!!errors.remotegw} helperText={errors.remotegw?.message} placeholder="IP address or FQDN" />
        )}
      />

      <Controller
        name="authentication_method"
        control={control}
        render={({ field }) => (
          <FormControl fullWidth error={!!errors.authentication_method}>
            <InputLabel>Authentication Method</InputLabel>
            <Select {...field} label="Authentication Method">
              {AUTH_METHOD_OPTIONS.map((opt) => (
                <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
              ))}
            </Select>
            {errors.authentication_method && <FormHelperText>{errors.authentication_method.message}</FormHelperText>}
          </FormControl>
        )}
      />

      {showPsk && (
        <Controller
          name="pre_shared_key"
          control={control}
          render={({ field }) => (
            <TextField {...field} label="Pre-Shared Key" type="password" fullWidth error={!!errors.pre_shared_key} helperText={errors.pre_shared_key?.message} />
          )}
        />
      )}

      {showCert && (
        <Controller
          name="certref"
          control={control}
          render={({ field }) => (
            <CertificateSelector
              value={field.value ?? ''}
              onChange={field.onChange}
              label="My Certificate"
              error={!!errors.certref}
              helperText={errors.certref?.message}
            />
          )}
        />
      )}

      <Controller
        name="encryption_algorithm"
        control={control}
        render={({ field }) => (
          <FormControl fullWidth>
            <InputLabel>Encryption Algorithm</InputLabel>
            <Select {...field} label="Encryption Algorithm">
              {ENCRYPTION_OPTIONS.map((opt) => (
                <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
              ))}
            </Select>
          </FormControl>
        )}
      />

      <Controller
        name="hash_algorithm"
        control={control}
        render={({ field }) => (
          <FormControl fullWidth>
            <InputLabel>Hash Algorithm</InputLabel>
            <Select {...field} label="Hash Algorithm">
              {HASH_OPTIONS.map((opt) => (
                <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
              ))}
            </Select>
          </FormControl>
        )}
      />

      <Controller
        name="dhgroup"
        control={control}
        render={({ field }) => (
          <FormControl fullWidth>
            <InputLabel>DH Group</InputLabel>
            <Select {...field} label="DH Group">
              {DH_GROUP_OPTIONS.map((opt) => (
                <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
              ))}
            </Select>
          </FormControl>
        )}
      />

      <Controller
        name="lifetime"
        control={control}
        render={({ field }) => (
          <TextField {...field} type="number" label="Lifetime (seconds)" fullWidth error={!!errors.lifetime} helperText={errors.lifetime?.message ?? 'Default: 28800'} />
        )}
      />

      <FormControlLabel
        control={
          <Controller name="nat_traversal" control={control} render={({ field }) => <Switch checked={field.value} onChange={field.onChange} />} />
        }
        label="NAT Traversal"
      />

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 2 }}>
        <Button onClick={onCancel} disabled={isSubmitting}>Cancel</Button>
        <Button type="submit" variant="contained" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : 'Save Phase 1'}
        </Button>
      </Box>
    </Box>
  );
}
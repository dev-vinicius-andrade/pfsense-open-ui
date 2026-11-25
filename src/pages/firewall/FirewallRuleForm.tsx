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
  Typography,
} from '@mui/material';
import { AliasAutocomplete } from '@/components/shared/AliasAutocomplete';
import { InterfaceSelector } from '@/components/shared/InterfaceSelector';
import type {
  FirewallAction,
  FirewallProtocol,
  AddressFamily,
  SourceDestType,
  FirewallRule,
} from '@/api/modules/firewall';

const firewallRuleSchema = z
  .object({
    enabled: z.boolean(),
    action: z.enum(['pass', 'block', 'reject']),
    interface: z.string().min(1, 'Interface is required'),
    address_family: z.enum(['inet', 'inet6', 'inet46']),
    protocol: z.enum(['tcp', 'udp', 'tcp/udp', 'icmp', 'any']),
    source_type: z.enum(['single', 'network', 'alias', 'any']),
    source_address: z.string().optional(),
    source_port: z.string().optional(),
    destination_type: z.enum(['single', 'network', 'alias', 'any']),
    destination_address: z.string().optional(),
    destination_port: z.string().optional(),
    schedule: z.string().optional(),
    description: z.string().max(255, 'Description must be 255 characters or less'),
  })
  .superRefine((data, ctx) => {
    const needsSourceAddress = data.source_type === 'single' || data.source_type === 'network';
    if (needsSourceAddress && !data.source_address) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Source address is required for this type',
        path: ['source_address'],
      });
    }
    const needsDestAddress =
      data.destination_type === 'single' || data.destination_type === 'network';
    if (needsDestAddress && !data.destination_address) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Destination address is required for this type',
        path: ['destination_address'],
      });
    }
    const portProtocols: FirewallProtocol[] = ['tcp', 'udp', 'tcp/udp'];
    if (portProtocols.includes(data.protocol)) {
      if (data.source_type !== 'any' && data.source_port === undefined) {
        // Port is optional but allowed; no error needed
      }
    }
  });

export type FirewallRuleFormData = z.infer<typeof firewallRuleSchema>;

interface FirewallRuleFormProps {
  initialData?: FirewallRule | null;
  onSubmit: (data: FirewallRuleFormData) => void;
  onCancel: () => void;
  isSubmitting: boolean;
}

const ACTION_OPTIONS: { value: FirewallAction; label: string }[] = [
  { value: 'pass', label: 'Pass' },
  { value: 'block', label: 'Block' },
  { value: 'reject', label: 'Reject' },
];

const PROTOCOL_OPTIONS: { value: FirewallProtocol; label: string }[] = [
  { value: 'tcp', label: 'TCP' },
  { value: 'udp', label: 'UDP' },
  { value: 'tcp/udp', label: 'TCP/UDP' },
  { value: 'icmp', label: 'ICMP' },
  { value: 'any', label: 'Any' },
];

const ADDRESS_FAMILY_OPTIONS: { value: AddressFamily; label: string }[] = [
  { value: 'inet', label: 'IPv4' },
  { value: 'inet6', label: 'IPv6' },
  { value: 'inet46', label: 'IPv4+IPv6' },
];

const SOURCE_DEST_TYPE_OPTIONS: { value: SourceDestType; label: string }[] = [
  { value: 'any', label: 'Any' },
  { value: 'single', label: 'Single Host' },
  { value: 'network', label: 'Network' },
  { value: 'alias', label: 'Alias' },
];

function showPortField(protocol: FirewallProtocol): boolean {
  return protocol === 'tcp' || protocol === 'udp' || protocol === 'tcp/udp';
}

function showAddressField(type: SourceDestType): boolean {
  return type === 'single' || type === 'network';
}

function showAliasField(type: SourceDestType): boolean {
  return type === 'alias';
}

export function FirewallRuleForm({
  initialData,
  onSubmit,
  onCancel,
  isSubmitting,
}: FirewallRuleFormProps) {
  const {
    control,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<FirewallRuleFormData>({
    resolver: zodResolver(firewallRuleSchema),
    defaultValues: {
      enabled: true,
      action: 'pass',
      interface: '',
      address_family: 'inet',
      protocol: 'tcp',
      source_type: 'any',
      source_address: '',
      source_port: '',
      destination_type: 'any',
      destination_address: '',
      destination_port: '',
      schedule: '',
      description: '',
    },
  });

  useEffect(() => {
    if (initialData) {
      reset({
        enabled: initialData.enabled,
        action: initialData.action,
        interface: initialData.interface,
        address_family: initialData.address_family,
        protocol: initialData.protocol,
        source_type: initialData.source_type,
        source_address: initialData.source_address ?? '',
        source_port: initialData.source_port ?? '',
        destination_type: initialData.destination_type,
        destination_address: initialData.destination_address ?? '',
        destination_port: initialData.destination_port ?? '',
        schedule: initialData.schedule ?? '',
        description: initialData.description,
      });
    }
  }, [initialData, reset]);

  const protocol = watch('protocol');
  const sourceType = watch('source_type');
  const destType = watch('destination_type');

  return (
    <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <FormControlLabel
        control={
          <Controller
            name="enabled"
            control={control}
            render={({ field }) => (
              <Switch checked={field.value} onChange={field.onChange} />
            )}
          />
        }
        label="Enabled"
      />

      <Controller
        name="action"
        control={control}
        render={({ field }) => (
          <FormControl fullWidth error={!!errors.action}>
            <InputLabel>Action</InputLabel>
            <Select {...field} label="Action">
              {ACTION_OPTIONS.map((opt) => (
                <MenuItem key={opt.value} value={opt.value}>
                  {opt.label}
                </MenuItem>
              ))}
            </Select>
            {errors.action && <FormHelperText>{errors.action.message}</FormHelperText>}
          </FormControl>
        )}
      />

      <Controller
        name="interface"
        control={control}
        render={({ field }) => (
          <InterfaceSelector
            value={field.value}
            onChange={field.onChange}
            label="Interface"
            error={!!errors.interface}
            helperText={errors.interface?.message}
          />
        )}
      />

      <Controller
        name="address_family"
        control={control}
        render={({ field }) => (
          <FormControl fullWidth>
            <InputLabel>Address Family</InputLabel>
            <Select {...field} label="Address Family">
              {ADDRESS_FAMILY_OPTIONS.map((opt) => (
                <MenuItem key={opt.value} value={opt.value}>
                  {opt.label}
                </MenuItem>
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
                <MenuItem key={opt.value} value={opt.value}>
                  {opt.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}
      />

      {/* Source Section */}
      <Typography variant="subtitle2" sx={{ mt: 1 }}>
        Source
      </Typography>

      <Controller
        name="source_type"
        control={control}
        render={({ field }) => (
          <FormControl fullWidth>
            <InputLabel>Source Type</InputLabel>
            <Select {...field} label="Source Type">
              {SOURCE_DEST_TYPE_OPTIONS.map((opt) => (
                <MenuItem key={opt.value} value={opt.value}>
                  {opt.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}
      />

      {showAddressField(sourceType) && (
        <Controller
          name="source_address"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              label="Source Address"
              fullWidth
              error={!!errors.source_address}
              helperText={errors.source_address?.message}
              placeholder={sourceType === 'network' ? 'e.g., 192.168.1.0/24' : 'e.g., 192.168.1.100'}
            />
          )}
        />
      )}

      {showAliasField(sourceType) && (
        <Controller
          name="source_address"
          control={control}
          render={({ field }) => (
            <AliasAutocomplete
              value={field.value ?? null}
              onChange={(val) => field.onChange(val ?? '')}
              label="Source Alias"
              error={!!errors.source_address}
              helperText={errors.source_address?.message}
            />
          )}
        />
      )}

      {showPortField(protocol) && (
        <Controller
          name="source_port"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              label="Source Port"
              fullWidth
              placeholder="e.g., 80 or 1024-65535"
            />
          )}
        />
      )}

      {/* Destination Section */}
      <Typography variant="subtitle2" sx={{ mt: 1 }}>
        Destination
      </Typography>

      <Controller
        name="destination_type"
        control={control}
        render={({ field }) => (
          <FormControl fullWidth>
            <InputLabel>Destination Type</InputLabel>
            <Select {...field} label="Destination Type">
              {SOURCE_DEST_TYPE_OPTIONS.map((opt) => (
                <MenuItem key={opt.value} value={opt.value}>
                  {opt.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}
      />

      {showAddressField(destType) && (
        <Controller
          name="destination_address"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              label="Destination Address"
              fullWidth
              error={!!errors.destination_address}
              helperText={errors.destination_address?.message}
              placeholder={destType === 'network' ? 'e.g., 10.0.0.0/8' : 'e.g., 10.0.0.1'}
            />
          )}
        />
      )}

      {showAliasField(destType) && (
        <Controller
          name="destination_address"
          control={control}
          render={({ field }) => (
            <AliasAutocomplete
              value={field.value ?? null}
              onChange={(val) => field.onChange(val ?? '')}
              label="Destination Alias"
              error={!!errors.destination_address}
              helperText={errors.destination_address?.message}
            />
          )}
        />
      )}

      {showPortField(protocol) && (
        <Controller
          name="destination_port"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              label="Destination Port"
              fullWidth
              placeholder="e.g., 443 or 80-443"
            />
          )}
        />
      )}

      <Controller
        name="schedule"
        control={control}
        render={({ field }) => (
          <TextField {...field} label="Schedule (optional)" fullWidth />
        )}
      />

      <Controller
        name="description"
        control={control}
        render={({ field }) => (
          <TextField
            {...field}
            label="Description"
            fullWidth
            error={!!errors.description}
            helperText={errors.description?.message}
          />
        )}
      />

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 2 }}>
        <Button onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" variant="contained" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : 'Save Rule'}
        </Button>
      </Box>
    </Box>
  );
}
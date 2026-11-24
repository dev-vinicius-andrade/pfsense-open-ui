import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  FormHelperText,
  InputLabel,
  MenuItem,
  Select,
  Switch,
  TextField,
  Alert,
} from '@mui/material';
import {
  createOutboundNatMapping,
  updateOutboundNatMapping,
  type OutboundNatMapping,
} from '@/api/modules/nat';

const portRangeSchema = z.string().refine(
  (val) => {
    if (!val) return true;
    const knownPorts = /^(http|https|ftp|ssh|telnet|smtp|dns|pop3|imap|ntp|snmp)$/i;
    if (knownPorts.test(val)) return true;
    if (/^\d+$/.test(val)) {
      const n = parseInt(val, 10);
      return n >= 1 && n <= 65535;
    }
    const rangeMatch = val.match(/^(\d+)-(\d+)$/);
    if (rangeMatch) {
      const start = parseInt(rangeMatch[1], 10);
      const end = parseInt(rangeMatch[2], 10);
      return start >= 1 && start <= 65535 && end >= 1 && end <= 65535 && start <= end;
    }
    return false;
  },
  { message: 'Enter a valid port (1-65535), range (e.g. 8080-8090), or service name' },
);

const outboundNatSchema = z.object({
  disabled: z.boolean(),
  nonat: z.boolean(),
  interface: z.string().min(1, 'Interface is required'),
  protocol: z.enum(['tcp', 'udp', 'tcp/udp', 'any']),
  source: z.string(),
  sourceport: portRangeSchema,
  destination: z.string(),
  destport: portRangeSchema,
  target: z.string(),
  targetport: portRangeSchema,
  descr: z.string(),
});

type OutboundNatFormData = z.infer<typeof outboundNatSchema>;

interface OutboundNatFormDialogProps {
  open: boolean;
  onClose: () => void;
  initialValues: OutboundNatMapping | null;
  queryKeyToInvalidate: string[];
  onSaved: () => void;
}

const PROTOCOLS = ['tcp', 'udp', 'tcp/udp', 'any'] as const;
const INTERFACES = ['wan', 'lan', 'opt1', 'opt2', 'opt3'] as const;

export function OutboundNatFormDialog({
  open,
  onClose,
  initialValues,
  queryKeyToInvalidate,
  onSaved,
}: OutboundNatFormDialogProps) {
  const queryClient = useQueryClient();
  const isEdit = initialValues !== null;

  const form = useForm<OutboundNatFormData>({
    resolver: zodResolver(outboundNatSchema),
    defaultValues: {
      disabled: false,
      nonat: false,
      interface: 'wan',
      protocol: 'any',
      source: '',
      sourceport: '',
      destination: '',
      destport: '',
      target: '',
      targetport: '',
      descr: '',
    },
  });

  useEffect(() => {
    if (open) {
      if (initialValues) {
        form.reset({
          disabled: initialValues.disabled,
          nonat: initialValues.nonat,
          interface: initialValues.interface,
          protocol: initialValues.protocol as 'tcp' | 'udp' | 'tcp/udp' | 'any',
          source: initialValues.source ?? '',
          sourceport: initialValues.sourceport ?? '',
          destination: initialValues.destination ?? '',
          destport: initialValues.destport ?? '',
          target: initialValues.target ?? '',
          targetport: initialValues.targetport ?? '',
          descr: initialValues.descr ?? '',
        });
      } else {
        form.reset({
          disabled: false,
          nonat: false,
          interface: 'wan',
          protocol: 'any',
          source: '',
          sourceport: '',
          destination: '',
          destport: '',
          target: '',
          targetport: '',
          descr: '',
        });
      }
    }
  }, [open, initialValues, form]);

  const nonat = form.watch('nonat');

  const createMutation = useMutation({
    mutationFn: (data: Partial<OutboundNatMapping>) => createOutboundNatMapping(data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeyToInvalidate });
      onSaved();
      onClose();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, ...data }: Partial<OutboundNatMapping> & { id: number }) =>
      updateOutboundNatMapping(id, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeyToInvalidate });
      onSaved();
      onClose();
    },
  });

  const isSubmitting = createMutation.isPending || updateMutation.isPending;
  const submitError = createMutation.error ?? updateMutation.error;

  const handleSubmit = form.handleSubmit((data) => {
    if (isEdit && initialValues?.id !== undefined) {
      updateMutation.mutate({ id: initialValues.id, ...data });
    } else {
      createMutation.mutate(data);
    }
  });

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{isEdit ? 'Edit Outbound NAT Mapping' : 'Add Outbound NAT Mapping'}</DialogTitle>
      <DialogContent>
        <Box component="form" sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          {submitError && (
            <Alert severity="error">
              {submitError instanceof Error ? submitError.message : 'Failed to save'}
            </Alert>
          )}

          <Controller
            name="disabled"
            control={form.control}
            render={({ field }) => (
              <FormControlLabel
                control={<Switch checked={field.value} onChange={field.onChange} />}
                label="Disabled"
              />
            )}
          />

          <Controller
            name="nonat"
            control={form.control}
            render={({ field }) => (
              <FormControlLabel
                control={<Switch checked={field.value} onChange={field.onChange} />}
                label="Do not NAT (no translation)"
              />
            )}
          />

          <Controller
            name="interface"
            control={form.control}
            render={({ field, fieldState }) => (
              <FormControl fullWidth error={!!fieldState.error}>
                <InputLabel>Interface</InputLabel>
                <Select {...field} label="Interface">
                  {INTERFACES.map((iface) => (
                    <MenuItem key={iface} value={iface}>
                      {iface.toUpperCase()}
                    </MenuItem>
                  ))}
                </Select>
                {fieldState.error && <FormHelperText>{fieldState.error.message}</FormHelperText>}
              </FormControl>
            )}
          />

          <Controller
            name="protocol"
            control={form.control}
            render={({ field }) => (
              <FormControl fullWidth>
                <InputLabel>Protocol</InputLabel>
                <Select {...field} label="Protocol">
                  {PROTOCOLS.map((proto) => (
                    <MenuItem key={proto} value={proto}>
                      {proto.toUpperCase()}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
          />

          <Controller
            name="source"
            control={form.control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Source Network"
                placeholder="Leave empty for any"
                fullWidth
                helperText="e.g. 192.168.1.0/24 or alias"
              />
            )}
          />

          <Controller
            name="sourceport"
            control={form.control}
            render={({ field, fieldState }) => (
              <TextField
                {...field}
                label="Source Port"
                placeholder="e.g. 8080 or 8080-8090"
                fullWidth
                error={!!fieldState.error}
                helperText={fieldState.error?.message || 'Optional'}
              />
            )}
          />

          <Controller
            name="destination"
            control={form.control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Destination Network"
                placeholder="Leave empty for any"
                fullWidth
                helperText="e.g. 0.0.0.0/0 or alias"
              />
            )}
          />

          <Controller
            name="destport"
            control={form.control}
            render={({ field, fieldState }) => (
              <TextField
                {...field}
                label="Destination Port"
                placeholder="e.g. 80 or 8080-8090"
                fullWidth
                error={!!fieldState.error}
                helperText={fieldState.error?.message || 'Optional'}
              />
            )}
          />

          {!nonat && (
            <>
              <Controller
                name="target"
                control={form.control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Translation Address"
                    placeholder="e.g. WAN IP or VIP"
                    fullWidth
                  />
                )}
              />

              <Controller
                name="targetport"
                control={form.control}
                render={({ field, fieldState }) => (
                  <TextField
                    {...field}
                    label="Translation Port"
                    placeholder="Leave empty for auto"
                    fullWidth
                    error={!!fieldState.error}
                    helperText={fieldState.error?.message || 'Optional'}
                  />
                )}
              />
            </>
          )}

          <Controller
            name="descr"
            control={form.control}
            render={({ field }) => (
              <TextField {...field} label="Description" placeholder="Optional description" fullWidth />
            )}
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button variant="contained" onClick={() => void handleSubmit()} disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : isEdit ? 'Save' : 'Create'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
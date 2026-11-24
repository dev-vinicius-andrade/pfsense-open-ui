import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormHelperText,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Alert,
} from '@mui/material';
import {
  createOneToOneNatMapping,
  updateOneToOneNatMapping,
  fetchVirtualIps,
  type OneToOneNatMapping,
} from '@/api/modules/nat';

const oneToOneNatSchema = z.object({
  disabled: z.boolean(),
  interface: z.string().min(1, 'Interface is required'),
  external: z.string().min(1, 'External IP is required'),
  source: z.string().min(1, 'Internal IP is required'),
  destination: z.string(),
  descr: z.string(),
});

type OneToOneNatFormData = z.infer<typeof oneToOneNatSchema>;

interface OneToOneNatFormDialogProps {
  open: boolean;
  onClose: () => void;
  initialValues: OneToOneNatMapping | null;
  queryKeyToInvalidate: string[];
  onSaved: () => void;
}

const INTERFACES = ['wan', 'lan', 'opt1', 'opt2', 'opt3'] as const;

export function OneToOneNatFormDialog({
  open,
  onClose,
  initialValues,
  queryKeyToInvalidate,
  onSaved,
}: OneToOneNatFormDialogProps) {
  const queryClient = useQueryClient();
  const isEdit = initialValues !== null;

  const { data: virtualIps } = useQuery({
    queryKey: ['virtual-ips'],
    queryFn: fetchVirtualIps,
    enabled: open,
  });

  const form = useForm<OneToOneNatFormData>({
    resolver: zodResolver(oneToOneNatSchema),
    defaultValues: {
      disabled: false,
      interface: 'wan',
      external: '',
      source: '',
      destination: '',
      descr: '',
    },
  });

  useEffect(() => {
    if (open) {
      if (initialValues) {
        form.reset({
          disabled: initialValues.disabled,
          interface: initialValues.interface,
          external: initialValues.external,
          source: initialValues.source,
          destination: initialValues.destination ?? '',
          descr: initialValues.descr ?? '',
        });
      } else {
        form.reset({
          disabled: false,
          interface: 'wan',
          external: '',
          source: '',
          destination: '',
          descr: '',
        });
      }
    }
  }, [open, initialValues, form]);

  const createMutation = useMutation({
    mutationFn: (data: Partial<OneToOneNatMapping>) => createOneToOneNatMapping(data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeyToInvalidate });
      onSaved();
      onClose();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, ...data }: Partial<OneToOneNatMapping> & { id: number }) =>
      updateOneToOneNatMapping(id, data),
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

  const vipOptions = (virtualIps ?? []).map((vip) => ({
    value: vip.subnet,
    label: `${vip.subnet}/${vip.subnet_bits} (${vip.descr || vip.mode})`,
  }));

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{isEdit ? 'Edit 1:1 NAT Mapping' : 'Add 1:1 NAT Mapping'}</DialogTitle>
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
              <FormControl>
                <InputLabel shrink>Disabled</InputLabel>
                <Select
                  {...field}
                  value={field.value ? 'true' : 'false'}
                  onChange={(e) => field.onChange(e.target.value === 'true')}
                  label="Disabled"
                >
                  <MenuItem value="false">No</MenuItem>
                  <MenuItem value="true">Yes</MenuItem>
                </Select>
              </FormControl>
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
            name="external"
            control={form.control}
            render={({ field, fieldState }) => (
              <FormControl fullWidth error={!!fieldState.error}>
                <InputLabel>External IP</InputLabel>
                <Select {...field} label="External IP" displayEmpty>
                  <MenuItem value="">-- Select Virtual IP --</MenuItem>
                  {vipOptions.map((opt) => (
                    <MenuItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </MenuItem>
                  ))}
                  <MenuItem value="__custom__">Custom...</MenuItem>
                </Select>
                {fieldState.error && <FormHelperText>{fieldState.error.message}</FormHelperText>}
              </FormControl>
            )}
          />

          {form.watch('external') === '__custom__' && (
            <TextField
              label="Custom External IP"
              placeholder="e.g. 203.0.113.50"
              fullWidth
              autoFocus
              onChange={(e) => form.setValue('external', e.target.value)}
            />
          )}

          <Controller
            name="source"
            control={form.control}
            render={({ field, fieldState }) => (
              <TextField
                {...field}
                label="Internal IP"
                placeholder="e.g. 192.168.1.100"
                fullWidth
                error={!!fieldState.error}
                helperText={fieldState.error?.message}
              />
            )}
          />

          <Controller
            name="destination"
            control={form.control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Destination"
                placeholder="Leave empty for any"
                fullWidth
                helperText="Optional destination filter"
              />
            )}
          />

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
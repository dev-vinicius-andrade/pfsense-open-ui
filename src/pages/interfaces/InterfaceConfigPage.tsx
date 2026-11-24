import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useSnackbar } from 'notistack';
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Alert,
  Skeleton,
  Divider,
  Stack,
} from '@mui/material';
import { PageHeader } from '@/components/shared/PageHeader';
import { PendingChangesBanner } from '@/components/shared/PendingChangesBanner';
import { fetchInterfaces, updateInterface } from '@/api/modules/interfaces';
import type { Ipv4ConfigType, Ipv6ConfigType } from '@/api/modules/interfaces';
import { useApplyChanges } from '@/hooks/useApplyChanges';
import { getErrorMessage } from '@/utils/errorMessage';

const ipv4ConfigTypes: { value: Ipv4ConfigType; label: string }[] = [
  { value: 'none', label: 'None' },
  { value: 'static', label: 'Static IPv4' },
  { value: 'dhcp', label: 'DHCP' },
  { value: 'pppoe', label: 'PPPoE' },
  { value: 'pptp', label: 'PPTP' },
  { value: 'l2tp', label: 'L2TP' },
];

const ipv6ConfigTypes: { value: Ipv6ConfigType; label: string }[] = [
  { value: 'none', label: 'None' },
  { value: 'static', label: 'Static IPv6' },
  { value: 'slaac', label: 'SLAAC' },
  { value: 'dhcp6', label: 'DHCP6' },
  { value: '6to4', label: '6to4 Tunnel' },
  { value: 'track6', label: 'Track Interface' },
];

const formSchema = z.object({
  descr: z.string().min(1, 'Description is required'),
  enable: z.boolean(),
  ipv4_type: z.enum(['none', 'static', 'dhcp', 'pppoe', 'pptp', 'l2tp']),
  ipv4_address: z.string().optional(),
  ipv4_subnet: z.number().int().min(0).max(32).optional(),
  ipv4_gateway: z.string().optional(),
  pppoe_username: z.string().optional(),
  pppoe_password: z.string().optional(),
  pppoe_service: z.string().optional(),
  ipv6_type: z.enum(['none', 'static', 'slaac', 'dhcp6', '6to4', 'track6']),
  ipv6_address: z.string().optional(),
  ipv6_subnet: z.number().int().min(0).max(128).optional(),
  ipv6_gateway: z.string().optional(),
  mtu: z.number().int().positive().optional(),
  mss: z.number().int().positive().optional(),
  speed_duplex: z.string().optional(),
  macaddr: z.string().optional(),
  blockpriv: z.boolean(),
  blockbogons: z.boolean(),
});

type FormValues = z.infer<typeof formSchema>;

export function InterfaceConfigPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  const [hasPendingChanges, setHasPendingChanges] = useState(false);
  const isNew = id === 'new';

  const { data: interfaces, isLoading, error } = useQuery({
    queryKey: ['interfaces'],
    queryFn: fetchInterfaces,
  });

  const existingInterface = interfaces?.find((i) => i.id === id);

  const { control, handleSubmit, watch, reset } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      descr: '',
      enable: true,
      ipv4_type: 'none',
      ipv6_type: 'none',
      blockpriv: false,
      blockbogons: false,
    },
  });

  useEffect(() => {
    if (existingInterface) {
      reset({
        descr: existingInterface.descr || '',
        enable: existingInterface.enable,
        ipv4_type: existingInterface.ipv4_type,
        ipv4_address: existingInterface.ipv4_address,
        ipv4_subnet: existingInterface.ipv4_subnet,
        ipv4_gateway: existingInterface.ipv4_gateway,
        ipv6_type: existingInterface.ipv6_type,
        ipv6_address: existingInterface.ipv6_address,
        ipv6_subnet: existingInterface.ipv6_subnet,
        ipv6_gateway: existingInterface.ipv6_gateway,
        mtu: existingInterface.mtu,
        mss: existingInterface.mss,
        speed_duplex: existingInterface.speed_duplex,
        macaddr: existingInterface.macaddr,
        blockpriv: existingInterface.blockpriv,
        blockbogons: existingInterface.blockbogons,
      });
    }
  }, [existingInterface, reset]);

  const ipv4Type = watch('ipv4_type');
  const ipv6Type = watch('ipv6_type');

  const applyMutation = useApplyChanges({
    endpoint: '/interface/apply',
    invalidateKeys: [['interfaces']],
  });

  const saveMutation = useMutation({
    mutationFn: (data: FormValues) => {
      if (!id || isNew) {
        throw new Error('Creating new interfaces is not yet supported');
      }
      return updateInterface(id, data);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['interfaces'] });
      setHasPendingChanges(true);
      enqueueSnackbar('Interface configuration saved', { variant: 'success' });
    },
    onError: (error: unknown) => {
      enqueueSnackbar(getErrorMessage(error, 'Failed to save interface configuration'), { variant: 'error' });
    },
  });

  const onSubmit = (data: FormValues) => {
    void saveMutation.mutateAsync(data);
  };

  if (isLoading) {
    return (
      <Box>
        <PageHeader title={isNew ? 'Assign Interface' : 'Edit Interface'} />
        <Card>
          <CardContent>
            <Skeleton variant="text" width="40%" />
            <Skeleton variant="rounded" height={56} sx={{ mt: 2 }} />
            <Skeleton variant="rounded" height={56} sx={{ mt: 2 }} />
          </CardContent>
        </Card>
      </Box>
    );
  }

  if (error) {
    return (
      <Box>
        <PageHeader title={isNew ? 'Assign Interface' : 'Edit Interface'} />
        <Alert severity="error">Failed to load interface data.</Alert>
      </Box>
    );
  }

  if (!isNew && !existingInterface) {
    return (
      <Box>
        <PageHeader title="Edit Interface" />
        <Alert severity="error">Interface not found.</Alert>
      </Box>
    );
  }

  return (
    <Box>
      <PageHeader
        title={isNew ? 'Assign Interface' : `Edit Interface: ${existingInterface?.descr || id}`}
        actions={
          <Button variant="outlined" onClick={() => navigate('/interfaces')}>
            Cancel
          </Button>
        }
      />

      <Alert severity="warning" sx={{ mb: 3 }}>
        Applying interface changes may cause brief connectivity loss. Ensure you have
        alternative access to the appliance before applying.
      </Alert>

      <PendingChangesBanner
        hasChanges={hasPendingChanges}
        onApply={() => void applyMutation.mutateAsync()}
        isApplying={applyMutation.isPending}
        message="Interface configuration saved. Apply changes to activate."
      />

      <Card>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)}>
            <Stack spacing={3}>
              <Typography variant="h6">General</Typography>

              <Controller
                name="descr"
                control={control}
                render={({ field, fieldState }) => (
                  <TextField
                    {...field}
                    label="Description"
                    fullWidth
                    required
                    error={!!fieldState.error}
                    helperText={fieldState.error?.message}
                  />
                )}
              />

              <Controller
                name="enable"
                control={control}
                render={({ field }) => (
                  <FormControlLabel
                    control={<Switch checked={field.value} onChange={field.onChange} />}
                    label="Enable Interface"
                  />
                )}
              />

              <Divider />

              <Typography variant="h6">IPv4 Configuration</Typography>

              <Controller
                name="ipv4_type"
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth>
                    <InputLabel>IPv4 Configuration Type</InputLabel>
                    <Select {...field} label="IPv4 Configuration Type">
                      {ipv4ConfigTypes.map((t) => (
                        <MenuItem key={t.value} value={t.value}>
                          {t.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )}
              />

              {ipv4Type === 'static' && (
                <>
                  <Controller
                    name="ipv4_address"
                    control={control}
                    render={({ field, fieldState }) => (
                      <TextField
                        {...field}
                        label="IPv4 Address"
                        fullWidth
                        required
                        error={!!fieldState.error}
                        helperText={fieldState.error?.message}
                      />
                    )}
                  />
                  <Controller
                    name="ipv4_subnet"
                    control={control}
                    render={({ field, fieldState }) => (
                      <TextField
                        {...field}
                        value={field.value ?? ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          field.onChange(val === '' ? undefined : Number(val));
                        }}
                        label="Subnet Mask (CIDR)"
                        type="number"
                        fullWidth
                        required
                        slotProps={{ htmlInput: { min: 0, max: 32 } }}
                        error={!!fieldState.error}
                        helperText={fieldState.error?.message}
                      />
                    )}
                  />
                  <Controller
                    name="ipv4_gateway"
                    control={control}
                    render={({ field }) => (
                      <TextField {...field} label="Gateway" fullWidth />
                    )}
                  />
                </>
              )}

              {ipv4Type === 'pppoe' && (
                <>
                  <Controller
                    name="pppoe_username"
                    control={control}
                    render={({ field }) => (
                      <TextField {...field} label="PPPoE Username" fullWidth required />
                    )}
                  />
                  <Controller
                    name="pppoe_password"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="PPPoE Password"
                        type="password"
                        fullWidth
                        required
                      />
                    )}
                  />
                  <Controller
                    name="pppoe_service"
                    control={control}
                    render={({ field }) => (
                      <TextField {...field} label="Service Name" fullWidth />
                    )}
                  />
                </>
              )}

              <Divider />

              <Typography variant="h6">IPv6 Configuration</Typography>

              <Controller
                name="ipv6_type"
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth>
                    <InputLabel>IPv6 Configuration Type</InputLabel>
                    <Select {...field} label="IPv6 Configuration Type">
                      {ipv6ConfigTypes.map((t) => (
                        <MenuItem key={t.value} value={t.value}>
                          {t.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )}
              />

              {ipv6Type === 'static' && (
                <>
                  <Controller
                    name="ipv6_address"
                    control={control}
                    render={({ field }) => (
                      <TextField {...field} label="IPv6 Address" fullWidth required />
                    )}
                  />
                  <Controller
                    name="ipv6_subnet"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        value={field.value ?? ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          field.onChange(val === '' ? undefined : Number(val));
                        }}
                        label="Subnet Mask (CIDR)"
                        type="number"
                        fullWidth
                        required
                        slotProps={{ htmlInput: { min: 0, max: 128 } }}
                      />
                    )}
                  />
                  <Controller
                    name="ipv6_gateway"
                    control={control}
                    render={({ field }) => (
                      <TextField {...field} label="IPv6 Gateway" fullWidth />
                    )}
                  />
                </>
              )}

              <Divider />

              <Typography variant="h6">Advanced</Typography>

              <Controller
                name="mtu"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    value={field.value ?? ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      field.onChange(val === '' ? undefined : Number(val));
                    }}
                    label="MTU"
                    type="number"
                    fullWidth
                    helperText="Leave blank for default"
                  />
                )}
              />

              <Controller
                name="mss"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    value={field.value ?? ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      field.onChange(val === '' ? undefined : Number(val));
                    }}
                    label="MSS"
                    type="number"
                    fullWidth
                    helperText="Leave blank for default"
                  />
                )}
              />

              <Controller
                name="speed_duplex"
                control={control}
                render={({ field }) => (
                  <TextField {...field} label="Speed / Duplex" fullWidth helperText="e.g., 1000full, autoselect" />
                )}
              />

              <Controller
                name="macaddr"
                control={control}
                render={({ field }) => (
                  <TextField {...field} label="MAC Address Override" fullWidth placeholder="XX:XX:XX:XX:XX:XX" />
                )}
              />

              <Divider />

              <Typography variant="h6">Security</Typography>

              <Controller
                name="blockpriv"
                control={control}
                render={({ field }) => (
                  <FormControlLabel
                    control={<Switch checked={field.value} onChange={field.onChange} />}
                    label="Block Private Networks"
                  />
                )}
              />

              <Controller
                name="blockbogons"
                control={control}
                render={({ field }) => (
                  <FormControlLabel
                    control={<Switch checked={field.value} onChange={field.onChange} />}
                    label="Block Bogon Networks"
                  />
                )}
              />

              <Divider />

              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                <Button variant="outlined" onClick={() => navigate('/interfaces')}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={saveMutation.isPending}
                >
                  {saveMutation.isPending ? 'Saving...' : 'Save'}
                </Button>
              </Box>
            </Stack>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
}
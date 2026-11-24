import { useQuery } from '@tanstack/react-query';
import { FormControl, InputLabel, Select, MenuItem, FormHelperText, Box, Chip } from '@mui/material';
import { fetchInterfaces } from '@/api/modules/interfaces';
import type { InterfaceConfig } from '@/api/modules/interfaces';
import { StatusChip } from './StatusChip';

interface InterfaceSelectorProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  error?: boolean;
  helperText?: string;
  disabled?: boolean;
  multiple?: false;
}

interface InterfaceSelectorMultiProps {
  value: string[];
  onChange: (value: string[]) => void;
  label?: string;
  error?: boolean;
  helperText?: string;
  disabled?: boolean;
  multiple: true;
}

type InterfaceSelectorUnion = InterfaceSelectorProps | InterfaceSelectorMultiProps;

function mapStatus(status?: string): 'online' | 'offline' | 'warning' | 'unknown' {
  if (status === 'up') return 'online';
  if (status === 'down' || status === 'no carrier') return 'offline';
  return 'unknown';
}

export function InterfaceSelector(props: InterfaceSelectorUnion) {
  const { data: interfaces, isLoading } = useQuery({
    queryKey: ['interfaces'],
    queryFn: fetchInterfaces,
  });

  const label = props.label ?? 'Interface';
  const isMultiple = props.multiple === true;

  return (
    <FormControl fullWidth error={props.error} disabled={props.disabled || isLoading}>
      <InputLabel>{label}</InputLabel>
      <Select
        label={label}
        value={isMultiple ? (props as InterfaceSelectorMultiProps).value : (props as InterfaceSelectorProps).value}
        onChange={(e) => {
          if (isMultiple) {
            (props as InterfaceSelectorMultiProps).onChange(e.target.value as string[]);
          } else {
            (props as InterfaceSelectorProps).onChange(e.target.value as string);
          }
        }}
        multiple={isMultiple}
        renderValue={(selected) => {
          if (!interfaces) return String(selected);
          if (Array.isArray(selected)) {
            return (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {selected.map((val) => {
                  const iface = interfaces.find((i) => i.id === val);
                  return <Chip key={val} size="small" label={iface?.descr || val} />;
                })}
              </Box>
            );
          }
          const iface = interfaces.find((i) => i.id === selected);
          return iface ? `${iface.descr || iface.id} (${iface.if})` : String(selected);
        }}
      >
        {interfaces?.map((iface: InterfaceConfig) => (
          <MenuItem key={iface.id} value={iface.id}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
              <StatusChip status={mapStatus(iface.status)} />
              <span>{iface.descr || iface.id}</span>
              <span style={{ color: 'var(--mui-palette-text-secondary)', fontSize: '0.8125rem' }}>
                ({iface.if})
              </span>
            </Box>
          </MenuItem>
        ))}
      </Select>
      {props.helperText && <FormHelperText>{props.helperText}</FormHelperText>}
    </FormControl>
  );
}
import { Autocomplete, TextField, CircularProgress } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { fetchAliases, firewallQueryKeys } from '@/api/modules/firewall';
import type { Alias } from '@/api/modules/firewall';

interface AliasAutocompleteProps {
  value: string | null;
  onChange: (value: string | null) => void;
  label?: string;
  error?: boolean;
  helperText?: string;
  disabled?: boolean;
}

export function AliasAutocomplete({
  value,
  onChange,
  label = 'Alias',
  error,
  helperText,
  disabled,
}: AliasAutocompleteProps) {
  const { data, isLoading } = useQuery({
    queryKey: firewallQueryKeys.aliases,
    queryFn: fetchAliases,
    staleTime: 60_000,
  });

  const aliases = data?.data ?? [];
  const selectedAlias = aliases.find((a) => a.name === value) ?? null;

  return (
    <Autocomplete<Alias>
      options={aliases}
      getOptionLabel={(option) => option.name}
      value={selectedAlias}
      onChange={(_event, newValue) => onChange(newValue?.name ?? null)}
      loading={isLoading}
      disabled={disabled}
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          error={error}
          helperText={helperText}
          slotProps={{
            input: {
              ...params.slotProps.input,
              endAdornment: (
                <>
                  {isLoading ? <CircularProgress color="inherit" size={20} /> : null}
                  {params.slotProps.input?.endAdornment}
                </>
              ),
            },
          }}
        />
      )}
    />
  );
}
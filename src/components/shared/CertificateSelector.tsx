import { useQuery } from '@tanstack/react-query';
import {
  FormControl,
  FormHelperText,
  InputLabel,
  MenuItem,
  Select,
  type SelectChangeEvent,
} from '@mui/material';
import { fetchCertificates, vpnQueryKeys, type Certificate } from '@/api/modules/vpn';

interface CertificateSelectorProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  error?: boolean;
  helperText?: string;
  filterType?: Certificate['type'];
  disabled?: boolean;
}

export function CertificateSelector({
  value,
  onChange,
  label = 'Certificate',
  error,
  helperText,
  filterType,
  disabled,
}: CertificateSelectorProps) {
  const { data, isLoading } = useQuery({
    queryKey: vpnQueryKeys.certificates,
    queryFn: fetchCertificates,
  });

  const certificates = data?.data ?? [];
  const filtered = filterType
    ? certificates.filter((c) => c.type === filterType)
    : certificates;

  const handleChange = (event: SelectChangeEvent<string>) => {
    onChange(event.target.value);
  };

  return (
    <FormControl fullWidth error={error} disabled={disabled || isLoading}>
      <InputLabel>{label}</InputLabel>
      <Select value={value} onChange={handleChange} label={label}>
        <MenuItem value="">
          <em>-- Select Certificate --</em>
        </MenuItem>
        {filtered.map((cert) => (
          <MenuItem key={cert.refid} value={cert.refid}>
            {cert.descr || cert.refid}
          </MenuItem>
        ))}
      </Select>
      {helperText && <FormHelperText>{helperText}</FormHelperText>}
      {isLoading && <FormHelperText>Loading certificates...</FormHelperText>}
    </FormControl>
  );
}
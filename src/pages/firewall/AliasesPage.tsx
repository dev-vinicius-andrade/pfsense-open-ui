import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Alert,
  Box,
  Button,
  Chip,
  Paper,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import SearchIcon from '@mui/icons-material/Search';
import { PageHeader } from '@/components/shared/PageHeader';
import { EmptyState } from '@/components/shared/EmptyState';
import {
  fetchAliases,
  firewallQueryKeys,
  type Alias,
} from '@/api/modules/firewall';

const aliasTypeColorMap: Record<string, 'default' | 'primary' | 'secondary' | 'info' | 'success' | 'warning'> = {
  host: 'primary',
  network: 'secondary',
  port: 'info',
  url: 'success',
  url_ports: 'warning',
  urltable: 'default',
  urltable_ports: 'default',
};

export function AliasesPage() {
  const [searchTerm, setSearchTerm] = useState('');

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: firewallQueryKeys.aliases,
    queryFn: fetchAliases,
  });

  const aliases = data?.data ?? [];

  const filteredAliases = useMemo(() => {
    if (!searchTerm.trim()) return aliases;
    const lower = searchTerm.toLowerCase();
    return aliases.filter(
      (alias) =>
        alias.name.toLowerCase().includes(lower) ||
        alias.type.toLowerCase().includes(lower) ||
        alias.description.toLowerCase().includes(lower) ||
        alias.content.some((c) => c.toLowerCase().includes(lower)),
    );
  }, [aliases, searchTerm]);

  return (
    <Box>
      <PageHeader
        title="Firewall Aliases"
        actions={
          <Button startIcon={<RefreshIcon />} onClick={() => refetch()} disabled={isLoading}>
            Refresh
          </Button>
        }
      />

      <Alert severity="info" sx={{ mb: 2 }}>
        Alias editing requires pfSense REST API v2 alias write endpoints. Currently read-only.
      </Alert>

      {!isLoading && !isError && (
        <TextField
          fullWidth
          size="small"
          placeholder="Search aliases by name, type, content, or description..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          slotProps={{
            input: {
              startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
            },
          }}
          sx={{ mb: 2 }}
          aria-label="Search aliases"
        />
      )}

      {isLoading && (
        <Paper sx={{ p: 2 }}>
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} height={48} sx={{ mb: 1 }} />
          ))}
        </Paper>
      )}

      {isError && (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography color="error" sx={{ mb: 2 }}>
            Failed to load aliases:{' '}
            {error instanceof Error ? error.message : 'Unknown error'}
          </Typography>
          <Button variant="outlined" onClick={() => refetch()}>
            Retry
          </Button>
        </Paper>
      )}

      {!isLoading && !isError && filteredAliases.length === 0 && (
        <Paper>
          <EmptyState
            message={
              searchTerm
                ? 'No aliases match your search.'
                : 'No firewall aliases configured.'
            }
          />
        </Paper>
      )}

      {!isLoading && !isError && filteredAliases.length > 0 && (
        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Content</TableCell>
                <TableCell>Description</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredAliases.map((alias) => (
                <AliasRow key={alias.name} alias={alias} />
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
}

function AliasRow({ alias }: { alias: Alias }) {
  return (
    <TableRow>
      <TableCell>
        <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
          {alias.name}
        </Typography>
      </TableCell>
      <TableCell>
        <Chip
          label={alias.type}
          size="small"
          color={aliasTypeColorMap[alias.type] ?? 'default'}
          variant="outlined"
        />
      </TableCell>
      <TableCell>
        <Typography
          variant="body2"
          noWrap
          sx={{ maxWidth: 300 }}
          title={alias.content.join(', ')}
        >
          {alias.content.length > 0 ? alias.content.join(', ') : '-'}
        </Typography>
      </TableCell>
      <TableCell>
        <Typography
          variant="body2"
          noWrap
          sx={{ maxWidth: 200 }}
          title={alias.description}
        >
          {alias.description || '-'}
        </Typography>
      </TableCell>
    </TableRow>
  );
}
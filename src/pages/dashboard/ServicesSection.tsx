import { useQuery } from '@tanstack/react-query';
import {
  Alert,
  Button,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Skeleton,
  Typography,
} from '@mui/material';
import { StatusChip } from '@/components/shared/StatusChip';
import { fetchServices } from '@/api/modules/status';
import type { Service } from '@/api/modules/status';

const REFRESH_INTERVAL_MS = 30_000;

function CheckCircleIcon({ fontSize }: { color?: 'success'; fontSize: 'small' }) {
  const size = fontSize === 'small' ? 20 : 24;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" opacity="0.3" />
      <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ErrorIcon({ fontSize }: { color?: 'error' | 'disabled'; fontSize: 'small' }) {
  const size = fontSize === 'small' ? 20 : 24;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" opacity="0.3" />
      <path d="M15 9l-6 6M9 9l6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function mapServiceStatus(status: Service['status']): 'online' | 'offline' | 'unknown' {
  if (status === 'running') return 'online';
  if (status === 'stopped') return 'offline';
  return 'unknown';
}

export function ServicesSection() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['services'],
    queryFn: fetchServices,
    refetchInterval: REFRESH_INTERVAL_MS,
  });

  if (isError) {
    return (
      <Alert severity="error" action={<Button size="small" onClick={() => void refetch()}>Retry</Button>}>
        Failed to load services.
      </Alert>
    );
  }

  return (
    <Card>
      <CardContent>
        {isLoading ? (
          <Skeleton variant="rectangular" height={120} />
        ) : !data || data.length === 0 ? (
          <Typography color="text.secondary">No services found.</Typography>
        ) : (
          <List dense disablePadding>
            {data.map((svc: Service) => (
              <ListItem key={svc.id} divider>
                <ListItemIcon sx={{ minWidth: 36 }}>
                  {svc.status === 'running' ? (
                    <CheckCircleIcon color="success" fontSize="small" />
                  ) : (
                    <ErrorIcon color={svc.status === 'stopped' ? 'error' : 'disabled'} fontSize="small" />
                  )}
                </ListItemIcon>
                <ListItemText
                  primary={svc.name}
                  secondary={svc.description}
                />
                <StatusChip status={mapServiceStatus(svc.status)} />
              </ListItem>
            ))}
          </List>
        )}
      </CardContent>
    </Card>
  );
}
import { Alert, AlertTitle } from '@mui/material';
import { IS_DEMO } from '@/mocks/mockClient';

/**
 * Displays a persistent warning banner when running in demo mode.
 * Only renders when VITE_DEMO_MODE=true (GitHub Pages deployment).
 */
export function DemoBanner() {
  if (!IS_DEMO) return null;

  return (
    <Alert
      severity="warning"
      sx={{
        borderRadius: 0,
        mb: 2,
        '& .MuiAlert-message': { width: '100%' },
      }}
    >
      <AlertTitle>Demo Mode</AlertTitle>
      This is a live demo with mock data. No real pfSense appliance is connected.
      All changes are simulated and will be lost on refresh.
    </Alert>
  );
}
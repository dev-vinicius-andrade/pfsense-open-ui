import { Box } from '@mui/material';
import { PageHeader } from '@/components/shared/PageHeader';
import { LayoutBuilder } from '@/layout/LayoutBuilder';
import { MonitoringContextProvider } from './MonitoringContext';

// Side-effect import: registers monitoring panels on module load
import './panels';

export function MonitoringPage() {
  return (
    <Box>
      <PageHeader title="Real-Time Monitoring" />

      <MonitoringContextProvider>
        <LayoutBuilder pageId="monitoring" />
      </MonitoringContextProvider>
    </Box>
  );
}
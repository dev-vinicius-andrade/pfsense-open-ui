import { Box } from '@mui/material';
import { PageHeader } from '@/components/shared/PageHeader';
import { LayoutBuilder } from '@/layout/LayoutBuilder';
import { SystemContextProvider } from './SystemContext';

// Side-effect import: registers system panels on module load
import './panels';

export function SystemPage() {
  return (
    <Box>
      <PageHeader title="System Administration" />

      <SystemContextProvider>
        <LayoutBuilder pageId="settings" />
      </SystemContextProvider>
    </Box>
  );
}
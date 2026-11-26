import { Box } from '@mui/material';
import { PageHeader } from '@/components/shared/PageHeader';
import { LayoutBuilder } from '@/layout/LayoutBuilder';
import { ServicesContextProvider } from './ServicesContext';

// Side-effect import: registers services panels on module load
import './panels';

export function ServicesPage() {
  return (
    <Box>
      <PageHeader title="Services" />

      <ServicesContextProvider>
        <LayoutBuilder pageId="services" />
      </ServicesContextProvider>
    </Box>
  );
}
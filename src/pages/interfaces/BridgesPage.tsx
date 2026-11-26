import { Box } from '@mui/material';
import { PageHeader } from '@/components/shared/PageHeader';
import { LayoutBuilder } from '@/layout/LayoutBuilder';
import './panels';

export function BridgesPage() {
  return (
    <Box>
      <PageHeader title="Bridges" />
      <LayoutBuilder pageId="interfaces-bridges" />
    </Box>
  );
}
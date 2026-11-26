import { Box } from '@mui/material';
import { PageHeader } from '@/components/shared/PageHeader';
import { LayoutBuilder } from '@/layout/LayoutBuilder';
import './panels';

export function VlansPage() {
  return (
    <Box>
      <PageHeader title="VLANs" />
      <LayoutBuilder pageId="interfaces-vlans" />
    </Box>
  );
}
import { Box } from '@mui/material';
import { PageHeader } from '@/components/shared/PageHeader';
import { LayoutBuilder } from '@/layout/LayoutBuilder';

// Side-effect import: registers arp-table panels on module load
import './panels';

export function ArpTablePage() {
  return (
    <Box>
      <PageHeader title="ARP Table" />

      <LayoutBuilder pageId="arp-table" />
    </Box>
  );
}
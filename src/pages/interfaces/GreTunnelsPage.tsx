import { Box } from '@mui/material';
import { PageHeader } from '@/components/shared/PageHeader';
import { LayoutBuilder } from '@/layout/LayoutBuilder';
import './panels';

export function GreTunnelsPage() {
 return (
 <Box>
 <PageHeader title="GRE Tunnels" />
 <LayoutBuilder pageId="interfaces-gre" />
 </Box>
 );
}
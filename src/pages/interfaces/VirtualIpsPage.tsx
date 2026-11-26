import { Box } from '@mui/material';
import { PageHeader } from '@/components/shared/PageHeader';
import { LayoutBuilder } from '@/layout/LayoutBuilder';
import './panels';

export function VirtualIpsPage() {
 return (
 <Box>
 <PageHeader title="Virtual IPs" />
 <LayoutBuilder pageId="interfaces-vips" />
 </Box>
 );
}
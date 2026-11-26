import { Box } from '@mui/material';
import { PageHeader } from '@/components/shared/PageHeader';
import { LayoutBuilder } from '@/layout/LayoutBuilder';
import './panels';

export function InterfaceGroupsPage() {
 return (
 <Box>
 <PageHeader title="Interface Groups" />
 <LayoutBuilder pageId="interfaces-groups" />
 </Box>
 );
}
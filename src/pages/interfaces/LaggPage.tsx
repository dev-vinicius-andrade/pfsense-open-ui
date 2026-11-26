import { Box } from '@mui/material';
import { PageHeader } from '@/components/shared/PageHeader';
import { LayoutBuilder } from '@/layout/LayoutBuilder';
import './panels';

export function LaggPage() {
 return (
 <Box>
 <PageHeader title="LAGG" />
 <LayoutBuilder pageId="interfaces-lagg" />
 </Box>
 );
}
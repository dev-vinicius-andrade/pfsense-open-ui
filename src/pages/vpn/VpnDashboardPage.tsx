import { Box } from '@mui/material';
import { PageHeader } from '@/components/shared/PageHeader';
import { LayoutBuilder } from '@/layout/LayoutBuilder';
import { VpnContextProvider } from './VpnContext';
import './panels';

export function VpnDashboardPage() {
  return (
    <VpnContextProvider>
      <Box>
        <PageHeader title="VPN" />
        <LayoutBuilder pageId="vpn" />
      </Box>
    </VpnContextProvider>
  );
}
import { useState } from 'react';
import { Box, Tab, Tabs } from '@mui/material';
import { PageHeader } from '@/components/shared/PageHeader';
import { PortForwardsTab } from './PortForwardsTab';
import { OutboundNatTab } from './OutboundNatTab';
import { OneToOneNatTab } from './OneToOneNatTab';

interface TabPanelProps {
  children: React.ReactNode;
  value: number;
  index: number;
}

function TabPanel({ children, value, index }: TabPanelProps) {
  if (value !== index) return null;
  return <Box sx={{ py: 2 }}>{children}</Box>;
}

export function NatPage() {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <Box>
      <PageHeader title="NAT" />

      <Tabs
        value={activeTab}
        onChange={(_, newValue: number) => setActiveTab(newValue)}
        sx={{ borderBottom: 1, borderColor: 'divider', mb: 1 }}
      >
        <Tab label="Port Forwarding" />
        <Tab label="Outbound NAT" />
        <Tab label="1:1 NAT" />
      </Tabs>

      <TabPanel value={activeTab} index={0}>
        <PortForwardsTab />
      </TabPanel>
      <TabPanel value={activeTab} index={1}>
        <OutboundNatTab />
      </TabPanel>
      <TabPanel value={activeTab} index={2}>
        <OneToOneNatTab />
      </TabPanel>
    </Box>
  );
}
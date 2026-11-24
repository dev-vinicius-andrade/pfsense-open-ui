import { useState } from 'react';
import { Box, Tab, Tabs } from '@mui/material';
import { PageHeader } from '@/components/shared/PageHeader';
import { DhcpServerTab } from './DhcpServerTab';
import { DnsResolverTab } from './DnsResolverTab';
import { NtpTab } from './NtpTab';
import { SshTab } from './SshTab';
import { CronJobsTab } from './CronJobsTab';

const TAB_LABELS = ['DHCP Server', 'DNS Resolver', 'NTP', 'SSH', 'Cron Jobs'] as const;

export function ServicesPage() {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <Box>
      <PageHeader title="Services" />

      <Tabs
        value={activeTab}
        onChange={(_e, newValue: number) => setActiveTab(newValue)}
        variant="scrollable"
        scrollButtons="auto"
        sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}
      >
        {TAB_LABELS.map((label) => (
          <Tab key={label} label={label} />
        ))}
      </Tabs>

      {activeTab === 0 && <DhcpServerTab />}
      {activeTab === 1 && <DnsResolverTab />}
      {activeTab === 2 && <NtpTab />}
      {activeTab === 3 && <SshTab />}
      {activeTab === 4 && <CronJobsTab />}
    </Box>
  );
}
import { useState } from 'react';
import { Box } from '@mui/material';
import { PageHeader } from '@/components/shared/PageHeader';
import { ConfigurableTabs } from '@/components/shared/ConfigurableTabs';
import { DhcpServerTab } from './DhcpServerTab';
import { DnsResolverTab } from './DnsResolverTab';
import { DnsForwarderTab } from './DnsForwarderTab';
import { NtpTab } from './NtpTab';
import { SshTab } from './SshTab';
import { CronJobsTab } from './CronJobsTab';

const SERVICE_TABS = [
  { id: 'dhcp', label: 'DHCP Server' },
  { id: 'dns-resolver', label: 'DNS Resolver' },
  { id: 'dns-forwarder', label: 'DNS Forwarder' },
  { id: 'ntp', label: 'NTP' },
  { id: 'ssh', label: 'SSH' },
  { id: 'cron', label: 'Cron Jobs' },
] as const;

type ServiceTabId = (typeof SERVICE_TABS)[number]['id'];

const TAB_CONTENT: Record<ServiceTabId, React.ReactNode> = {
  dhcp: <DhcpServerTab />,
  'dns-resolver': <DnsResolverTab />,
  'dns-forwarder': <DnsForwarderTab />,
  ntp: <NtpTab />,
  ssh: <SshTab />,
  cron: <CronJobsTab />,
};

export function ServicesPage() {
  const [activeTab, setActiveTab] = useState<ServiceTabId>('dhcp');

  return (
    <Box>
      <PageHeader title="Services" />

      <ConfigurableTabs
        tabs={SERVICE_TABS}
        activeTab={activeTab}
        onTabChange={(tabId) => setActiveTab(tabId as ServiceTabId)}
        ariaLabel="Service configuration tabs"
      >
        {TAB_CONTENT[activeTab]}
      </ConfigurableTabs>
    </Box>
  );
}
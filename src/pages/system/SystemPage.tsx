import { useState } from 'react';
import { Box, Tab, Tabs } from '@mui/material';
import { PageHeader } from '@/components/shared/PageHeader';
import { GeneralSetupTab } from './GeneralSetupTab';
import { UsersTab } from './UsersTab';
import { CertificatesTab } from './CertificatesTab';
import { FirmwareTab } from './FirmwareTab';
import { PackagesTab } from './PackagesTab';
import { TunablesTab } from './TunablesTab';
import { DiagnosticsTab } from './DiagnosticsTab';

const TABS = [
  { label: 'General Setup', value: 'general' },
  { label: 'Users & Groups', value: 'users' },
  { label: 'Certificates', value: 'certificates' },
  { label: 'Firmware', value: 'firmware' },
  { label: 'Packages', value: 'packages' },
  { label: 'Tunables', value: 'tunables' },
  { label: 'Diagnostics', value: 'diagnostics' },
] as const;

type TabValue = (typeof TABS)[number]['value'];

export function SystemPage() {
  const [activeTab, setActiveTab] = useState<TabValue>('general');

  return (
    <Box>
      <PageHeader title="System Administration" />

      <Tabs
        value={activeTab}
        onChange={(_e, value: TabValue) => setActiveTab(value)}
        variant="scrollable"
        scrollButtons="auto"
        sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}
      >
        {TABS.map((tab) => (
          <Tab key={tab.value} label={tab.label} value={tab.value} />
        ))}
      </Tabs>

      {activeTab === 'general' && <GeneralSetupTab />}
      {activeTab === 'users' && <UsersTab />}
      {activeTab === 'certificates' && <CertificatesTab />}
      {activeTab === 'firmware' && <FirmwareTab />}
      {activeTab === 'packages' && <PackagesTab />}
      {activeTab === 'tunables' && <TunablesTab />}
      {activeTab === 'diagnostics' && <DiagnosticsTab />}
    </Box>
  );
}
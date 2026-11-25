import { useState } from 'react';
import { Box } from '@mui/material';
import { PageHeader } from '@/components/shared/PageHeader';
import { ConfigurableTabs } from '@/components/shared/ConfigurableTabs';
import { GeneralSetupTab } from './GeneralSetupTab';
import { UsersTab } from './UsersTab';
import { CertificatesTab } from './CertificatesTab';
import { FirmwareTab } from './FirmwareTab';
import { PackagesTab } from './PackagesTab';
import { TunablesTab } from './TunablesTab';
import { DiagnosticsTab } from './DiagnosticsTab';

const TABS = [
  { id: 'general', label: 'General Setup' },
  { id: 'users', label: 'Users & Groups' },
  { id: 'certificates', label: 'Certificates' },
  { id: 'firmware', label: 'Firmware' },
  { id: 'packages', label: 'Packages' },
  { id: 'tunables', label: 'Tunables' },
  { id: 'diagnostics', label: 'Diagnostics' },
] as const;

type TabValue = (typeof TABS)[number]['id'];

const TAB_CONTENT: Record<TabValue, React.ReactNode> = {
  general: <GeneralSetupTab />,
  users: <UsersTab />,
  certificates: <CertificatesTab />,
  firmware: <FirmwareTab />,
  packages: <PackagesTab />,
  tunables: <TunablesTab />,
  diagnostics: <DiagnosticsTab />,
};

export function SystemPage() {
  const [activeTab, setActiveTab] = useState<TabValue>('general');

  return (
    <Box>
      <PageHeader title="System Administration" />

      <ConfigurableTabs
        tabs={TABS}
        activeTab={activeTab}
        onTabChange={(tabId) => setActiveTab(tabId as TabValue)}
        ariaLabel="System administration tabs"
      >
        {TAB_CONTENT[activeTab]}
      </ConfigurableTabs>
    </Box>
  );
}
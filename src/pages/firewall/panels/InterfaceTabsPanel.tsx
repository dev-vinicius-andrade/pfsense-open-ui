import { useMemo, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Paper, Skeleton } from '@mui/material';
import { ConfigurableTabs } from '@/components/shared/ConfigurableTabs';
import { fetchInterfaces } from '@/api/modules/interfaces';

const FLOATING_TAB_KEY = '__floating__';
const IFACE_PARAM = 'iface';

interface InterfaceTabsPanelProps {
  panelId: string;
}

export function InterfaceTabsPanel({ panelId }: InterfaceTabsPanelProps) {
  const [searchParams, setSearchParams] = useSearchParams();

  const { data: interfacesData, isLoading } = useQuery({
    queryKey: ['interfaces'],
    queryFn: fetchInterfaces,
  });

  const interfaces = interfacesData ?? [];

  const tabs = useMemo(() => {
    const result: Array<{ id: string; label: string }> = [];
    for (const iface of interfaces) {
      result.push({ id: iface.id, label: iface.descr || iface.id });
    }
    result.push({ id: FLOATING_TAB_KEY, label: 'Floating Rules' });
    return result;
  }, [interfaces]);

  const activeTabKey = useMemo(() => {
    const paramValue = searchParams.get(IFACE_PARAM);
    if (paramValue && tabs.some((t) => t.id === paramValue)) {
      return paramValue;
    }
    return tabs.length > 0 ? tabs[0].id : FLOATING_TAB_KEY;
  }, [searchParams, tabs]);

  const handleTabChange = useCallback(
    (tabId: string) => {
      setSearchParams({ [IFACE_PARAM]: tabId }, { replace: true });
    },
    [setSearchParams],
  );

  if (isLoading) {
    return (
      <Paper sx={{ p: 1, display: 'flex', gap: 1 }} data-panel-id={panelId}>
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} width={80} height={36} />
        ))}
      </Paper>
    );
  }

  return (
    <Paper sx={{ overflow: 'hidden' }} data-panel-id={panelId}>
      <ConfigurableTabs
        tabs={tabs}
        activeTab={activeTabKey}
        onTabChange={handleTabChange}
        ariaLabel="Firewall rules by interface"
      >
        {/* Content area intentionally empty — tabs are navigation only in this panel */}
        <></>
      </ConfigurableTabs>
    </Paper>
  );
}
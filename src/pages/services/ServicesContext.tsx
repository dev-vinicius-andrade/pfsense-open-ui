import { createContext, useContext, useMemo, useCallback, type ReactNode } from 'react';
import { useSearchParams } from 'react-router-dom';

const TAB_PARAM = 'tab';

export const SERVICE_TAB_IDS = [
  'dhcp',
  'dns-resolver',
  'dns-forwarder',
  'ntp',
  'ssh',
  'cron',
] as const;

export type ServiceTabId = (typeof SERVICE_TAB_IDS)[number];

interface ServicesContextValue {
  activeTab: ServiceTabId;
  setActiveTab: (tabId: ServiceTabId) => void;
}

const ServicesContext = createContext<ServicesContextValue | null>(null);

function isValidTabId(value: string | null): value is ServiceTabId {
  if (!value) return false;
  return (SERVICE_TAB_IDS as readonly string[]).includes(value);
}

interface ServicesContextProviderProps {
  children: ReactNode;
}

export function ServicesContextProvider({ children }: ServicesContextProviderProps) {
  const [searchParams, setSearchParams] = useSearchParams();

  const activeTab: ServiceTabId = useMemo(() => {
    const paramValue = searchParams.get(TAB_PARAM);
    if (isValidTabId(paramValue)) return paramValue;
    return 'dhcp';
  }, [searchParams]);

  const setActiveTab = useCallback(
    (tabId: ServiceTabId) => {
      setSearchParams({ [TAB_PARAM]: tabId }, { replace: true });
    },
    [setSearchParams],
  );

  const value = useMemo<ServicesContextValue>(
    () => ({ activeTab, setActiveTab }),
    [activeTab, setActiveTab],
  );

  return <ServicesContext.Provider value={value}>{children}</ServicesContext.Provider>;
}

export function useServicesContext(): ServicesContextValue {
  const context = useContext(ServicesContext);
  if (!context) {
    throw new Error('useServicesContext must be used within a ServicesContextProvider');
  }
  return context;
}
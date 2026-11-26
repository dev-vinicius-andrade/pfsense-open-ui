import { createContext, useContext, useMemo, useCallback, type ReactNode } from 'react';
import { useSearchParams } from 'react-router-dom';

const TAB_PARAM = 'tab';

export const MONITORING_TAB_IDS = [
  'traffic',
  'logs',
  'states',
  'gateways',
] as const;

export type MonitoringTabId = (typeof MONITORING_TAB_IDS)[number];

interface MonitoringContextValue {
  activeTab: MonitoringTabId;
  setActiveTab: (tabId: MonitoringTabId) => void;
}

const MonitoringContext = createContext<MonitoringContextValue | null>(null);

function isValidTabId(value: string | null): value is MonitoringTabId {
  if (!value) return false;
  return (MONITORING_TAB_IDS as readonly string[]).includes(value);
}

interface MonitoringContextProviderProps {
  children: ReactNode;
}

export function MonitoringContextProvider({ children }: MonitoringContextProviderProps) {
  const [searchParams, setSearchParams] = useSearchParams();

  const activeTab: MonitoringTabId = useMemo(() => {
    const paramValue = searchParams.get(TAB_PARAM);
    if (isValidTabId(paramValue)) return paramValue;
    return 'traffic';
  }, [searchParams]);

  const setActiveTab = useCallback(
    (tabId: MonitoringTabId) => {
      setSearchParams({ [TAB_PARAM]: tabId }, { replace: true });
    },
    [setSearchParams],
  );

  const value = useMemo<MonitoringContextValue>(
    () => ({ activeTab, setActiveTab }),
    [activeTab, setActiveTab],
  );

  return <MonitoringContext.Provider value={value}>{children}</MonitoringContext.Provider>;
}

export function useMonitoringContext(): MonitoringContextValue {
  const context = useContext(MonitoringContext);
  if (!context) {
    throw new Error('useMonitoringContext must be used within a MonitoringContextProvider');
  }
  return context;
}
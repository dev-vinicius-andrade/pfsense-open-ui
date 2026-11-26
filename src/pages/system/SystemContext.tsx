import { createContext, useContext, useMemo, useCallback, type ReactNode } from 'react';
import { useSearchParams } from 'react-router-dom';

const TAB_PARAM = 'tab';

export const SYSTEM_TAB_IDS = [
  'general',
  'users',
  'certificates',
  'firmware',
  'packages',
  'tunables',
  'diagnostics',
] as const;

export type SystemTabId = (typeof SYSTEM_TAB_IDS)[number];

interface SystemContextValue {
  activeTab: SystemTabId;
  setActiveTab: (tabId: SystemTabId) => void;
}

const SystemContext = createContext<SystemContextValue | null>(null);

function isValidTabId(value: string | null): value is SystemTabId {
  if (!value) return false;
  return (SYSTEM_TAB_IDS as readonly string[]).includes(value);
}

interface SystemContextProviderProps {
  children: ReactNode;
}

export function SystemContextProvider({ children }: SystemContextProviderProps) {
  const [searchParams, setSearchParams] = useSearchParams();

  const activeTab: SystemTabId = useMemo(() => {
    const paramValue = searchParams.get(TAB_PARAM);
    if (isValidTabId(paramValue)) return paramValue;
    return 'general';
  }, [searchParams]);

  const setActiveTab = useCallback(
    (tabId: SystemTabId) => {
      setSearchParams({ [TAB_PARAM]: tabId }, { replace: true });
    },
    [setSearchParams],
  );

  const value = useMemo<SystemContextValue>(
    () => ({ activeTab, setActiveTab }),
    [activeTab, setActiveTab],
  );

  return <SystemContext.Provider value={value}>{children}</SystemContext.Provider>;
}

export function useSystemContext(): SystemContextValue {
  const context = useContext(SystemContext);
  if (!context) {
    throw new Error('useSystemContext must be used within a SystemContextProvider');
  }
  return context;
}
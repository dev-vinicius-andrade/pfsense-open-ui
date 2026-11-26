import { createContext, useContext, useMemo, useCallback, type ReactNode } from 'react';
import { useSearchParams } from 'react-router-dom';

const TAB_PARAM = 'tab';

export const VPN_TAB_IDS = [
  'openvpn',
  'wireguard',
  'ipsec',
] as const;

export type VpnTabId = (typeof VPN_TAB_IDS)[number];

interface VpnContextValue {
  activeTab: VpnTabId;
  setActiveTab: (tabId: VpnTabId) => void;
}

const VpnContext = createContext<VpnContextValue | null>(null);

function isValidTabId(value: string | null): value is VpnTabId {
  if (!value) return false;
  return (VPN_TAB_IDS as readonly string[]).includes(value);
}

interface VpnContextProviderProps {
  children: ReactNode;
}

export function VpnContextProvider({ children }: VpnContextProviderProps) {
  const [searchParams, setSearchParams] = useSearchParams();

  const activeTab: VpnTabId = useMemo(() => {
    const paramValue = searchParams.get(TAB_PARAM);
    if (isValidTabId(paramValue)) return paramValue;
    return 'openvpn';
  }, [searchParams]);

  const setActiveTab = useCallback(
    (tabId: VpnTabId) => {
      setSearchParams({ [TAB_PARAM]: tabId }, { replace: true });
    },
    [setSearchParams],
  );

  const value = useMemo<VpnContextValue>(
    () => ({ activeTab, setActiveTab }),
    [activeTab, setActiveTab],
  );

  return <VpnContext.Provider value={value}>{children}</VpnContext.Provider>;
}

export function useVpnContext(): VpnContextValue {
  const context = useContext(VpnContext);
  if (!context) {
    throw new Error('useVpnContext must be used within a VpnContextProvider');
  }
  return context;
}
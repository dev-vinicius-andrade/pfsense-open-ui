import { useMemo, useCallback, useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Paper, Skeleton } from '@mui/material';
import { ConfigurableTabs } from '@/components/shared/ConfigurableTabs';
import { fetchInterfaces } from '@/api/modules/interfaces';

const FLOATING_TAB_KEY = '__floating__';
const IFACE_PARAM = 'iface';
const STORAGE_KEY = 'pfsense-layout-firewall';

type TabOrientation = 'top' | 'bottom' | 'left' | 'right';

interface InterfaceTabsPanelProps {
 panelId: string;
}

/**
 * Reads tabOrientation directly from localStorage for the firewall page layout.
 * This bypasses the prop-passing chain through PanelWrapper → CanvasEditWrapper
 * which has been unreliable due to CDN caching of intermediate builds.
 */
function usePersistedTabOrientation(panelId: string): TabOrientation {
 const [orientation, setOrientation] = useState<TabOrientation>('top');

 useEffect(() => {
 try {
 const raw = localStorage.getItem(STORAGE_KEY);
 if (!raw) return;
 const layout = JSON.parse(raw);
 const panel = layout?.panels?.find((p: Record<string, unknown>) => p.id === panelId);
 if (panel?.tabOrientation) {
 setOrientation(panel.tabOrientation as TabOrientation);
 }
 } catch {
 // Ignore parse errors
 }
 }, [panelId]);

 // Also listen for storage events from other tabs or same-tab updates
 useEffect(() => {
 const handler = () => {
 try {
 const raw = localStorage.getItem(STORAGE_KEY);
 if (!raw) return;
 const layout = JSON.parse(raw);
 const panel = layout?.panels?.find((p: Record<string, unknown>) => p.id === panelId);
 if (panel?.tabOrientation) {
 setOrientation(panel.tabOrientation as TabOrientation);
 }
 } catch {
 // Ignore
 }
 };

 // Poll every 500ms to catch same-tab localStorage writes
 const interval = setInterval(handler, 500);
 window.addEventListener('storage', handler);
 return () => {
 clearInterval(interval);
 window.removeEventListener('storage', handler);
 };
 }, [panelId]);

 return orientation;
}

export function InterfaceTabsPanel({ panelId }: InterfaceTabsPanelProps) {
 const [searchParams, setSearchParams] = useSearchParams();
 const orientation = usePersistedTabOrientation(panelId);

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
 orientation={orientation}
 ariaLabel="Firewall rules by interface"
 >
 {/* Content area intentionally empty — tabs are navigation only in this panel */}
 <></>
 </ConfigurableTabs>
 </Paper>
 );
}
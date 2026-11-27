import { lazy } from 'react';
import { registerPanels } from '@/layout/panelRegistry';
import type { PanelDefinition } from '@/layout/types';

const InterfaceTabsPanel = lazy(() =>
 import('./panels/InterfaceTabsPanel').then((m) => ({ default: m.InterfaceTabsPanel })),
);
const RuleTablePanel = lazy(() =>
 import('./panels/RuleTablePanel').then((m) => ({ default: m.RuleTablePanel })),
);
const RuleActionsPanel = lazy(() =>
 import('./panels/RuleActionsPanel').then((m) => ({ default: m.RuleActionsPanel })),
);

export const FIREWALL_PANELS: PanelDefinition[] = [
 {
 id: 'interface-tabs',
 title: 'Interface Tabs',
 description: 'Select interface to view rules',
 component: InterfaceTabsPanel,
 defaultLayout: { x: 0, y: 0, width: '100%', height: 64 },
 category: 'navigation',
 minWidth: 4,
 minHeight: 1,
 locked: true,
 },
 {
 id: 'rule-actions',
 title: 'Rule Actions',
 description: 'Add, refresh, and filter rules',
 component: RuleActionsPanel,
 defaultLayout: { x: 0, y: 64, width: '100%', height: 64 },
 category: 'actions',
 minWidth: 4,
 minHeight: 1,
 },
 {
 id: 'rule-table',
 title: 'Firewall Rules',
 description: 'Rule table with drag-to-reorder',
 component: RuleTablePanel,
 defaultLayout: { x: 0, y: 128, width: '100%', height: 512 },
 category: 'primary',
 minWidth: 6,
 minHeight: 4,
 },
];

// Auto-register on module load
registerPanels('firewall', FIREWALL_PANELS);
import type { ComponentType } from 'react';
import { SystemStatsSection } from './SystemStatsSection';
import { GatewaysSection } from './GatewaysSection';
import { InterfacesSection } from './InterfacesSection';
import { ServicesSection } from './ServicesSection';
import { VersionAndStatesSection } from './VersionAndStatesSection';

export type WidgetCategory = 'system' | 'network' | 'services' | 'security';

export interface WidgetDefinition {
  id: string;
  title: string;
  description: string;
  component: ComponentType;
  defaultOrder: number;
  defaultVisible: boolean;
  category: WidgetCategory;
}

export const WIDGET_REGISTRY: WidgetDefinition[] = [
  {
    id: 'system-stats',
    title: 'System Stats',
    description: 'CPU, memory, disk usage',
    component: SystemStatsSection,
    defaultOrder: 1,
    defaultVisible: true,
    category: 'system',
  },
  {
    id: 'gateways',
    title: 'Gateways',
    description: 'Gateway monitoring status',
    component: GatewaysSection,
    defaultOrder: 2,
    defaultVisible: true,
    category: 'network',
  },
  {
    id: 'interfaces',
    title: 'Interfaces',
    description: 'Interface status and traffic',
    component: InterfacesSection,
    defaultOrder: 3,
    defaultVisible: true,
    category: 'network',
  },
  {
    id: 'services',
    title: 'Services',
    description: 'Running services status',
    component: ServicesSection,
    defaultOrder: 4,
    defaultVisible: true,
    category: 'services',
  },
  {
    id: 'version-states',
    title: 'Version & States',
    description: 'System version and state table',
    component: VersionAndStatesSection,
    defaultOrder: 5,
    defaultVisible: true,
    category: 'system',
  },
];

export function getWidgetById(id: string): WidgetDefinition | undefined {
  return WIDGET_REGISTRY.find((w) => w.id === id);
}

export const CATEGORY_LABELS: Record<WidgetCategory, string> = {
  system: 'System',
  network: 'Network',
  services: 'Services',
  security: 'Security',
};
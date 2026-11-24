import { useMemo } from 'react';
import { useConfigStore } from '@/stores/configStore';
import { WIDGET_REGISTRY, type WidgetCategory } from './widgetRegistry';
import { CustomWidgetContent } from './CustomWidgetContent';
import type { ComponentType } from 'react';
import type { CustomWidget } from '@/config/schema';

export interface ResolvedWidget {
  id: string;
  title: string;
  description: string;
  component: ComponentType;
  visible: boolean;
  order: number;
  category: WidgetCategory | 'custom';
}

const SESSION_STORAGE_KEY = 'pfsense-dashboard-layout';

interface StoredLayoutEntry {
  id: string;
  order: number;
  visible: boolean;
}

function loadStoredLayout(): Map<string, StoredLayoutEntry> | null {
  try {
    const raw = sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) return null;
    const entries: StoredLayoutEntry[] = JSON.parse(raw);
    if (!Array.isArray(entries)) return null;
    const map = new Map<string, StoredLayoutEntry>();
    for (const entry of entries) {
      if (typeof entry.id === 'string' && typeof entry.order === 'number' && typeof entry.visible === 'boolean') {
        map.set(entry.id, entry);
      }
    }
    return map.size > 0 ? map : null;
  } catch {
    return null;
  }
}

export function saveDashboardLayout(widgets: ResolvedWidget[]): void {
  const entries: StoredLayoutEntry[] = widgets.map((w) => ({
    id: w.id,
    order: w.order,
    visible: w.visible,
  }));
  try {
    sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(entries));
  } catch {
    // sessionStorage may be unavailable
  }
}

function resolveCustomWidgets(customWidgets: CustomWidget[], baseOrder: number): ResolvedWidget[] {
  return customWidgets.map((widget, index) => ({
    id: widget.id.startsWith('custom-') ? widget.id : `custom-${widget.id}`,
    title: widget.title,
    description: widget.description ?? '',
    component: () => <CustomWidgetContent widget={widget} />,
    visible: true,
    order: baseOrder + index,
    category: 'custom' as const,
  }));
}

export function useDashboardLayout(): ResolvedWidget[] {
  const dashboardConfig = useConfigStore((state) => state.config.dashboard);

  return useMemo(() => {
    const storedLayout = loadStoredLayout();
    const configWidgets = dashboardConfig.widgets ?? [];
    const configMap = new Map(configWidgets.map((w) => [w.id, w]));

    const resolved: ResolvedWidget[] = WIDGET_REGISTRY.map((def) => {
      const configEntry = configMap.get(def.id);
      const storedEntry = storedLayout?.get(def.id);

      // Priority: sessionStorage override > TOML config > registry defaults
      const visible = storedEntry?.visible ?? configEntry?.visible ?? def.defaultVisible;
      const order = storedEntry?.order ?? configEntry?.order ?? def.defaultOrder;

      return {
        id: def.id,
        title: def.title,
        description: def.description,
        component: def.component,
        visible,
        order,
        category: def.category,
      };
    });

    // Resolve custom widgets and append after built-in widgets
    const customWidgets = dashboardConfig.customWidgets ?? [];
    if (customWidgets.length > 0) {
      const maxBuiltInOrder = resolved.length > 0 ? Math.max(...resolved.map((w) => w.order)) : 0;
      const customResolved = resolveCustomWidgets(customWidgets, maxBuiltInOrder + 1);
      resolved.push(...customResolved);
    }

    // Sort by order, stable sort preserves registry order for equal values
    resolved.sort((a, b) => a.order - b.order);

    return resolved;
  }, [dashboardConfig]);
}

export function useVisibleWidgets(): ResolvedWidget[] {
  const all = useDashboardLayout();
  return useMemo(() => all.filter((w) => w.visible), [all]);
}

export interface GroupedWidgets {
  category: WidgetCategory | 'custom';
  label: string;
  widgets: ResolvedWidget[];
}

export function useGroupedWidgets(): GroupedWidgets[] {
  const visible = useVisibleWidgets();

  return useMemo(() => {
    const groups = new Map<WidgetCategory | 'custom', ResolvedWidget[]>();
    for (const widget of visible) {
      const existing = groups.get(widget.category);
      if (existing) {
        existing.push(widget);
      } else {
        groups.set(widget.category, [widget]);
      }
    }

    const categoryOrder: (WidgetCategory | 'custom')[] = ['system', 'network', 'services', 'security', 'custom'];
    const result: GroupedWidgets[] = [];

    const labels: Record<WidgetCategory | 'custom', string> = {
      system: 'System',
      network: 'Network',
      services: 'Services',
      security: 'Security',
      custom: 'Custom Widgets',
    };

    for (const category of categoryOrder) {
      const widgets = groups.get(category);
      if (widgets && widgets.length > 0) {
        result.push({ category, label: labels[category], widgets });
      }
    }

    return result;
  }, [visible]);
}
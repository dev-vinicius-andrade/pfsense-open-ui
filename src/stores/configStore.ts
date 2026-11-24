import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { AppConfig, CustomWidget } from '@/config/schema';
import { defaultConfig } from '@/config/defaults';

interface ConfigState {
  config: AppConfig;
  setConfig: (config: AppConfig) => void;
  updateTheme: (theme: Partial<AppConfig['theme']>) => void;
  updateLayout: (layout: Partial<AppConfig['layout']>) => void;
  updateMenu: (menu: Partial<AppConfig['menu']>) => void;
  addCustomWidget: (widget: CustomWidget) => void;
  updateCustomWidget: (id: string, updates: Partial<CustomWidget>) => void;
  removeCustomWidget: (id: string) => void;
  reorderCustomWidgets: (ids: string[]) => void;
  resetToDefaults: () => void;
}

export const useConfigStore = create<ConfigState>()(
  persist(
    (set) => ({
      config: defaultConfig,
      setConfig: (config) => set({ config }),
      updateTheme: (theme) =>
        set((state) => ({
          config: { ...state.config, theme: { ...state.config.theme, ...theme } },
        })),
      updateLayout: (layout) =>
        set((state) => ({
          config: { ...state.config, layout: { ...state.config.layout, ...layout } },
        })),
      updateMenu: (menu) =>
        set((state) => ({
          config: { ...state.config, menu: { ...state.config.menu, ...menu } },
        })),
      addCustomWidget: (widget) =>
        set((state) => ({
          config: {
            ...state.config,
            dashboard: {
              ...state.config.dashboard,
              customWidgets: [...(state.config.dashboard.customWidgets ?? []), widget],
            },
          },
        })),
      updateCustomWidget: (id, updates) =>
        set((state) => ({
          config: {
            ...state.config,
            dashboard: {
              ...state.config.dashboard,
              customWidgets: (state.config.dashboard.customWidgets ?? []).map(
                (w): CustomWidget =>
                  w.id === id ? ({ ...w, ...updates } as CustomWidget) : w,
              ),
            },
          },
        })),
      removeCustomWidget: (id) =>
        set((state) => ({
          config: {
            ...state.config,
            dashboard: {
              ...state.config.dashboard,
              customWidgets: (state.config.dashboard.customWidgets ?? []).filter(
                (w) => w.id !== id,
              ),
            },
          },
        })),
      reorderCustomWidgets: (ids) =>
        set((state) => {
          const current = state.config.dashboard.customWidgets ?? [];
          const widgetMap = new Map(current.map((w) => [w.id, w]));
          const reordered: typeof current = [];
          for (const id of ids) {
            const widget = widgetMap.get(id);
            if (widget) {
              reordered.push(widget);
            }
          }
          // Append any widgets not in the provided id list (safety net)
          for (const widget of current) {
            if (!ids.includes(widget.id)) {
              reordered.push(widget);
            }
          }
          return {
            config: {
              ...state.config,
              dashboard: { ...state.config.dashboard, customWidgets: reordered },
            },
          };
        }),
      resetToDefaults: () => set({ config: defaultConfig }),
    }),
    {
      name: 'pfsense-ui-config',
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({ config: state.config }),
    },
  ),
);
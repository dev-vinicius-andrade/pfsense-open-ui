import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { AppConfig } from '@/config/schema';
import { defaultConfig } from '@/config/defaults';

interface ConfigState {
  config: AppConfig;
  setConfig: (config: AppConfig) => void;
  updateTheme: (theme: Partial<AppConfig['theme']>) => void;
  updateLayout: (layout: Partial<AppConfig['layout']>) => void;
  updateMenu: (menu: Partial<AppConfig['menu']>) => void;
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
      resetToDefaults: () => set({ config: defaultConfig }),
    }),
    {
      name: 'pfsense-ui-config',
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({ config: state.config }),
    },
  ),
);
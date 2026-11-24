import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface BreadcrumbItem {
  label: string;
  path?: string;
}

interface UiState {
  sidebarOpen: boolean;
  themeMode: 'light' | 'dark';
  breadcrumbs: BreadcrumbItem[];
  floatingTerminalOpen: boolean;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setThemeMode: (mode: 'light' | 'dark') => void;
  setBreadcrumbs: (breadcrumbs: BreadcrumbItem[]) => void;
  toggleFloatingTerminal: () => void;
  setFloatingTerminalOpen: (open: boolean) => void;
}

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      sidebarOpen: true,
      themeMode: 'light',
      breadcrumbs: [],
      floatingTerminalOpen: false,
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      setThemeMode: (mode) => set({ themeMode: mode }),
      setBreadcrumbs: (breadcrumbs) => set({ breadcrumbs }),
      toggleFloatingTerminal: () => set((state) => ({ floatingTerminalOpen: !state.floatingTerminalOpen })),
      setFloatingTerminalOpen: (open) => set({ floatingTerminalOpen: open }),
    }),
    {
      name: 'pfsense-ui',
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({
        sidebarOpen: state.sidebarOpen,
        themeMode: state.themeMode,
      }),
    },
  ),
);
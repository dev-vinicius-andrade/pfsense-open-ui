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
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setThemeMode: (mode: 'light' | 'dark') => void;
  setBreadcrumbs: (breadcrumbs: BreadcrumbItem[]) => void;
}

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      sidebarOpen: true,
      themeMode: 'light',
      breadcrumbs: [],
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      setThemeMode: (mode) => set({ themeMode: mode }),
      setBreadcrumbs: (breadcrumbs) => set({ breadcrumbs }),
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
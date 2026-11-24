import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { useMemo, useState, useEffect } from 'react';
import { getTheme } from './theme/theme';
import { AuthProvider } from './auth/AuthProvider';
import { NotificationProvider } from './components/shared/NotificationProvider';
import { useConfigStore } from './stores/configStore';
import { router } from './router/router';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function useResolvedThemeMode(configMode: 'light' | 'dark' | 'auto'): 'light' | 'dark' {
  const [systemDark, setSystemDark] = useState(
    () => window.matchMedia('(prefers-color-scheme: dark)').matches,
  );

  useEffect(() => {
    if (configMode !== 'auto') return;

    const mql = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => setSystemDark(e.matches);

    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, [configMode]);

  if (configMode === 'auto') {
    return systemDark ? 'dark' : 'light';
  }

  return configMode;
}

function ThemedApp() {
  const scheme = useConfigStore((state) => state.config.theme.scheme);
  const configMode = useConfigStore((state) => state.config.theme.mode);
  const resolvedMode = useResolvedThemeMode(configMode);
  const theme = useMemo(
    () => getTheme(resolvedMode, scheme),
    [resolvedMode, scheme],
  );

  return (
    <NotificationProvider>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <RouterProvider router={router} />
      </ThemeProvider>
    </NotificationProvider>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ThemedApp />
      </AuthProvider>
    </QueryClientProvider>
  );
}
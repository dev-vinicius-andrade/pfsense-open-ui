import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { useMemo } from 'react';
import { getTheme } from './theme/theme';
import { AuthProvider } from './auth/AuthProvider';
import { NotificationProvider } from './components/shared/NotificationProvider';
import { useUiStore } from './stores/uiStore';
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

function ThemedApp() {
  const themeMode = useUiStore((state) => state.themeMode);
  const theme = useMemo(() => getTheme(themeMode), [themeMode]);

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
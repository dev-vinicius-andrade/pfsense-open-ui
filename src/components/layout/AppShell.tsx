import { Outlet } from 'react-router-dom';
import { Box, Container } from '@mui/material';
import { Sidebar, DRAWER_WIDTH } from './Sidebar';
import { TopBar } from './TopBar';
import { Breadcrumbs } from './Breadcrumbs';
import { useUiStore } from '@/stores/uiStore';

export function AppShell() {
  const sidebarOpen = useUiStore((state) => state.sidebarOpen);

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          ml: sidebarOpen ? 0 : `-${DRAWER_WIDTH}px`,
          transition: 'margin-left 225ms cubic-bezier(0, 0, 0.2, 1)',
          width: sidebarOpen ? `calc(100% - ${DRAWER_WIDTH}px)` : '100%',
        }}
      >
        <TopBar />
        <Container maxWidth="xl" sx={{ py: 3, flexGrow: 1 }}>
          <Breadcrumbs />
          <Outlet />
        </Container>
      </Box>
    </Box>
  );
}
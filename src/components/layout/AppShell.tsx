import { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Box, Container, useMediaQuery, useTheme } from '@mui/material';
import { Sidebar, SidebarContent } from './Sidebar';
import { TopBar } from './TopBar';
import { Breadcrumbs } from './Breadcrumbs';
import { DemoBanner } from '@/components/shared/DemoBanner';
import { useUiStore } from '@/stores/uiStore';
import { useConfigStore } from '@/stores/configStore';
import { PRESETS, type LayoutPresetConfig } from '@/theme/presets';

/**
 * Resolve the active layout preset config from the store.
 */
function useLayoutPresetConfig(): LayoutPresetConfig {
  const layoutConfig = useConfigStore((state) => state.config.layout);
  const presetName = layoutConfig.preset ?? 'relaxed';
  const base = PRESETS[presetName] ?? PRESETS.relaxed;

  if (presetName === 'custom') {
    return {
      ...base,
      ...(layoutConfig.sidebarWidth != null ? { sidebarWidth: layoutConfig.sidebarWidth } : {}),
      ...(layoutConfig.density != null ? { density: layoutConfig.density } : {}),
      ...(layoutConfig.fontScale != null ? { fontScale: layoutConfig.fontScale } : {}),
    };
  }

  return base;
}

export function AppShell() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const sidebarOpen = useUiStore((state) => state.sidebarOpen);
  const toggleSidebar = useUiStore((state) => state.toggleSidebar);
  const layoutConfig = useConfigStore((state) => state.config.layout);
  const presetConfig = useLayoutPresetConfig();
  const [sidebarHovered, setSidebarHovered] = useState(false);
  const navigate = useNavigate();

  const presetName = layoutConfig.preset ?? 'relaxed';
  const isEnterprise = presetName === 'enterprise';

  // Calculate sidebar width based on preset and state
  const getSidebarWidth = () => {
    if (isMobile) return 0; // Mobile uses overlay, no width reserved
    if (isEnterprise) {
      return sidebarHovered ? presetConfig.sidebarWidth : presetConfig.sidebarCollapsedWidth;
    }
    return sidebarOpen ? presetConfig.sidebarWidth : 0;
  };

  const sidebarWidth = getSidebarWidth();
  const showLabels = isMobile ? true : (isEnterprise ? sidebarHovered : sidebarOpen);
  const collapsed = !showLabels;

  const handleNavigate = (path: string) => {
    navigate(path);
    if (isMobile) toggleSidebar();
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', overflow: 'hidden' }}>
      {/* Desktop sidebar: rendered directly as a flex child, no Drawer wrapper */}
      {!isMobile && (
        <Box
          sx={{
            width: sidebarWidth,
            flexShrink: 0,
            height: '100vh',
            position: 'sticky',
            top: 0,
            overflowY: 'auto',
            overflowX: 'hidden',
            transition: 'width 225ms cubic-bezier(0, 0, 0.2, 1)',
            borderRight: '1px solid',
            borderColor: 'divider',
            background: (t) =>
              t.palette.mode === 'dark'
                ? `linear-gradient(180deg, ${t.palette.background.paper} 0%, ${t.palette.background.default} 100%)`
                : t.palette.background.paper,
          }}
          onMouseEnter={() => {
            if (isEnterprise) setSidebarHovered(true);
          }}
          onMouseLeave={() => {
            if (isEnterprise) setSidebarHovered(false);
          }}
        >
          <SidebarContent showLabels={showLabels} onNavigate={handleNavigate} collapsed={collapsed} />
        </Box>
      )}

      {/* Mobile sidebar: temporary overlay Drawer */}
      {isMobile && <Sidebar />}

      {/* Main content area */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0,
          minHeight: '100vh',
          overflowY: 'auto',
        }}
      >
        <TopBar />
        <DemoBanner />
        <Container
          maxWidth={isMobile ? false : presetConfig.containerMaxWidth}
          disableGutters={isMobile}
          sx={{
            py: isMobile ? 2 : 3,
            px: isMobile ? 2 : undefined,
            flexGrow: 1,
            width: '100%',
          }}
        >
          <Breadcrumbs />
          <Outlet />
        </Container>
      </Box>
    </Box>
  );
}
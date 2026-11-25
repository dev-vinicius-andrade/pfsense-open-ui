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
  const isFloating = !isEnterprise && !isMobile;

  // Floating sidebar dimensions
  const FLOAT_GAP = 16;
  const FLOAT_RADIUS = 12;

  const getSidebarWidth = () => {
    if (isMobile) return 0;
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
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* Desktop sidebar */}
      {!isMobile && (
        <Box
          sx={{
            ...(isFloating
              ? {
                  position: 'fixed',
                  top: FLOAT_GAP,
                  left: FLOAT_GAP,
                  bottom: FLOAT_GAP,
                  borderRadius: `${FLOAT_RADIUS}px`,
                  boxShadow:
                    theme.palette.mode === 'dark'
                      ? '0 4px 20px rgba(0,0,0,0.35), 0 0 0 1px rgba(255,255,255,0.04)'
                      : '0 4px 20px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.04)',
                }
              : {
                  position: 'sticky',
                  top: 0,
                  height: '100vh',
                  borderRight: '1px solid',
                  borderColor: 'divider',
                }),
            width: sidebarWidth,
            zIndex: theme.zIndex.drawer + 1,
            overflowY: 'auto',
            overflowX: 'hidden',
            transition: 'width 225ms cubic-bezier(0, 0, 0.2, 1)',
            bgcolor: 'background.paper',
            '&::-webkit-scrollbar': { width: 0 },
            scrollbarWidth: 'none',
          }}
          onMouseEnter={() => {
            if (isEnterprise) setSidebarHovered(true);
          }}
          onMouseLeave={() => {
            if (isEnterprise) setSidebarHovered(false);
          }}
        >
          <SidebarContent
            showLabels={showLabels}
            onNavigate={handleNavigate}
            collapsed={collapsed}
          />
        </Box>
      )}

      {/* Mobile sidebar */}
      {isMobile && <Sidebar />}

      {/* Main content wrapper — full width, background fills behind floating sidebar */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0,
          minHeight: '100vh',
          bgcolor: 'background.default',
        }}
      >
        {/* Inner content area with offset for sidebar */}
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            flexGrow: 1,
            // Floating: padding-left pushes content right but background stays seamless
            // Enterprise: margin-left for flush layout against sticky sidebar
            pl: isMobile ? 0 : isFloating ? `${sidebarWidth + FLOAT_GAP * 2}px` : 0,
            ml: isMobile || isFloating ? 0 : `${sidebarWidth}px`,
            transition:
              'padding-left 225ms cubic-bezier(0, 0, 0.2, 1), margin-left 225ms cubic-bezier(0, 0, 0.2, 1)',
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
    </Box>
  );
}
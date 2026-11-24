import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Box, Container, useMediaQuery, useTheme } from '@mui/material';
import { Sidebar } from './Sidebar';
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
  const layoutConfig = useConfigStore((state) => state.config.layout);
  const presetConfig = useLayoutPresetConfig();
  const [sidebarHovered, setSidebarHovered] = useState(false);

  const presetName = layoutConfig.preset ?? 'relaxed';
  const isEnterprise = presetName === 'enterprise';

  // On mobile: content always takes full width (sidebar is an overlay)
  // On desktop: calculate margin based on sidebar state and preset
  const getContentMargin = () => {
    if (isMobile) return 0;
    if (isEnterprise) {
      return sidebarHovered ? presetConfig.sidebarWidth : presetConfig.sidebarCollapsedWidth;
    }
    return sidebarOpen ? presetConfig.sidebarWidth : 0;
  };

  const contentMargin = getContentMargin();

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {!isMobile && (
        <div
          onMouseEnter={() => {
            if (isEnterprise) setSidebarHovered(true);
          }}
          onMouseLeave={() => {
            if (isEnterprise) setSidebarHovered(false);
          }}
        >
          <Sidebar />
        </div>
      )}
      {isMobile && <Sidebar />}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0, // Prevent flex children from overflowing
          ml: isMobile ? 0 : `${contentMargin}px`,
          transition: 'margin-left 225ms cubic-bezier(0, 0, 0.2, 1)',
          width: isMobile ? '100%' : `calc(100% - ${contentMargin}px)`,
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
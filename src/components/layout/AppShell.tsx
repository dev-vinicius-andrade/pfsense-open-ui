import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Box, Container } from '@mui/material';
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
  const sidebarOpen = useUiStore((state) => state.sidebarOpen);
  const layoutConfig = useConfigStore((state) => state.config.layout);
  const presetConfig = useLayoutPresetConfig();
  const [sidebarHovered, setSidebarHovered] = useState(false);

  const presetName = layoutConfig.preset ?? 'relaxed';
  const isEnterprise = presetName === 'enterprise';

  // Calculate current sidebar width based on preset and state
  const currentSidebarWidth = isEnterprise
    ? (sidebarHovered ? presetConfig.sidebarWidth : presetConfig.sidebarCollapsedWidth)
    : (sidebarOpen ? presetConfig.sidebarWidth : 0);

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
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
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          ml: isEnterprise ? `${currentSidebarWidth}px` : (sidebarOpen ? 0 : `-${presetConfig.sidebarWidth}px`),
          transition: 'margin-left 225ms cubic-bezier(0, 0, 0.2, 1)',
          width: isEnterprise
            ? `calc(100% - ${currentSidebarWidth}px)`
            : (sidebarOpen ? `calc(100% - ${presetConfig.sidebarWidth}px)` : '100%'),
        }}
      >
        <TopBar />
        <DemoBanner />
        <Container maxWidth={presetConfig.containerMaxWidth} sx={{ py: 3, flexGrow: 1 }}>
          <Breadcrumbs />
          <Outlet />
        </Container>
      </Box>
    </Box>
  );
}
import { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  Box,
  Divider,
  IconButton,
  Tooltip,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import MenuOpenIcon from '@mui/icons-material/MenuOpen';
import SecurityIcon from '@mui/icons-material/Security';
import DashboardIcon from '@mui/icons-material/Dashboard';
import { useUiStore } from '@/stores/uiStore';
import { useConfigStore } from '@/stores/configStore';
import { DEFAULT_NAV_ITEMS } from './navConfig';
import { getIcon } from './iconRegistry';
import { getPageById } from './pageRegistry';
import { PRESETS, type LayoutPresetConfig } from '@/theme/presets';

export const DRAWER_WIDTH = 260;

/**
 * Resolve the active layout preset config from the store.
 */
function useLayoutPresetConfig(): LayoutPresetConfig {
  const layoutConfig = useConfigStore((state) => state.config.layout);
  return useMemo(() => {
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
  }, [layoutConfig]);
}

/**
 * Returns the current sidebar widths based on the active layout preset.
 * Useful for AppShell to calculate content area margins.
 */
export function getSidebarWidths(): { expanded: number; collapsed: number } {
  const layoutConfig = useConfigStore.getState().config.layout;
  const presetName = layoutConfig.preset ?? 'relaxed';
  const base = PRESETS[presetName] ?? PRESETS.relaxed;

  if (presetName === 'custom') {
    const merged = {
      ...base,
      ...(layoutConfig.sidebarWidth != null ? { sidebarWidth: layoutConfig.sidebarWidth } : {}),
    };
    return { expanded: merged.sidebarWidth, collapsed: merged.sidebarCollapsedWidth };
  }

  return { expanded: base.sidebarWidth, collapsed: base.sidebarCollapsedWidth };
}

/**
 * Resolve nav items with config overrides applied.
 * Returns items in configured order, with hidden items removed,
 * and custom labels/icons applied.
 */
function useResolvedNavItems() {
  const menuConfig = useConfigStore((state) => state.config.menu);

  return useMemo(() => {
    const hiddenSet = new Set(menuConfig.hidden ?? []);
    const orderArray = menuConfig.order ?? [];
    const customLabels = menuConfig.customLabels ?? {};
    const customIcons = menuConfig.customIcons ?? {};

    // Apply overrides to each default item
    const overriddenItems = DEFAULT_NAV_ITEMS.map((item) => ({
      ...item,
      label: customLabels[item.id] ?? item.label,
      iconKey: customIcons[item.id] ?? item.icon,
    }));

    // Filter out hidden items
    const visibleItems = overriddenItems.filter((item) => !hiddenSet.has(item.id));

    // Sort by configured order; items not in order array appear at end in default order
    if (orderArray.length > 0) {
      const orderIndex = new Map(orderArray.map((id, index) => [id, index]));
      visibleItems.sort((a, b) => {
        const aIndex = orderIndex.get(a.id);
        const bIndex = orderIndex.get(b.id);
        if (aIndex !== undefined && bIndex !== undefined) return aIndex - bIndex;
        if (aIndex !== undefined) return -1;
        if (bIndex !== undefined) return 1;
        return 0;
      });
    }

    return visibleItems;
  }, [menuConfig]);
}

/**
 * Resolve favorite nav items from config.
 * Supports both top-level nav items and sub-pages from PAGE_REGISTRY.
 * Invalid IDs are silently ignored.
 */
function useFavoriteNavItems() {
  const menuConfig = useConfigStore((state) => state.config.menu);
  const resolvedItems = useResolvedNavItems();

  return useMemo(() => {
    const favoriteIds = menuConfig.favorites ?? [];
    if (favoriteIds.length === 0) return [];

    const allItemsMap = new Map(
      DEFAULT_NAV_ITEMS.map((item) => [
        item.id,
        {
          ...item,
          label: menuConfig.customLabels?.[item.id] ?? item.label,
          iconKey: menuConfig.customIcons?.[item.id] ?? item.icon,
        },
      ]),
    );

    const resolvedMap = new Map(resolvedItems.map((item) => [item.id, item]));

    const favorites: Array<{ id: string; label: string; path: string; iconKey: string }> = [];
    for (const id of favoriteIds) {
      const resolved = resolvedMap.get(id);
      if (resolved) {
        favorites.push(resolved);
        continue;
      }
      const allItem = allItemsMap.get(id);
      if (allItem) {
        favorites.push(allItem);
        continue;
      }
      // Check PAGE_REGISTRY for sub-pages
      const pageEntry = getPageById(id);
      if (pageEntry) {
        favorites.push({
          id: pageEntry.id,
          label: menuConfig.customLabels?.[pageEntry.id] ?? pageEntry.label,
          path: pageEntry.path,
          iconKey: menuConfig.customIcons?.[pageEntry.id] ?? pageEntry.icon,
        });
      }
    }

    return favorites;
  }, [menuConfig, resolvedItems]);
}

/**
 * Resolve custom pinned sidebar items from config.menu.customItems.
 * Each item references a PAGE_REGISTRY entry with optional label/icon overrides.
 */
function useCustomSidebarItems() {
  const menuConfig = useConfigStore((state) => state.config.menu);

  return useMemo(() => {
    const customItems = menuConfig.customItems ?? [];
    if (customItems.length === 0) return [];

    const result: Array<{ id: string; label: string; path: string; iconKey: string }> = [];
    for (const item of customItems) {
      const pageEntry = getPageById(item.id);
      if (!pageEntry) continue;
      result.push({
        id: pageEntry.id,
        label: item.label ?? pageEntry.label,
        path: pageEntry.path,
        iconKey: item.icon ?? pageEntry.icon,
      });
    }

    return result;
  }, [menuConfig]);
}

interface NavEntryProps {
  label: string;
  iconKey: string;
  isActive: boolean;
  onClick: () => void;
  collapsed?: boolean;
}

function NavEntry({ label, iconKey, isActive, onClick, collapsed }: NavEntryProps) {
  const IconComponent = getIcon(iconKey, DashboardIcon);

  const button = (
    <ListItemButton
      selected={isActive}
      onClick={onClick}
      sx={{
        borderRadius: 2,
        mb: 0.5,
        px: collapsed ? 0 : 1.5,
        py: collapsed ? 0 : 1.25,
        minHeight: collapsed ? 40 : 40,
        minWidth: collapsed ? 40 : undefined,
        width: collapsed ? 40 : undefined,
        justifyContent: collapsed ? 'center' : 'initial',
        borderLeft: isActive ? '4px solid' : '4px solid transparent',
        borderColor: isActive ? 'primary.main' : 'transparent',
        transition: 'background-color 200ms ease, transform 200ms ease, color 200ms ease, border-color 200ms ease, box-shadow 200ms ease',
        '&:hover': {
          backgroundColor: 'action.hover',
          opacity: 0.92,
          transform: collapsed ? 'none' : 'scale(1.01)',
        },
        '&.Mui-selected': {
          backgroundColor: 'primary.main',
          color: 'primary.contrastText',
          boxShadow: (theme) =>
            `inset 0 0 0 1px ${theme.palette.primary.light}`,
          '&:hover': {
            backgroundColor: 'primary.dark',
          },
          '& .MuiListItemIcon-root': {
            color: 'primary.contrastText',
          },
          '& .MuiListItemText-primary': {
            fontWeight: 600,
          },
        },
        '&:focus-visible': {
          outline: '2px solid',
          outlineColor: 'primary.main',
          outlineOffset: '2px',
        },
      }}
    >
      <ListItemIcon
        sx={{
          minWidth: collapsed ? 'auto' : 32,
          mr: collapsed ? 0 : 1.5,
          justifyContent: 'center',
          color: isActive ? 'primary.contrastText' : 'text.secondary',
          transition: 'color 200ms ease',
        }}
      >
        <IconComponent fontSize="small" />
      </ListItemIcon>
      {!collapsed && (
        <ListItemText
          primary={
            <Typography
              component="span"
              sx={{
                fontSize: 14,
                fontWeight: isActive ? 600 : 500,
                lineHeight: 1.4,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                display: 'block',
              }}
            >
              {label}
            </Typography>
          }
        />
      )}
    </ListItemButton>
  );

  if (collapsed) {
    return (
      <Tooltip title={label} placement="right" arrow>
        {button}
      </Tooltip>
    );
  }

  return button;
}

interface SectionLabelProps {
  children: React.ReactNode;
  visible: boolean;
}

function SectionLabel({ children, visible }: SectionLabelProps) {
  if (!visible) return null;
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        px: 2,
        mt: 2,
        mb: 1,
      }}
    >
      <Box
        sx={{
          width: 2,
          height: 12,
          borderRadius: 1,
          backgroundColor: 'primary.main',
          flexShrink: 0,
        }}
      />
      <Typography
        variant="caption"
        sx={{
          fontSize: '0.7rem',
          fontWeight: 700,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: 'text.secondary',
          opacity: 0.7,
          lineHeight: 1,
        }}
      >
        {children}
      </Typography>
    </Box>
  );
}

export function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const sidebarOpen = useUiStore((state) => state.sidebarOpen);
  const toggleSidebar = useUiStore((state) => state.toggleSidebar);
  const layoutConfig = useConfigStore((state) => state.config.layout);
  const presetConfig = useLayoutPresetConfig();

  const resolvedNavItems = useResolvedNavItems();
  const favoriteItems = useFavoriteNavItems();
  const customItems = useCustomSidebarItems();

  const presetName = layoutConfig.preset ?? 'relaxed';
  const isEnterprise = presetName === 'enterprise';
  const [hovered, setHovered] = useState(false);

  // On mobile: always show full-width overlay with labels
  // On desktop enterprise: collapsed by default, expand on hover
  // On desktop other modes: use toggle behavior
  const showLabels = isMobile ? true : (isEnterprise ? hovered : sidebarOpen);

  const currentWidth = isMobile
    ? Math.min(DRAWER_WIDTH, typeof window !== 'undefined' ? window.innerWidth * 0.85 : DRAWER_WIDTH)
    : isEnterprise
      ? (hovered ? presetConfig.sidebarWidth : presetConfig.sidebarCollapsedWidth)
      : (sidebarOpen ? presetConfig.sidebarWidth : 0);

  const variant = isMobile ? 'temporary' : 'persistent';

  const handleNavigate = (path: string) => {
    navigate(path);
    if (isMobile) toggleSidebar();
  };

  return (
    <Drawer
      variant={variant}
      open={isMobile ? sidebarOpen : true}
      onClose={toggleSidebar}
      ModalProps={{ keepMounted: true }}
      onMouseEnter={() => {
        if (isEnterprise && !isMobile) setHovered(true);
      }}
      onMouseLeave={() => {
        if (isEnterprise && !isMobile) setHovered(false);
      }}
      sx={{
        width: isMobile ? undefined : currentWidth,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: currentWidth,
          height: '100vh',
          boxSizing: 'border-box',
          position: isMobile ? 'fixed' : 'relative',
          top: 0,
          left: 0,
          margin: 0,
          borderRight: 'none',
          transition: 'width 225ms cubic-bezier(0, 0, 0.2, 1)',
          overflowX: 'hidden',
          background: (theme) =>
            theme.palette.mode === 'dark'
              ? `linear-gradient(180deg, ${theme.palette.background.paper} 0%, ${theme.palette.background.default} 100%)`
              : undefined,
          // On mobile temporary drawer, ensure it doesn't exceed viewport
          ...(isMobile ? { maxWidth: '85vw' } : {}),
        },
      }}
    >
      <Toolbar
        sx={{
          justifyContent: 'space-between',
          minHeight: isMobile ? 56 : undefined,
          pb: 1,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
          <SecurityIcon color="primary" />
          {showLabels && (
            <Typography variant="h6" noWrap sx={{ fontWeight: 700 }}>
              pfSense UI
            </Typography>
          )}
        </Box>
        {/* Close button: always visible on mobile, visible on desktop only in relaxed/custom mode */}
        {(isMobile || (!isEnterprise && showLabels)) && (
          <IconButton size="small" onClick={toggleSidebar} aria-label="close sidebar">
            <MenuOpenIcon />
          </IconButton>
        )}
      </Toolbar>
      <Divider />

      {/* Favorites section */}
      {favoriteItems.length > 0 && (
        <>
          <SectionLabel visible={showLabels}>Favorites</SectionLabel>
          <List sx={{ px: 1, py: 0.5 }}>
            {favoriteItems.map((item) => (
              <NavEntry
                key={`fav-${item.id}`}
                label={item.label}
                iconKey={item.iconKey}
                isActive={location.pathname.startsWith(item.path)}
                onClick={() => handleNavigate(item.path)}
                collapsed={!showLabels}
              />
            ))}
          </List>
          <Divider sx={{ my: 1 }} />
        </>
      )}

      {/* Custom pinned pages section */}
      {customItems.length > 0 && (
        <>
          <SectionLabel visible={showLabels}>Pinned Pages</SectionLabel>
          <List sx={{ px: 1, py: 0.5 }}>
            {customItems.map((item) => (
              <NavEntry
                key={`custom-${item.id}`}
                label={item.label}
                iconKey={item.iconKey}
                isActive={location.pathname.startsWith(item.path)}
                onClick={() => handleNavigate(item.path)}
                collapsed={!showLabels}
              />
            ))}
          </List>
          <Divider sx={{ my: 1 }} />
        </>
      )}

      {/* Main navigation */}
      <SectionLabel visible={showLabels}>Navigation</SectionLabel>
      <List sx={{ px: 1 }}>
        {resolvedNavItems.map((item) => (
          <NavEntry
            key={item.id}
            label={item.label}
            iconKey={item.iconKey}
            isActive={location.pathname.startsWith(item.path)}
            onClick={() => handleNavigate(item.path)}
            collapsed={!showLabels}
          />
        ))}
      </List>
    </Drawer>
  );
}
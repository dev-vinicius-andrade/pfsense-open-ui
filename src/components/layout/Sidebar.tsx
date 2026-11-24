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
        // Items in order array come first, sorted by their position
        if (aIndex !== undefined && bIndex !== undefined) return aIndex - bIndex;
        // Items in order array come before items not in it
        if (aIndex !== undefined) return -1;
        if (bIndex !== undefined) return 1;
        // Items not in order array keep their relative default order
        return 0;
      });
    }

    return visibleItems;
  }, [menuConfig]);
}

/**
 * Resolve favorite nav items from config.
 * Invalid IDs are silently ignored.
 */
function useFavoriteNavItems() {
  const menuConfig = useConfigStore((state) => state.config.menu);
  const resolvedItems = useResolvedNavItems();

  return useMemo(() => {
    const favoriteIds = menuConfig.favorites ?? [];
    if (favoriteIds.length === 0) return [];

    // Build a map of all default items (including hidden ones) for favorites lookup
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

    // Also check resolved (visible) items for label/icon overrides consistency
    const resolvedMap = new Map(resolvedItems.map((item) => [item.id, item]));

    const favorites: Array<{ id: string; label: string; path: string; iconKey: string }> = [];
    for (const id of favoriteIds) {
      // Prefer resolved item (has overrides applied), fall back to default with overrides
      const resolved = resolvedMap.get(id);
      if (resolved) {
        favorites.push(resolved);
        continue;
      }
      // Item might be hidden but still valid as favorite
      const allItem = allItemsMap.get(id);
      if (allItem) {
        favorites.push(allItem);
      }
      // Invalid IDs are silently ignored
    }

    return favorites;
  }, [menuConfig, resolvedItems]);
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

  return (
    <ListItemButton
      selected={isActive}
      onClick={onClick}
      sx={{
        justifyContent: collapsed ? 'center' : 'initial',
        px: collapsed ? 1.5 : undefined,
      }}
    >
      <ListItemIcon sx={{ minWidth: collapsed ? 'auto' : 40, justifyContent: 'center' }}>
        <IconComponent fontSize="small" />
      </ListItemIcon>
      {!collapsed && <ListItemText primary={label} />}
    </ListItemButton>
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

  const presetName = layoutConfig.preset ?? 'relaxed';
  const isEnterprise = presetName === 'enterprise';
  const [hovered, setHovered] = useState(false);

  // Enterprise mode: collapsed by default, expand on hover
  // Other modes: use existing toggle behavior
  const currentWidth = isEnterprise
    ? (hovered ? presetConfig.sidebarWidth : presetConfig.sidebarCollapsedWidth)
    : (sidebarOpen ? presetConfig.sidebarWidth : 0);

  const showLabels = isEnterprise ? hovered : sidebarOpen;

  // On mobile: temporary overlay drawer. On desktop: persistent inline drawer.
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
        width: currentWidth,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: currentWidth,
          boxSizing: 'border-box',
          position: isMobile ? 'fixed' : 'relative',
          transition: 'width 225ms cubic-bezier(0, 0, 0.2, 1)',
          overflowX: 'hidden',
        },
      }}
    >
      <Toolbar sx={{ justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
          <SecurityIcon color="primary" />
          {showLabels && (
            <Typography variant="h6" noWrap sx={{ fontWeight: 700 }}>
              pfSense UI
            </Typography>
          )}
        </Box>
        {/* Close button inside the drawer so users can always reopen via TopBar hamburger */}
        {showLabels && !isMobile && !isEnterprise && (
          <IconButton size="small" onClick={toggleSidebar} aria-label="close sidebar">
            <MenuOpenIcon />
          </IconButton>
        )}
      </Toolbar>
      <Divider />

      {/* Favorites section */}
      {favoriteItems.length > 0 && (
        <>
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
          <Divider />
        </>
      )}

      {/* Main navigation */}
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
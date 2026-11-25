import { useMemo } from 'react';
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
import { PRESETS } from '@/theme/presets';

export const DRAWER_WIDTH = 260;

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

/**
 * SidebarContent renders the actual navigation content.
 * Used directly in AppShell for desktop (no Drawer wrapper)
 * and inside a Drawer for mobile overlay.
 */
export function SidebarContent({ showLabels, onNavigate, collapsed }: {
  showLabels: boolean;
  onNavigate: (path: string) => void;
  collapsed: boolean;
}) {
  const location = useLocation();

  const resolvedNavItems = useResolvedNavItems();
  const favoriteItems = useFavoriteNavItems();
  const customItems = useCustomSidebarItems();

  return (
    <>
      <Toolbar
        sx={{
          justifyContent: 'space-between',
          minHeight: 56,
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
                onClick={() => onNavigate(item.path)}
                collapsed={collapsed}
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
                onClick={() => onNavigate(item.path)}
                collapsed={collapsed}
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
            onClick={() => onNavigate(item.path)}
            collapsed={collapsed}
          />
        ))}
      </List>
    </>
  );
}

/**
 * Sidebar component.
 * On desktop: renders nothing (AppShell uses SidebarContent directly).
 * On mobile: renders a temporary Drawer overlay.
 */
export function Sidebar() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const sidebarOpen = useUiStore((state) => state.sidebarOpen);
  const toggleSidebar = useUiStore((state) => state.toggleSidebar);
  const navigate = useNavigate();

  if (!isMobile) {
    // Desktop: AppShell handles rendering via SidebarContent directly
    return null;
  }

  // Mobile: temporary overlay drawer
  const handleNavigate = (path: string) => {
    navigate(path);
    toggleSidebar();
  };

  return (
    <Drawer
      variant="temporary"
      open={sidebarOpen}
      onClose={toggleSidebar}
      ModalProps={{ keepMounted: true }}
      sx={{
        '& .MuiDrawer-paper': {
          width: Math.min(DRAWER_WIDTH, window.innerWidth * 0.85),
          maxWidth: '85vw',
          boxSizing: 'border-box',
        },
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', p: 0.5 }}>
        <IconButton size="small" onClick={toggleSidebar} aria-label="close sidebar">
          <MenuOpenIcon />
        </IconButton>
      </Box>
      <SidebarContent showLabels={true} onNavigate={handleNavigate} collapsed={false} />
    </Drawer>
  );
}
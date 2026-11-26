import { AppBar, Toolbar, IconButton, Typography, Box, Menu, MenuItem, Chip } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import CodeIcon from '@mui/icons-material/Code';
import SearchIcon from '@mui/icons-material/Search';
import EditIcon from '@mui/icons-material/Edit';
import CheckIcon from '@mui/icons-material/Check';
import { useState, lazy, Suspense } from 'react';
import { useUiStore } from '@/stores/uiStore';
import { useAuth } from '@/auth/useAuth';
import { hasRegisteredPanels } from '@/layout/panelRegistry';
import { useCurrentPageId } from '@/layout/useCurrentPageId';

const TerminalFloatingPanel = lazy(() =>
 import('@/components/terminal/TerminalFloatingPanel').then((m) => ({ default: m.TerminalFloatingPanel })),
);

const TERMINAL_PRIVILEGE = 'page-diagnostics-command-prompt';

interface TopBarProps {
  onSearchClick?: () => void;
}

export function TopBar({ onSearchClick }: TopBarProps) {
  const { toggleSidebar, themeMode, setThemeMode, floatingTerminalOpen, toggleFloatingTerminal, layoutEditMode, toggleLayoutEditMode } = useUiStore();
  const { user, logout } = useAuth();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const currentPageId = useCurrentPageId();
  const canEditLayout = currentPageId !== undefined && hasRegisteredPanels(currentPageId);

  const isMac = typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform);
  const shortcutHint = isMac ? '⌘K' : 'Ctrl+K';

  const hasTerminalPrivilege = user?.privileges.includes(TERMINAL_PRIVILEGE) ?? false;

  const handleUserMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleUserMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    handleUserMenuClose();
    await logout();
  };

  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        bgcolor: 'background.default',
        borderBottom: '1px solid',
        borderColor: 'divider',
      }}
    >
      <Toolbar>
        <IconButton
          edge="start"
          color="inherit"
          aria-label="toggle sidebar"
          onClick={toggleSidebar}
          sx={{ mr: 2 }}
        >
          <MenuIcon />
        </IconButton>

        <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
          {import.meta.env.VITE_APP_TITLE || 'pfSense UI'}
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Chip label="System OK" size="small" color="success" variant="outlined" />

          <Box sx={{ display: 'flex', alignItems: 'center', mr: 0.5 }}>
            <IconButton
              color="inherit"
              aria-label="search"
              onClick={onSearchClick}
              title={`Search (${shortcutHint})`}
            >
              <SearchIcon />
            </IconButton>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ ml: 0.5, fontFamily: 'monospace', opacity: 0.7 }}
            >
              {shortcutHint}
            </Typography>
          </Box>

          {canEditLayout && (
            <IconButton
              color={layoutEditMode ? 'primary' : 'inherit'}
              aria-label={layoutEditMode ? 'exit layout edit mode' : 'enter layout edit mode'}
              onClick={toggleLayoutEditMode}
              title={layoutEditMode ? 'Exit Edit Mode' : 'Edit Layout'}
            >
              {layoutEditMode ? <CheckIcon /> : <EditIcon />}
            </IconButton>
          )}

          {hasTerminalPrivilege && (
            <IconButton
              color={floatingTerminalOpen ? 'primary' : 'inherit'}
              aria-label="toggle floating terminal"
              onClick={toggleFloatingTerminal}
              title="Toggle Terminal"
            >
              <CodeIcon />
            </IconButton>
          )}

          <IconButton
            color="inherit"
            aria-label="toggle theme"
            onClick={() => setThemeMode(themeMode === 'light' ? 'dark' : 'light')}
          >
            {themeMode === 'light' ? <Brightness4Icon /> : <Brightness7Icon />}
          </IconButton>

          <IconButton
            color="inherit"
            aria-label="user menu"
            onClick={handleUserMenuOpen}
          >
            <AccountCircleIcon />
          </IconButton>

          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleUserMenuClose}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
          >
            <MenuItem disabled>
              <Typography variant="body2">{user?.username ?? 'Unknown'}</Typography>
            </MenuItem>
            <MenuItem onClick={handleLogout}>Logout</MenuItem>
          </Menu>
        </Box>
      </Toolbar>

      {hasTerminalPrivilege && (
        <Suspense fallback={null}>
          <TerminalFloatingPanel
            open={floatingTerminalOpen}
            onClose={() => useUiStore.getState().setFloatingTerminalOpen(false)}
          />
        </Suspense>
      )}
    </AppBar>
  );
}
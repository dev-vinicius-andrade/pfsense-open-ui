import { AppBar, Toolbar, IconButton, Typography, Box, Menu, MenuItem, Chip } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import CodeIcon from '@mui/icons-material/Code';
import { useState, lazy, Suspense } from 'react';
import { useUiStore } from '@/stores/uiStore';
import { useAuth } from '@/auth/useAuth';

const TerminalFloatingPanel = lazy(() =>
 import('@/components/terminal/TerminalFloatingPanel').then((m) => ({ default: m.TerminalFloatingPanel })),
);

const TERMINAL_PRIVILEGE = 'page-diagnostics-command-prompt';

export function TopBar() {
  const { toggleSidebar, themeMode, setThemeMode, floatingTerminalOpen, toggleFloatingTerminal } = useUiStore();
  const { user, logout } = useAuth();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

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
    <AppBar position="sticky" color="default">
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
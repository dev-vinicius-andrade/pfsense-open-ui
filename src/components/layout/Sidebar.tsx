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
import DashboardIcon from '@mui/icons-material/Dashboard';
import SecurityIcon from '@mui/icons-material/Security';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import SettingsEthernetIcon from '@mui/icons-material/SettingsEthernet';
import VpnKeyIcon from '@mui/icons-material/VpnKey';
import DnsIcon from '@mui/icons-material/Dns';
import SettingsIcon from '@mui/icons-material/Settings';
import MonitorHeartIcon from '@mui/icons-material/MonitorHeart';
import { useUiStore } from '@/stores/uiStore';

export const DRAWER_WIDTH = 260;

interface NavItem {
  label: string;
  path: string;
  icon: React.ElementType;
}

const navItems: NavItem[] = [
  { label: 'Dashboard', path: '/dashboard', icon: DashboardIcon },
  { label: 'Firewall', path: '/firewall', icon: SecurityIcon },
  { label: 'NAT', path: '/nat', icon: SwapHorizIcon },
  { label: 'Interfaces', path: '/interfaces', icon: SettingsEthernetIcon },
  { label: 'VPN', path: '/vpn', icon: VpnKeyIcon },
  { label: 'Services', path: '/services', icon: DnsIcon },
  { label: 'System', path: '/system', icon: SettingsIcon },
  { label: 'Monitoring', path: '/monitoring', icon: MonitorHeartIcon },
];

export function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const sidebarOpen = useUiStore((state) => state.sidebarOpen);
  const toggleSidebar = useUiStore((state) => state.toggleSidebar);

  // On mobile: temporary overlay drawer. On desktop: persistent inline drawer.
  const variant = isMobile ? 'temporary' : 'persistent';

  return (
    <Drawer
      variant={variant}
      open={sidebarOpen}
      onClose={toggleSidebar}
      ModalProps={{ keepMounted: true }}
      sx={{
        width: sidebarOpen ? DRAWER_WIDTH : 0,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: DRAWER_WIDTH,
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
          <Typography variant="h6" noWrap sx={{ fontWeight: 700 }}>
            pfSense UI
          </Typography>
        </Box>
        {/* Close button inside the drawer so users can always reopen via TopBar hamburger */}
        {!isMobile && (
          <IconButton size="small" onClick={toggleSidebar} aria-label="close sidebar">
            <MenuOpenIcon />
          </IconButton>
        )}
      </Toolbar>
      <Divider />
      <List sx={{ px: 1 }}>
        {navItems.map((item) => {
          const isActive = location.pathname.startsWith(item.path);
          return (
            <ListItemButton
              key={item.path}
              selected={isActive}
              onClick={() => {
                navigate(item.path);
                if (isMobile) toggleSidebar();
              }}
            >
              <ListItemIcon sx={{ minWidth: 40 }}>
                <item.icon fontSize="small" />
              </ListItemIcon>
              <ListItemText primary={item.label} />
            </ListItemButton>
          );
        })}
      </List>
    </Drawer>
  );
}
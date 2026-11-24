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
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import SecurityIcon from '@mui/icons-material/Security';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import SettingsEthernetIcon from '@mui/icons-material/SettingsEthernet';
import VpnKeyIcon from '@mui/icons-material/VpnKey';
import DnsIcon from '@mui/icons-material/Dns';
import SettingsIcon from '@mui/icons-material/Settings';
import MonitorHeartIcon from '@mui/icons-material/MonitorHeart';
import { useUiStore } from '@/stores/uiStore';

const DRAWER_WIDTH = 260;

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
  const sidebarOpen = useUiStore((state) => state.sidebarOpen);

  return (
    <Drawer
      variant="persistent"
      open={sidebarOpen}
      sx={{
        width: sidebarOpen ? DRAWER_WIDTH : 0,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: DRAWER_WIDTH,
          boxSizing: 'border-box',
          position: 'relative',
          transition: 'width 225ms cubic-bezier(0, 0, 0.2, 1)',
        },
      }}
    >
      <Toolbar>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <SecurityIcon color="primary" />
          <Typography variant="h6" noWrap sx={{ fontWeight: 700 }}>
            pfSense UI
          </Typography>
        </Box>
      </Toolbar>
      <Divider />
      <List sx={{ px: 1 }}>
        {navItems.map((item) => {
          const isActive = location.pathname.startsWith(item.path);
          return (
            <ListItemButton
              key={item.path}
              selected={isActive}
              onClick={() => navigate(item.path)}
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

export { DRAWER_WIDTH };
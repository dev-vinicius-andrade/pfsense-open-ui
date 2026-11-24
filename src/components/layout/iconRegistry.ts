import type React from 'react';
import DashboardIcon from '@mui/icons-material/Dashboard';
import SecurityIcon from '@mui/icons-material/Security';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import SettingsEthernetIcon from '@mui/icons-material/SettingsEthernet';
import VpnKeyIcon from '@mui/icons-material/VpnKey';
import DnsIcon from '@mui/icons-material/Dns';
import SettingsIcon from '@mui/icons-material/Settings';
import MonitorHeartIcon from '@mui/icons-material/MonitorHeart';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import StorageIcon from '@mui/icons-material/Storage';
import RouterIcon from '@mui/icons-material/Router';
import DevicesOtherIcon from '@mui/icons-material/DevicesOther';
import WifiIcon from '@mui/icons-material/Wifi';
import LanIcon from '@mui/icons-material/Lan';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import ListAltIcon from '@mui/icons-material/ListAlt';
import TerminalIcon from '@mui/icons-material/Terminal';
import UpdateIcon from '@mui/icons-material/Update';
import PeopleIcon from '@mui/icons-material/People';
import LockIcon from '@mui/icons-material/Lock';
import DescriptionIcon from '@mui/icons-material/Description';

export const ICON_REGISTRY: Record<string, React.ElementType> = {
  Dashboard: DashboardIcon,
  Security: SecurityIcon,
  SwapHoriz: SwapHorizIcon,
  SettingsEthernet: SettingsEthernetIcon,
  VpnKey: VpnKeyIcon,
  Dns: DnsIcon,
  Settings: SettingsIcon,
  MonitorHeart: MonitorHeartIcon,
  Analytics: AnalyticsIcon,
  Storage: StorageIcon,
  Router: RouterIcon,
  DevicesOther: DevicesOtherIcon,
  Wifi: WifiIcon,
  Lan: LanIcon,
  AccountTree: AccountTreeIcon,
  ListAlt: ListAltIcon,
  Terminal: TerminalIcon,
  Update: UpdateIcon,
  People: PeopleIcon,
  Lock: LockIcon,
  Description: DescriptionIcon,
};

export function getIcon(
  name: string | undefined,
  fallback: React.ElementType,
): React.ElementType {
  if (!name) return fallback;
  return ICON_REGISTRY[name] ?? fallback;
}
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
import LabelIcon from '@mui/icons-material/Label';
import ScheduleIcon from '@mui/icons-material/Schedule';
import CallMadeIcon from '@mui/icons-material/CallMade';
import CallReceivedIcon from '@mui/icons-material/CallReceived';
import SwapCallsIcon from '@mui/icons-material/SwapCalls';
import HubIcon from '@mui/icons-material/Hub';
import VpnLockIcon from '@mui/icons-material/VpnLock';
import ShieldIcon from '@mui/icons-material/Shield';
import AssignmentIcon from '@mui/icons-material/Assignment';
import EditAttributesIcon from '@mui/icons-material/EditAttributes';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import TimerIcon from '@mui/icons-material/Timer';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import SystemUpdateIcon from '@mui/icons-material/SystemUpdate';
import BugReportIcon from '@mui/icons-material/BugReport';
import CodeIcon from '@mui/icons-material/Code';
import TuneIcon from '@mui/icons-material/Tune';
import InventoryIcon from '@mui/icons-material/Inventory';
import BuildIcon from '@mui/icons-material/Build';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import ReceiptIcon from '@mui/icons-material/Receipt';
import TableChartIcon from '@mui/icons-material/TableChart';
import CellTowerIcon from '@mui/icons-material/CellTower';

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
  Label: LabelIcon,
  Schedule: ScheduleIcon,
  CallMade: CallMadeIcon,
  CallReceived: CallReceivedIcon,
  SwapCalls: SwapCallsIcon,
  Hub: HubIcon,
  VpnLock: VpnLockIcon,
  Shield: ShieldIcon,
  Assignment: AssignmentIcon,
  EditAttributes: EditAttributesIcon,
  AccessTime: AccessTimeIcon,
  Timer: TimerIcon,
  VerifiedUser: VerifiedUserIcon,
  SystemUpdate: SystemUpdateIcon,
  BugReport: BugReportIcon,
  Code: CodeIcon,
  Tune: TuneIcon,
  Inventory: InventoryIcon,
  Build: BuildIcon,
  ShowChart: ShowChartIcon,
  Receipt: ReceiptIcon,
  TableChart: TableChartIcon,
  CellTower: CellTowerIcon,
};

export function getIcon(
  name: string | undefined,
  fallback: React.ElementType,
): React.ElementType {
  if (!name) return fallback;
  return ICON_REGISTRY[name] ?? fallback;
}
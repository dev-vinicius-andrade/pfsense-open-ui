import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
import { ProtectedRoute } from '@/auth/ProtectedRoute';
import { LoginPage } from '@/pages/LoginPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { MonitoringPage } from '@/pages/monitoring/MonitoringPage';
import { SystemPage } from '@/pages/system/SystemPage';
import { VpnDashboardPage } from '@/pages/vpn/VpnDashboardPage';
import { ServicesPage } from '@/pages/services/ServicesPage';
import { InterfacesPage } from '@/pages/interfaces/InterfacesPage';
import { InterfaceConfigPage } from '@/pages/interfaces/InterfaceConfigPage';
import { GreTunnelsPage } from '@/pages/interfaces/GreTunnelsPage';
import { LaggPage } from '@/pages/interfaces/LaggPage';
import { InterfaceGroupsPage } from '@/pages/interfaces/InterfaceGroupsPage';
import { VirtualIpsPage } from '@/pages/interfaces/VirtualIpsPage';
import { NatPage } from '@/pages/nat/NatPage';
import { FirewallRulesPage } from '@/pages/firewall/FirewallRulesPage';
import { AliasesPage } from '@/pages/firewall/AliasesPage';
import { SchedulesPage } from '@/pages/firewall/SchedulesPage';
import { FirewallAdvancedSettingsPage } from '@/pages/firewall/FirewallAdvancedSettingsPage';
import { SettingsPage } from '@/pages/settings/SettingsPage';
import { DhcpLeasesPage } from '@/pages/services/DhcpLeasesPage';
import { ArpTablePage } from '@/pages/system/ArpTablePage';

const isDemo = import.meta.env.VITE_DEMO_MODE === 'true';
const basename = isDemo ? '/pfsense-open-ui' : '/';

export const router = createBrowserRouter(
  [
    {
      path: '/login',
      element: <LoginPage />,
      handle: { breadcrumb: 'Login' },
    },
    {
      path: '/',
      element: isDemo ? <Outlet /> : <ProtectedRoute />,
      children: [
        {
          element: <AppShell />,
          handle: { breadcrumb: 'Home' },
          children: [
            {
              index: true,
              element: <Navigate to="/dashboard" replace />,
            },
            {
              path: 'dashboard',
              element: <DashboardPage />,
              handle: { breadcrumb: 'Dashboard' },
            },
            {
              path: 'firewall',
              element: <Outlet />,
              handle: { breadcrumb: 'Firewall' },
              children: [
                {
                  index: true,
                  element: <FirewallRulesPage />,
                  handle: { breadcrumb: 'Rules' },
                },
                {
                  path: 'aliases',
                  element: <AliasesPage />,
                  handle: { breadcrumb: 'Aliases' },
                },
                {
                  path: 'schedules',
                  element: <SchedulesPage />,
                  handle: { breadcrumb: 'Schedules' },
                },
                {
                  path: 'advanced',
                  element: <FirewallAdvancedSettingsPage />,
                  handle: { breadcrumb: 'Advanced Settings' },
                },
              ],
            },
            {
              path: 'nat/*',
              element: <NatPage />,
              handle: { breadcrumb: 'NAT' },
            },
            {
              path: 'interfaces',
              element: <InterfacesPage />,
              handle: { breadcrumb: 'Interfaces' },
            },
            {
              path: 'interfaces/new',
              element: <InterfaceConfigPage />,
              handle: { breadcrumb: 'Assign Interface' },
            },
            {
              path: 'interfaces/:id/edit',
              element: <InterfaceConfigPage />,
              handle: { breadcrumb: 'Edit Interface' },
            },
            {
              path: 'interfaces/gre',
              element: <GreTunnelsPage />,
              handle: { breadcrumb: 'GRE Tunnels' },
            },
            {
              path: 'interfaces/lagg',
              element: <LaggPage />,
              handle: { breadcrumb: 'LAGG' },
            },
            {
              path: 'interfaces/groups',
              element: <InterfaceGroupsPage />,
              handle: { breadcrumb: 'Interface Groups' },
            },
            {
              path: 'interfaces/vips',
              element: <VirtualIpsPage />,
              handle: { breadcrumb: 'Virtual IPs' },
            },
            {
              path: 'vpn/*',
              element: <VpnDashboardPage />,
              handle: { breadcrumb: 'VPN' },
            },
            {
              path: 'services/dhcp-leases',
              element: <DhcpLeasesPage />,
              handle: { breadcrumb: 'DHCP Leases' },
            },
            {
              path: 'services/*',
              element: <ServicesPage />,
              handle: { breadcrumb: 'Services' },
            },
            {
              path: 'system/arp-table',
              element: <ArpTablePage />,
              handle: { breadcrumb: 'ARP Table' },
            },
            {
              path: 'system/*',
              element: <SystemPage />,
              handle: { breadcrumb: 'Settings' },
            },
            {
              path: 'monitoring/*',
              element: <MonitoringPage />,
              handle: { breadcrumb: 'Monitoring' },
            },
            {
              path: 'ui-preferences',
              element: <SettingsPage />,
              handle: { breadcrumb: 'UI Preferences' },
            },
          ],
        },
      ],
    },
  ],
  { basename },
);
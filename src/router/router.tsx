import { createBrowserRouter, Navigate } from 'react-router-dom';
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
import { NatPage } from '@/pages/nat/NatPage';
import { FirewallRulesPage } from '@/pages/firewall/FirewallRulesPage';

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
    handle: { breadcrumb: 'Login' },
  },
  {
    path: '/',
    element: <ProtectedRoute />,
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
            path: 'firewall/*',
            element: <FirewallRulesPage />,
            handle: { breadcrumb: 'Firewall' },
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
            path: 'vpn/*',
            element: <VpnDashboardPage />,
            handle: { breadcrumb: 'VPN' },
          },
          {
            path: 'services/*',
            element: <ServicesPage />,
            handle: { breadcrumb: 'Services' },
          },
          {
            path: 'system/*',
            element: <SystemPage />,
            handle: { breadcrumb: 'System' },
          },
          {
            path: 'monitoring/*',
            element: <MonitoringPage />,
            handle: { breadcrumb: 'Monitoring' },
          },
        ],
      },
    ],
  },
]);
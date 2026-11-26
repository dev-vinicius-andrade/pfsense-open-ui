import { useMemo } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Maps URL path prefixes to page IDs used in the panel registry.
 * This is a static mapping — explicit is better than magic for a security-sensitive admin UI.
 */
const PATH_TO_PAGE_ID: Record<string, string> = {
  '/dashboard': 'dashboard',
  '/firewall': 'firewall',
  '/firewall/aliases': 'firewall-aliases',
  '/firewall/schedules': 'firewall-schedules',
  '/firewall/advanced': 'firewall-advanced',
  '/nat': 'nat',
  '/interfaces': 'interfaces',
  '/interfaces/gre': 'interfaces-gre',
  '/interfaces/lagg': 'interfaces-lagg',
  '/interfaces/groups': 'interfaces-groups',
  '/interfaces/vips': 'interfaces-vips',
  '/vpn': 'vpn',
  '/services': 'services',
  '/services/dhcp-leases': 'dhcp-leases',
  '/services/dhcp-static-mappings': 'dhcp-static-mappings',
  '/system': 'settings',
  '/system/arp-table': 'arp-table',
  '/monitoring': 'monitoring',
  '/ui-preferences': 'ui-preferences',
};

/**
 * Returns the current page ID based on the URL path.
 * Returns undefined if the current path doesn't match any known page.
 */
export function useCurrentPageId(): string | undefined {
  const location = useLocation();

  return useMemo(() => {
    const pathname = location.pathname;

    // Try exact match first
    if (PATH_TO_PAGE_ID[pathname]) {
      return PATH_TO_PAGE_ID[pathname];
    }

    // Try prefix match (e.g., /firewall/rules → firewall)
    // Sort by length descending so more specific paths match first
    const sortedEntries = Object.entries(PATH_TO_PAGE_ID).sort(
      ([a], [b]) => b.length - a.length,
    );

    for (const [pathPrefix, pageId] of sortedEntries) {
      if (pathname === pathPrefix || pathname.startsWith(pathPrefix + '/')) {
        return pageId;
      }
    }

    return undefined;
  }, [location.pathname]);
}
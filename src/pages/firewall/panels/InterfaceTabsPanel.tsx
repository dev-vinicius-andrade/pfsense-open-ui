import { useMemo, useCallback, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Box, IconButton, Menu, MenuItem, ListItemIcon, ListItemText, Paper, Skeleton, Tooltip } from '@mui/material';
import ViewColumnIcon from '@mui/icons-material/ViewColumn';
import TableRowsIcon from '@mui/icons-material/TableRows';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { ConfigurableTabs } from '@/components/shared/ConfigurableTabs';
import { fetchInterfaces } from '@/api/modules/interfaces';

const FLOATING_TAB_KEY = '__floating__';
const IFACE_PARAM = 'iface';

type TabOrientation = 'top' | 'bottom' | 'left' | 'right';

interface InterfaceTabsPanelProps {
  panelId: string;
}

export function InterfaceTabsPanel({ panelId }: InterfaceTabsPanelProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [orientation, setOrientation] = useState<TabOrientation>('top');
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);

  const { data: interfacesData, isLoading } = useQuery({
    queryKey: ['interfaces'],
    queryFn: fetchInterfaces,
  });

  const interfaces = interfacesData ?? [];

  const tabs = useMemo(() => {
    const result: Array<{ id: string; label: string }> = [];
    for (const iface of interfaces) {
      result.push({ id: iface.id, label: iface.descr || iface.id });
    }
    result.push({ id: FLOATING_TAB_KEY, label: 'Floating Rules' });
    return result;
  }, [interfaces]);

  const activeTabKey = useMemo(() => {
    const paramValue = searchParams.get(IFACE_PARAM);
    if (paramValue && tabs.some((t) => t.id === paramValue)) {
      return paramValue;
    }
    return tabs.length > 0 ? tabs[0].id : FLOATING_TAB_KEY;
  }, [searchParams, tabs]);

  const handleTabChange = useCallback(
    (tabId: string) => {
      setSearchParams({ [IFACE_PARAM]: tabId }, { replace: true });
    },
    [setSearchParams],
  );

  const handleMenuOpen = useCallback((e: React.MouseEvent<HTMLElement>) => {
    setMenuAnchor(e.currentTarget);
  }, []);

  const handleMenuClose = useCallback(() => {
    setMenuAnchor(null);
  }, []);

  const handleSetOrientation = useCallback((o: TabOrientation) => {
    setOrientation(o);
    setMenuAnchor(null);
  }, []);

  if (isLoading) {
    return (
      <Paper sx={{ p: 1, display: 'flex', gap: 1 }} data-panel-id={panelId}>
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} width={80} height={36} />
        ))}
      </Paper>
    );
  }

  return (
    <Paper sx={{ overflow: 'hidden', position: 'relative' }} data-panel-id={panelId}>
      {/* Orientation toggle button */}
      <Box sx={{ position: 'absolute', top: 4, right: 4, zIndex: 2 }}>
        <Tooltip title="Tab orientation">
          <IconButton size="small" onClick={handleMenuOpen} aria-label="tab orientation">
            <MoreVertIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={handleMenuClose}>
          <MenuItem onClick={() => handleSetOrientation('top')} selected={orientation === 'top'}>
            <ListItemIcon><TableRowsIcon fontSize="small" /></ListItemIcon>
            <ListItemText primary="Horizontal (Top)" />
          </MenuItem>
          <MenuItem onClick={() => handleSetOrientation('bottom')} selected={orientation === 'bottom'}>
            <ListItemIcon><TableRowsIcon fontSize="small" /></ListItemIcon>
            <ListItemText primary="Horizontal (Bottom)" />
          </MenuItem>
          <MenuItem onClick={() => handleSetOrientation('left')} selected={orientation === 'left'}>
            <ListItemIcon><ViewColumnIcon fontSize="small" /></ListItemIcon>
            <ListItemText primary="Vertical (Left)" />
          </MenuItem>
          <MenuItem onClick={() => handleSetOrientation('right')} selected={orientation === 'right'}>
            <ListItemIcon><ViewColumnIcon fontSize="small" /></ListItemIcon>
            <ListItemText primary="Vertical (Right)" />
          </MenuItem>
        </Menu>
      </Box>

      <ConfigurableTabs
        tabs={tabs}
        activeTab={activeTabKey}
        onTabChange={handleTabChange}
        orientation={orientation}
        ariaLabel="Firewall rules by interface"
      >
        {/* Content area intentionally empty — tabs are navigation only in this panel */}
        <></>
      </ConfigurableTabs>
    </Paper>
  );
}
import { useState, useCallback } from 'react';
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  FormControlLabel,
  Grid,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Paper,
  Radio,
  RadioGroup,
  Slider,
  Switch,
  Tab,
  Tabs,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import DeleteIcon from '@mui/icons-material/Delete';
import { PageHeader } from '@/components/shared/PageHeader';
import { useConfigStore } from '@/stores/configStore';
import { colorSchemes } from '@/theme/schemes';
import { DEFAULT_NAV_ITEMS } from '@/components/layout/navConfig';
import { PAGE_REGISTRY, getPagesByCategory, getPageById } from '@/components/layout/pageRegistry';
import { ThemePreviewCard } from './ThemePreviewCard';
import { WidgetBuilderTab } from './WidgetBuilderTab';
import type { AppConfig } from '@/config/schema';

const THEME_MODES = ['light', 'dark', 'auto'] as const;

const LAYOUT_PRESETS: { value: AppConfig['layout']['preset']; label: string; description: string }[] = [
  { value: 'enterprise', label: 'Enterprise', description: 'Dense sidebar, compact tables, data-focused' },
  { value: 'relaxed', label: 'Relaxed', description: 'Full sidebar, spacious cards, comfortable reading' },
  { value: 'custom', label: 'Custom', description: 'Configure your own layout parameters' },
];

const CATEGORY_LABELS: Record<string, string> = {
  dashboard: 'Dashboard',
  firewall: 'Firewall',
  nat: 'NAT',
  interfaces: 'Interfaces',
  vpn: 'VPN',
  services: 'Services',
  system: 'System',
  monitoring: 'Monitoring',
  settings: 'Settings',
};

interface TabPanelProps {
  children: React.ReactNode;
  value: number;
  index: number;
}

function TabPanel({ children, value, index }: TabPanelProps) {
  if (value !== index) return null;
  return (
    <Box role="tabpanel" aria-labelledby={`settings-tab-${index}`} sx={{ py: 3 }}>
      {children}
    </Box>
  );
}

export function SettingsPage() {
  const config = useConfigStore((s) => s.config);
  const updateTheme = useConfigStore((s) => s.updateTheme);
  const updateLayout = useConfigStore((s) => s.updateLayout);
  const updateMenu = useConfigStore((s) => s.updateMenu);
  const resetToDefaults = useConfigStore((s) => s.resetToDefaults);

  const [activeTab, setActiveTab] = useState(0);
  const [resetDialogOpen, setResetDialogOpen] = useState(false);

  const handleSchemeSelect = useCallback(
    (scheme: string) => {
      updateTheme({ scheme });
    },
    [updateTheme],
  );

  const handleModeChange = useCallback(
    (_: React.MouseEvent<HTMLElement>, mode: string | null) => {
      if (mode && THEME_MODES.includes(mode as (typeof THEME_MODES)[number])) {
        updateTheme({ mode: mode as AppConfig['theme']['mode'] });
      }
    },
    [updateTheme],
  );

  const handleFontScaleChange = useCallback(
    (_: Event, value: number | number[]) => {
      updateLayout({ fontScale: value as number });
    },
    [updateLayout],
  );

  const handlePresetChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      updateLayout({ preset: event.target.value as AppConfig['layout']['preset'] });
    },
    [updateLayout],
  );

  const handleSidebarWidthChange = useCallback(
    (_: Event, value: number | number[]) => {
      updateLayout({ sidebarWidth: value as number });
    },
    [updateLayout],
  );

  const handleDensityChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      updateLayout({ density: event.target.value as 'compact' | 'comfortable' });
    },
    [updateLayout],
  );

  const handleToggleHidden = useCallback(
    (id: string) => {
      const hidden = config.menu.hidden ?? [];
      const next = hidden.includes(id) ? hidden.filter((h) => h !== id) : [...hidden, id];
      updateMenu({ hidden: next });
    },
    [config.menu.hidden, updateMenu],
  );

  const handleToggleFavorite = useCallback(
    (id: string) => {
      const favorites = config.menu.favorites ?? [];
      const next = favorites.includes(id) ? favorites.filter((f) => f !== id) : [...favorites, id];
      updateMenu({ favorites: next });
    },
    [config.menu.favorites, updateMenu],
  );

  const handleCustomLabelChange = useCallback(
    (id: string, label: string) => {
      const customLabels = { ...(config.menu.customLabels ?? {}) };
      if (label.trim()) {
        customLabels[id] = label;
      } else {
        delete customLabels[id];
      }
      updateMenu({ customLabels });
    },
    [config.menu.customLabels, updateMenu],
  );

  const handleMoveNavItem = useCallback(
    (index: number, direction: -1 | 1) => {
      const currentOrder = config.menu.order ?? DEFAULT_NAV_ITEMS.map((n) => n.id);
      const targetIndex = index + direction;
      if (targetIndex < 0 || targetIndex >= currentOrder.length) return;
      const next = [...currentOrder];
      [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
      updateMenu({ order: next });
    },
    [config.menu.order, updateMenu],
  );

  const handleToggleCustomItem = useCallback(
    (pageId: string) => {
      const customItems = config.menu.customItems ?? [];
      const exists = customItems.some((item) => item.id === pageId);
      const next = exists
        ? customItems.filter((item) => item.id !== pageId)
        : [...customItems, { id: pageId }];
      updateMenu({ customItems: next });
    },
    [config.menu.customItems, updateMenu],
  );

  const handleCustomItemLabelChange = useCallback(
    (pageId: string, label: string) => {
      const customItems = (config.menu.customItems ?? []).map((item) => {
        if (item.id !== pageId) return item;
        return label.trim() ? { ...item, label: label.trim() } : { id: item.id };
      });
      updateMenu({ customItems });
    },
    [config.menu.customItems, updateMenu],
  );

  const handleRemoveCustomItem = useCallback(
    (pageId: string) => {
      const customItems = (config.menu.customItems ?? []).filter((item) => item.id !== pageId);
      updateMenu({ customItems });
    },
    [config.menu.customItems, updateMenu],
  );

  const handleWidgetVisibility = useCallback(
    (widgetId: string, visible: boolean) => {
      const widgets = [...(config.dashboard.widgets ?? [])];
      const existingIndex = widgets.findIndex((w) => w.id === widgetId);
      if (existingIndex >= 0) {
        widgets[existingIndex] = { ...widgets[existingIndex], visible };
      } else {
        widgets.push({ id: widgetId, visible, order: widgets.length });
      }
      updateMenu({}); // trigger re-render via store; actual update below
      useConfigStore.setState((state) => ({
        config: { ...state.config, dashboard: { ...state.config.dashboard, widgets } },
      }));
    },
    [config.dashboard.widgets],
  );

  const handleMoveWidget = useCallback(
    (index: number, direction: -1 | 1) => {
      const widgets = [...(config.dashboard.widgets ?? [])];
      const targetIndex = index + direction;
      if (targetIndex < 0 || targetIndex >= widgets.length) return;
      [widgets[index], widgets[targetIndex]] = [widgets[targetIndex], widgets[index]];
      const reordered = widgets.map((w, i) => ({ ...w, order: i }));
      useConfigStore.setState((state) => ({
        config: { ...state.config, dashboard: { ...state.config.dashboard, widgets: reordered } },
      }));
    },
    [config.dashboard.widgets],
  );

  const navOrder = config.menu.order ?? DEFAULT_NAV_ITEMS.map((n) => n.id);
  const hiddenItems = config.menu.hidden ?? [];
  const favoriteItems = config.menu.favorites ?? [];
  const customLabels = config.menu.customLabels ?? {};
  const customItems = config.menu.customItems ?? [];
  const customItemIdSet = new Set(customItems.map((item) => item.id));
  const customItemMap = new Map(customItems.map((item) => [item.id, item]));

  const pagesByCategory = getPagesByCategory();

  const defaultWidgets = [
    { id: 'system-status', label: 'System Status' },
    { id: 'gateway-status', label: 'Gateway Status' },
    { id: 'interface-traffic', label: 'Interface Traffic' },
    { id: 'service-status', label: 'Service Status' },
    { id: 'cpu-memory', label: 'CPU & Memory' },
    { id: 'disk-usage', label: 'Disk Usage' },
  ];
  const dashboardWidgets = config.dashboard.widgets ?? defaultWidgets.map((w, i) => ({ ...w, visible: true, order: i }));

  // All page IDs available for favorites (top-level + sub-pages)
  const allFavoritablePages = PAGE_REGISTRY;

  return (
    <Box sx={{ maxWidth: 960, mx: 'auto' }}>
      <PageHeader title="Settings" />

      <Paper sx={{ mt: 2, p: 3 }}>
        <Tabs
          value={activeTab}
          onChange={(_, v) => setActiveTab(v)}
          variant="scrollable"
          scrollButtons="auto"
          aria-label="Settings sections"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label="Appearance" id="settings-tab-0" aria-controls="settings-tabpanel-0" />
          <Tab label="Layout" id="settings-tab-1" aria-controls="settings-tabpanel-1" />
          <Tab label="Navigation" id="settings-tab-2" aria-controls="settings-tabpanel-2" />
          <Tab label="Dashboard" id="settings-tab-3" aria-controls="settings-tabpanel-3" />
          <Tab label="Custom Widgets" id="settings-tab-4" aria-controls="settings-tabpanel-4" />
        </Tabs>

        {/* Appearance Tab */}
        <TabPanel value={activeTab} index={0}>
          <Typography variant="h6" gutterBottom>Color Scheme</Typography>
          <Grid container spacing={2} sx={{ mb: 4 }}>
            {Object.entries(colorSchemes).map(([key, scheme]) => (
              <Grid size={{ xs: 12, sm: 6, md: 4 }} key={key}>
                <ThemePreviewCard
                  name={scheme.name}
                  schemeName={key}
                  isSelected={config.theme.scheme === key}
                  onSelect={() => handleSchemeSelect(key)}
                />
              </Grid>
            ))}
          </Grid>

          <Divider sx={{ my: 3 }} />

          <Typography variant="h6" gutterBottom>Theme Mode</Typography>
          <ToggleButtonGroup
            value={config.theme.mode}
            exclusive
            onChange={handleModeChange}
            aria-label="Theme mode"
            sx={{ mb: 4 }}
          >
            <ToggleButton value="light" aria-label="Light mode">Light</ToggleButton>
            <ToggleButton value="dark" aria-label="Dark mode">Dark</ToggleButton>
            <ToggleButton value="auto" aria-label="Auto mode">Auto</ToggleButton>
          </ToggleButtonGroup>

          <Divider sx={{ my: 3 }} />

          <Typography variant="h6" gutterBottom>Font Scale</Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, maxWidth: 400 }}>
            <Slider
              value={config.layout.fontScale ?? 1.0}
              min={0.8}
              max={1.4}
              step={0.1}
              onChange={handleFontScaleChange}
              valueLabelDisplay="on"
              aria-label="Font scale"
            />
            <Typography variant="body2" color="text.secondary" sx={{ minWidth: 40 }}>
              {((config.layout.fontScale ?? 1.0) * 100).toFixed(0)}%
            </Typography>
          </Box>
        </TabPanel>

        {/* Layout Tab */}
        <TabPanel value={activeTab} index={1}>
          <Typography variant="h6" gutterBottom>Layout Preset</Typography>
          <RadioGroup value={config.layout.preset} onChange={handlePresetChange} sx={{ mb: 3 }}>
            {LAYOUT_PRESETS.map((preset) => (
              <FormControlLabel
                key={preset.value}
                value={preset.value}
                control={<Radio />}
                label={
                  <Box>
                    <Typography variant="subtitle2">{preset.label}</Typography>
                    <Typography variant="caption" color="text.secondary">{preset.description}</Typography>
                  </Box>
                }
                sx={{ alignItems: 'flex-start', mb: 1 }}
              />
            ))}
          </RadioGroup>

          {config.layout.preset === 'custom' && (
            <Box sx={{ pl: 4, pt: 2 }}>
              <Divider sx={{ mb: 3 }} />
              <Typography variant="subtitle2" gutterBottom>Sidebar Width</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, maxWidth: 400, mb: 3 }}>
                <Slider
                  value={config.layout.sidebarWidth ?? 260}
                  min={200}
                  max={400}
                  step={10}
                  onChange={handleSidebarWidthChange}
                  valueLabelDisplay="on"
                  aria-label="Sidebar width"
                />
                <Typography variant="body2" color="text.secondary" sx={{ minWidth: 50 }}>
                  {config.layout.sidebarWidth ?? 260}px
                </Typography>
              </Box>

              <Typography variant="subtitle2" gutterBottom>Density</Typography>
              <RadioGroup
                row
                value={config.layout.density ?? 'comfortable'}
                onChange={handleDensityChange}
              >
                <FormControlLabel value="compact" control={<Radio />} label="Compact" />
                <FormControlLabel value="comfortable" control={<Radio />} label="Comfortable" />
              </RadioGroup>
            </Box>
          )}
        </TabPanel>

        {/* Navigation Tab */}
        <TabPanel value={activeTab} index={2}>
          <Typography variant="h6" gutterBottom>Menu Order</Typography>
          <List dense sx={{ mb: 4, maxWidth: 500 }}>
            {navOrder.map((id, index) => {
              const navItem = DEFAULT_NAV_ITEMS.find((n) => n.id === id);
              if (!navItem) return null;
              return (
                <ListItem
                  key={id}
                  secondaryAction={
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      <IconButton
                        size="small"
                        onClick={() => handleMoveNavItem(index, -1)}
                        disabled={index === 0}
                        aria-label={`Move ${navItem.label} up`}
                      >
                        <ArrowUpwardIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleMoveNavItem(index, 1)}
                        disabled={index === navOrder.length - 1}
                        aria-label={`Move ${navItem.label} down`}
                      >
                        <ArrowDownwardIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  }
                >
                  <ListItemIcon sx={{ minWidth: 32 }}>
                    <DragIndicatorIcon fontSize="small" color="disabled" />
                  </ListItemIcon>
                  <ListItemText primary={customLabels[id] || navItem.label} />
                </ListItem>
              );
            })}
          </List>

          <Divider sx={{ my: 3 }} />

          {/* Pin Pages to Sidebar */}
          <Typography variant="h6" gutterBottom>Pin Pages to Sidebar</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Add specific pages directly to the sidebar for quick access. Pinned pages appear in a separate section above the main navigation.
          </Typography>

          {/* Currently pinned items */}
          {customItems.length > 0 && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>Currently Pinned</Typography>
              <List dense sx={{ maxWidth: 600 }}>
                {customItems.map((item) => {
                  const pageEntry = getPageById(item.id);
                  return (
                    <ListItem
                      key={item.id}
                      secondaryAction={
                        <IconButton
                          edge="end"
                          size="small"
                          onClick={() => handleRemoveCustomItem(item.id)}
                          aria-label={`Remove ${pageEntry?.label ?? item.id}`}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      }
                    >
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <span>{item.label ?? pageEntry?.label ?? item.id}</span>
                            <Chip
                              label={CATEGORY_LABELS[pageEntry?.category ?? ''] ?? pageEntry?.category ?? ''}
                              size="small"
                              variant="outlined"
                              sx={{ height: 20, fontSize: '0.7rem' }}
                            />
                          </Box>
                        }
                      />
                    </ListItem>
                  );
                })}
              </List>
            </Box>
          )}

          {/* Available pages grouped by category */}
          <Box sx={{ maxHeight: 500, overflowY: 'auto', pr: 1 }}>
            {Array.from(pagesByCategory.entries()).map(([category, pages]) => (
              <Box key={category} sx={{ mb: 2 }}>
                <Typography variant="subtitle2" sx={{ mb: 0.5, color: 'text.secondary' }}>
                  {CATEGORY_LABELS[category] ?? category}
                </Typography>
                <List dense disablePadding>
                  {pages.map((page) => {
                    const isPinned = customItemIdSet.has(page.id);
                    const customItem = customItemMap.get(page.id);
                    return (
                      <ListItem key={page.id} disablePadding sx={{ pl: 1 }}>
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={isPinned}
                              onChange={() => handleToggleCustomItem(page.id)}
                              size="small"
                            />
                          }
                          label={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <span>{page.label}</span>
                              {!page.isTopLevel && (
                                <Chip
                                  label="Sub-page"
                                  size="small"
                                  variant="outlined"
                                  sx={{ height: 18, fontSize: '0.65rem' }}
                                />
                              )}
                            </Box>
                          }
                          sx={{ mr: 0 }}
                        />
                        {isPinned && (
                          <TextField
                            size="small"
                            placeholder="Override label"
                            value={customItem?.label ?? ''}
                            onChange={(e) => handleCustomItemLabelChange(page.id, e.target.value)}
                            sx={{ ml: 2, width: 160 }}
                            slotProps={{ input: { 'aria-label': `Override label for ${page.label}` } }}
                          />
                        )}
                      </ListItem>
                    );
                  })}
                </List>
              </Box>
            ))}
          </Box>

          <Divider sx={{ my: 3 }} />

          <Grid container spacing={4}>
            <Grid size={{ xs: 12, md: 6 }}>
              <Typography variant="h6" gutterBottom>Hidden Sections</Typography>
              <List dense>
                {DEFAULT_NAV_ITEMS.map((item) => (
                  <ListItem key={item.id} disablePadding>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={hiddenItems.includes(item.id)}
                          onChange={() => handleToggleHidden(item.id)}
                          size="small"
                        />
                      }
                      label={item.label}
                    />
                  </ListItem>
                ))}
              </List>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Typography variant="h6" gutterBottom>Favorites</Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                Pin items to the quick-access area at the top of the sidebar. Includes all pages.
              </Typography>
              <Box sx={{ maxHeight: 400, overflowY: 'auto', pr: 1 }}>
                <List dense>
                  {allFavoritablePages.map((page) => (
                    <ListItem key={page.id} disablePadding>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={favoriteItems.includes(page.id)}
                            onChange={() => handleToggleFavorite(page.id)}
                            size="small"
                          />
                        }
                        label={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <span>{page.label}</span>
                            {!page.isTopLevel && (
                              <Chip
                                label={CATEGORY_LABELS[page.category] ?? page.category}
                                size="small"
                                variant="outlined"
                                sx={{ height: 18, fontSize: '0.65rem' }}
                              />
                            )}
                          </Box>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              </Box>
            </Grid>
          </Grid>

          <Divider sx={{ my: 3 }} />

          <Typography variant="h6" gutterBottom>Custom Labels</Typography>
          <Grid container spacing={2} sx={{ maxWidth: 600 }}>
            {DEFAULT_NAV_ITEMS.map((item) => (
              <Grid size={{ xs: 12, sm: 6 }} key={item.id}>
                <TextField
                  fullWidth
                  size="small"
                  label={item.label}
                  value={customLabels[item.id] ?? ''}
                  onChange={(e) => handleCustomLabelChange(item.id, e.target.value)}
                  placeholder={item.label}
                />
              </Grid>
            ))}
          </Grid>
        </TabPanel>

        {/* Dashboard Tab */}
        <TabPanel value={activeTab} index={3}>
          <Typography variant="h6" gutterBottom>Widget Visibility & Order</Typography>
          <List dense sx={{ maxWidth: 500 }}>
            {dashboardWidgets
              .sort((a, b) => a.order - b.order)
              .map((widget, index) => {
                const def = defaultWidgets.find((d) => d.id === widget.id);
                return (
                  <ListItem
                    key={widget.id}
                    secondaryAction={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <IconButton
                          size="small"
                          onClick={() => handleMoveWidget(index, -1)}
                          disabled={index === 0}
                          aria-label={`Move ${def?.label ?? widget.id} up`}
                        >
                          <ArrowUpwardIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleMoveWidget(index, 1)}
                          disabled={index === dashboardWidgets.length - 1}
                          aria-label={`Move ${def?.label ?? widget.id} down`}
                        >
                          <ArrowDownwardIcon fontSize="small" />
                        </IconButton>
                        <Switch
                          checked={widget.visible}
                          onChange={(e) => handleWidgetVisibility(widget.id, e.target.checked)}
                          size="small"
                          aria-label={`Toggle ${def?.label ?? widget.id} visibility`}
                        />
                      </Box>
                    }
                  >
                    <ListItemIcon sx={{ minWidth: 32 }}>
                      <DragIndicatorIcon fontSize="small" color="disabled" />
                    </ListItemIcon>
                    <ListItemText primary={def?.label ?? widget.id} />
                  </ListItem>
                );
              })}
          </List>
        </TabPanel>

        {/* Custom Widgets Tab */}
        <TabPanel value={activeTab} index={4}>
          <WidgetBuilderTab />
        </TabPanel>
      </Paper>

      {/* Bottom Actions Bar */}
      <Box sx={{ mt: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Alert severity="info" variant="outlined">
          Changes are saved automatically to your browser session. Edit config.toml on your pfSense appliance for permanent changes.
        </Alert>
        <Box>
          <Button
            variant="outlined"
            color="warning"
            onClick={() => setResetDialogOpen(true)}
          >
            Reset to Defaults
          </Button>
        </Box>
      </Box>

      {/* Reset Confirmation Dialog */}
      <Dialog open={resetDialogOpen} onClose={() => setResetDialogOpen(false)}>
        <DialogTitle>Reset to Defaults?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            This will restore all settings to their original values. Your current customizations will be lost.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setResetDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={() => {
              resetToDefaults();
              setResetDialogOpen(false);
            }}
            color="warning"
            variant="contained"
          >
            Reset
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
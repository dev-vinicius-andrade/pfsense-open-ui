import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  TextField,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Box,
  InputAdornment,
  Divider,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import * as MuiIcons from '@mui/icons-material';
import { PAGE_REGISTRY, type PageEntry } from '@/components/layout/pageRegistry';

interface SearchItem {
  id: string;
  label: string;
  path: string;
  icon: string;
  category: string;
  description: string;
}

const RECENT_SEARCHES_KEY = 'pfsense-recent-searches';
const MAX_RECENT = 5;
const MAX_RESULTS = 10;
const DEBOUNCE_MS = 150;

const SETTINGS_ITEMS: SearchItem[] = [
  { id: 'pref-color-scheme', label: 'Color Scheme', path: '/ui-preferences?tab=appearance', icon: 'Palette', category: 'UI Preferences', description: 'Change the color scheme' },
  { id: 'pref-theme-mode', label: 'Theme Mode', path: '/ui-preferences?tab=appearance', icon: 'Brightness4', category: 'UI Preferences', description: 'Switch between light and dark mode' },
  { id: 'pref-font-scale', label: 'Font Scale', path: '/ui-preferences?tab=appearance', icon: 'TextFields', category: 'UI Preferences', description: 'Adjust font size scaling' },
  { id: 'pref-layout-preset', label: 'Layout Preset', path: '/ui-preferences?tab=layout', icon: 'ViewQuilt', category: 'UI Preferences', description: 'Choose a layout preset' },
  { id: 'pref-menu-order', label: 'Menu Order', path: '/ui-preferences?tab=navigation', icon: 'DragHandle', category: 'UI Preferences', description: 'Customize sidebar menu order' },
  { id: 'pref-custom-widgets', label: 'Custom Widgets', path: '/ui-preferences?tab=widgets', icon: 'Widgets', category: 'UI Preferences', description: 'Configure dashboard widgets' },
];

function buildSearchIndex(): SearchItem[] {
  const pageItems: SearchItem[] = PAGE_REGISTRY.map((entry: PageEntry) => ({
    id: entry.id,
    label: entry.label,
    path: entry.path,
    icon: entry.icon,
    category: entry.category,
    description: entry.isTopLevel ? entry.category : `${entry.category} > ${entry.label}`,
  }));

  return [...pageItems, ...SETTINGS_ITEMS];
}

const SEARCH_INDEX = buildSearchIndex();

function getRecentSearches(): SearchItem[] {
  try {
    const raw = sessionStorage.getItem(RECENT_SEARCHES_KEY);
    if (!raw) return [];
    const ids: string[] = JSON.parse(raw);
    return ids
      .map((id) => SEARCH_INDEX.find((item) => item.id === id))
      .filter((item): item is SearchItem => item !== undefined);
  } catch {
    return [];
  }
}

function addRecentSearch(id: string): void {
  try {
    const raw = sessionStorage.getItem(RECENT_SEARCHES_KEY);
    const ids: string[] = raw ? JSON.parse(raw) : [];
    const filtered = ids.filter((existing) => existing !== id);
    filtered.unshift(id);
    sessionStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(filtered.slice(0, MAX_RECENT)));
  } catch {
    // sessionStorage may be unavailable
  }
}

function filterItems(query: string): SearchItem[] {
  if (!query.trim()) return [];
  const lower = query.toLowerCase().trim();
  return SEARCH_INDEX.filter(
    (item) =>
      item.label.toLowerCase().includes(lower) ||
      item.category.toLowerCase().includes(lower) ||
      item.description.toLowerCase().includes(lower),
  ).slice(0, MAX_RESULTS);
}

function resolveIcon(iconName: string): React.ReactNode {
  const IconComponent = (MuiIcons as Record<string, React.ComponentType<{ fontSize?: string }>>)[iconName];
  if (IconComponent) {
    return <IconComponent fontSize="small" />;
  }
  return <SearchIcon fontSize="small" />;
}

interface SearchPaletteProps {
  open: boolean;
  onClose: () => void;
}

export function SearchPalette({ open, onClose }: SearchPaletteProps) {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  // Debounce the query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [query]);

  // Reset state when palette opens
  useEffect(() => {
    if (open) {
      setQuery('');
      setDebouncedQuery('');
      setActiveIndex(0);
      // Focus after dialog transition
      requestAnimationFrame(() => {
        inputRef.current?.focus();
      });
    }
  }, [open]);

  const results = useMemo(() => filterItems(debouncedQuery), [debouncedQuery]);
  const recentSearches = useMemo(() => getRecentSearches(), [open]);

  const displayItems = debouncedQuery.trim() ? results : recentSearches;

  // Keep active index in bounds
  useEffect(() => {
    setActiveIndex(0);
  }, [displayItems.length]);

  const handleSelect = useCallback(
    (item: SearchItem) => {
      addRecentSearch(item.id);
      navigate(item.path);
      onClose();
    },
    [navigate, onClose],
  );

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault();
          setActiveIndex((prev) => Math.min(prev + 1, displayItems.length - 1));
          break;
        case 'ArrowUp':
          event.preventDefault();
          setActiveIndex((prev) => Math.max(prev - 1, 0));
          break;
        case 'Enter':
          event.preventDefault();
          if (displayItems[activeIndex]) {
            handleSelect(displayItems[activeIndex]);
          }
          break;
        case 'Escape':
          event.preventDefault();
          onClose();
          break;
      }
    },
    [displayItems, activeIndex, handleSelect, onClose],
  );

  // Scroll active item into view
  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const activeElement = list.children[activeIndex] as HTMLElement | undefined;
    activeElement?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex]);

  const isMac = typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform);
  const shortcutLabel = isMac ? '⌘K' : 'Ctrl+K';

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      slotProps={{
        paper: {
          sx: {
            borderRadius: 2,
            overflow: 'hidden',
            maxHeight: '70vh',
          },
        },
      }}
      aria-labelledby="search-palette-title"
    >
      <DialogContent sx={{ p: 0 }}>
        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
          <TextField
            inputRef={inputRef}
            fullWidth
            placeholder={`Search pages, settings... (${shortcutLabel})`}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            autoFocus
            variant="outlined"
            size="small"
            id="search-palette-title"
            role="combobox"
            aria-expanded={displayItems.length > 0}
            aria-controls="search-results-list"
            aria-activedescendant={
              displayItems[activeIndex] ? `search-result-${displayItems[activeIndex].id}` : undefined
            }
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon color="action" />
                  </InputAdornment>
                ),
              },
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                bgcolor: 'action.hover',
              },
            }}
          />
        </Box>

        <Box sx={{ maxHeight: '50vh', overflowY: 'auto' }}>
          {displayItems.length === 0 && debouncedQuery.trim() && (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                No results found for &quot;{debouncedQuery}&quot;
              </Typography>
            </Box>
          )}

          {displayItems.length === 0 && !debouncedQuery.trim() && recentSearches.length === 0 && (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                Type to search pages and settings
              </Typography>
            </Box>
          )}

          {!debouncedQuery.trim() && recentSearches.length > 0 && (
            <Box sx={{ px: 2, pt: 1 }}>
              <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 1 }}>
                Recent
              </Typography>
            </Box>
          )}

          {displayItems.length > 0 && (
            <List
              ref={listRef}
              id="search-results-list"
              role="listbox"
              dense
              disablePadding
              sx={{ py: 0.5 }}
            >
              {displayItems.map((item, index) => (
                <ListItemButton
                  key={item.id}
                  id={`search-result-${item.id}`}
                  role="option"
                  aria-selected={index === activeIndex}
                  selected={index === activeIndex}
                  onClick={() => handleSelect(item)}
                  onMouseEnter={() => setActiveIndex(index)}
                  sx={{
                    mx: 1,
                    borderRadius: 1,
                    py: 1,
                    '&.Mui-selected': {
                      bgcolor: 'action.selected',
                    },
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    {resolveIcon(item.icon)}
                  </ListItemIcon>
                  <ListItemText
                    primary={item.label}
                    secondary={item.description}
                    slotProps={{
                      primary: { variant: 'body2', sx: { fontWeight: 500 } },
                      secondary: { variant: 'caption', color: 'text.secondary' },
                    }}
                  />
                  {item.category !== item.description && (
                    <Typography variant="caption" color="text.disabled" sx={{ ml: 1, whiteSpace: 'nowrap' }}>
                      {item.category}
                    </Typography>
                  )}
                </ListItemButton>
              ))}
            </List>
          )}
        </Box>

        {displayItems.length > 0 && (
          <>
            <Divider />
            <Box sx={{ px: 2, py: 1, display: 'flex', gap: 2 }}>
              <Typography variant="caption" color="text.secondary">
                <kbd style={{ padding: '1px 4px', borderRadius: 3, border: '1px solid currentColor' }}>&#8593;&#8595;</kbd> navigate
              </Typography>
              <Typography variant="caption" color="text.secondary">
                <kbd style={{ padding: '1px 4px', borderRadius: 3, border: '1px solid currentColor' }}>Enter</kbd> select
              </Typography>
              <Typography variant="caption" color="text.secondary">
                <kbd style={{ padding: '1px 4px', borderRadius: 3, border: '1px solid currentColor' }}>Esc</kbd> close
              </Typography>
            </Box>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
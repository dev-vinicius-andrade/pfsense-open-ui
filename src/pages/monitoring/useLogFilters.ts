import { useState, useCallback, useEffect, useRef } from 'react';
import type { LogSource, LogSeverity } from '@/api/modules/monitoring';

export interface LogFilterState {
  source: LogSource;
  severities: LogSeverity[];
  searchText: string;
  timeRange: '5m' | '15m' | '1h' | '6h' | '24h' | 'custom';
  customStart: string;
  customEnd: string;
  action: ('pass' | 'block' | 'reject')[];
  sourceIp: string;
  destIp: string;
  port: string;
}

export interface FilterPreset {
  name: string;
  filters: LogFilterState;
}

const PRESETS_KEY = 'pfsense-log-filter-presets';
const MAX_PRESETS = 10;

const DEFAULT_FILTERS: LogFilterState = {
  source: 'firewall',
  severities: [],
  searchText: '',
  timeRange: '1h',
  customStart: '',
  customEnd: '',
  action: [],
  sourceIp: '',
  destIp: '',
  port: '',
};

function loadPresets(): FilterPreset[] {
  try {
    const raw = sessionStorage.getItem(PRESETS_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item): item is FilterPreset =>
        typeof item === 'object' &&
        item !== null &&
        'name' in item &&
        'filters' in item &&
        typeof (item as FilterPreset).name === 'string',
    );
  } catch {
    return [];
  }
}

function persistPresets(presets: FilterPreset[]): void {
  try {
    sessionStorage.setItem(PRESETS_KEY, JSON.stringify(presets));
  } catch {
    // sessionStorage may be full or unavailable
  }
}

export function useLogFilters() {
  const [filters, setFiltersState] = useState<LogFilterState>(DEFAULT_FILTERS);
  const [presets, setPresets] = useState<FilterPreset[]>(loadPresets);
  const [debouncedSearchText, setDebouncedSearchText] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const setFilter = useCallback(<K extends keyof LogFilterState>(key: K, value: LogFilterState[K]) => {
    setFiltersState((prev) => ({ ...prev, [key]: value }));
  }, []);

  const resetFilters = useCallback(() => {
    setFiltersState(DEFAULT_FILTERS);
    setDebouncedSearchText('');
  }, []);

  const setSearchText = useCallback((text: string) => {
    setFiltersState((prev) => ({ ...prev, searchText: text }));
    if (debounceRef.current !== null) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      setDebouncedSearchText(text);
    }, 300);
  }, []);

  useEffect(() => {
    return () => {
      if (debounceRef.current !== null) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  const savePreset = useCallback((name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return false;
    setPresets((prev) => {
      const filtered = prev.filter((p) => p.name !== trimmed);
      const next = [...filtered, { name: trimmed, filters: { ...filters } }];
      if (next.length > MAX_PRESETS) {
        next.shift();
      }
      persistPresets(next);
      return next;
    });
    return true;
  }, [filters]);

  const loadPreset = useCallback((name: string) => {
    const preset = presets.find((p) => p.name === name);
    if (!preset) return false;
    setFiltersState({ ...preset.filters });
    setDebouncedSearchText(preset.filters.searchText);
    return true;
  }, [presets]);

  const deletePreset = useCallback((name: string) => {
    setPresets((prev) => {
      const next = prev.filter((p) => p.name !== name);
      persistPresets(next);
      return next;
    });
  }, []);

  return {
    filters,
    debouncedSearchText,
    setFilter,
    setSearchText,
    resetFilters,
    savePreset,
    loadPreset,
    presets,
    deletePreset,
  };
}
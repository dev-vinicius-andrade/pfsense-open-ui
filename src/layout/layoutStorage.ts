import type { PageLayout, PanelDefinition } from './types';
import { runMigrations } from './migrations';
import { computeDefaultLayout } from './defaultLayouts';

const STORAGE_PREFIX = 'pfsense-layout-';

function getStorageKey(pageId: string): string {
  return `${STORAGE_PREFIX}${pageId}`;
}

export function loadPageLayout(pageId: string, panels: PanelDefinition[]): PageLayout {
  try {
    const raw = localStorage.getItem(getStorageKey(pageId));
    if (!raw) {
      return computeDefaultLayout(pageId, panels);
    }

    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const migrated = runMigrations(parsed);

    // Validate essential fields
    if (!Array.isArray(migrated.panels)) {
      console.warn(`Invalid layout data for ${pageId}, resetting to defaults`);
      return computeDefaultLayout(pageId, panels);
    }

    return migrated as unknown as PageLayout;
  } catch (error) {
    console.error(`Failed to load layout for ${pageId}:`, error);
    return computeDefaultLayout(pageId, panels);
  }
}

export function savePageLayout(layout: PageLayout): void {
  try {
    const key = getStorageKey(layout.pageId);
    const toSave = { ...layout, updatedAt: Date.now() };
    localStorage.setItem(key, JSON.stringify(toSave));
  } catch (error) {
    console.error(`Failed to save layout for ${layout.pageId}:`, error);
  }
}

export function resetPageLayout(pageId: string, panels: PanelDefinition[]): PageLayout {
  try {
    localStorage.removeItem(getStorageKey(pageId));
  } catch (error) {
    console.error(`Failed to reset layout for ${pageId}:`, error);
  }
  return computeDefaultLayout(pageId, panels);
}
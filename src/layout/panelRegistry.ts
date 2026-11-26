import type { PanelDefinition } from './types';

// Internal map: pageId → PanelDefinition[]
const registry = new Map<string, PanelDefinition[]>();

/**
 * Register panels for a page. Called by each page's panels.ts module.
 */
export function registerPanels(pageId: string, panels: PanelDefinition[]): void {
  registry.set(pageId, panels);
}

/**
 * Get all panel definitions for a specific page.
 * Returns empty array if page has no registered panels.
 */
export function getPanelsForPage(pageId: string): PanelDefinition[] {
  return registry.get(pageId) ?? [];
}

/**
 * Check if a page has registered panels (used by TopBar to show/hide Edit Layout button).
 */
export function hasRegisteredPanels(pageId: string): boolean {
  return registry.has(pageId) && (registry.get(pageId)?.length ?? 0) > 0;
}

/**
 * Get all page IDs that have registered panels.
 */
export function getAllRegisteredPageIds(): string[] {
  return Array.from(registry.keys());
}
import { useMemo } from 'react';
import { getPanelsForPage } from './panelRegistry';
import { loadPageLayout } from './layoutStorage';
import type { PanelDefinition, PanelLayout, PageLayout } from './types';

export interface ResolvedPanel {
  definition: PanelDefinition;
  layout: PanelLayout;
}

/**
 * Resolves panel definitions for a page against the stored layout.
 * Merges stored positions with panel definitions, applies defaults for new panels.
 * Returns sorted array of resolved panels (visible ones first, sorted by position).
 */
export function usePagePanels(pageId: string): {
  resolvedPanels: ResolvedPanel[];
  pageLayout: PageLayout;
  panels: PanelDefinition[];
} {
  const panels = useMemo(() => getPanelsForPage(pageId), [pageId]);

  return useMemo(() => {
    if (panels.length === 0) {
      return {
        resolvedPanels: [],
        pageLayout: {
          pageId,
          version: 1,
          columns: 12,
          rowHeight: 80,
          panels: [],
          updatedAt: Date.now(),
        },
        panels: [],
      };
    }

    const storedLayout = loadPageLayout(pageId, panels);

    // Merge: for each panel definition, find matching stored layout or use default
    const resolved: ResolvedPanel[] = panels.map((def) => {
      const stored = storedLayout.panels.find((p) => p.id === def.id);
      const layout: PanelLayout = stored ?? {
        id: def.id,
        x: def.defaultLayout.x,
        y: def.defaultLayout.y,
        w: def.defaultLayout.w,
        h: def.defaultLayout.h,
        minW: def.minWidth,
        minH: def.minHeight,
        visible: true,
      };
      return { definition: def, layout };
    });

    // Sort: visible first, then by y position, then by x position
    resolved.sort((a, b) => {
      if (a.layout.visible !== b.layout.visible) return a.layout.visible ? -1 : 1;
      if (a.layout.y !== b.layout.y) return a.layout.y - b.layout.y;
      return a.layout.x - b.layout.x;
    });

    return { resolvedPanels: resolved, pageLayout: storedLayout, panels };
  }, [pageId, panels]);
}
import { useMemo } from 'react';
import { getPanelsForPage } from './panelRegistry';
import { loadPageLayout } from './layoutStorage';
import { DEFAULT_CANVAS_WIDTH } from './canvasConstants';
import type { PanelDefinition, PanelLayout, PageLayout } from './types';

export interface ResolvedPanel {
  definition: PanelDefinition;
  layout: PanelLayout;
}

/**
 * Resolves panel definitions for a page against the stored canvas layout.
 * Merges stored positions with panel definitions, applies defaults for new panels.
 * Returns sorted array of resolved panels (visible ones first, sorted by position).
 */
export function usePagePanels(pageId: string, _version?: number): {
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
          version: 2,
          canvasWidth: DEFAULT_CANVAS_WIDTH,
          canvasHeight: 600,
          snapGridSize: 16,
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
        width: def.defaultLayout.width,
        height: def.defaultLayout.height,
        minWidth: def.minWidth,
        minHeight: def.minHeight,
        maxWidth: def.maxWidth,
        maxHeight: def.maxHeight,
        visible: true,
        ...(def.defaultStyle ?? {}),
      };

      // Clamp pixel positions to canvas bounds
      const clampedX = Math.max(layout.x, 0);
      const clampedY = Math.max(layout.y, 0);

      return {
        definition: def,
        layout: {
          ...layout,
          x: clampedX,
          y: clampedY,
          width: layout.width,
          height: Math.max(layout.height, 1),
        },
      };
    });

    // Sort: visible first, then by y position, then by x position
    resolved.sort((a, b) => {
      if (a.layout.visible !== b.layout.visible) return a.layout.visible ? -1 : 1;
      if (a.layout.y !== b.layout.y) return a.layout.y - b.layout.y;
      return a.layout.x - b.layout.x;
    });

    return { resolvedPanels: resolved, pageLayout: storedLayout, panels };
    // _version is included so the parent can force a re-read from localStorage after saves
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageId, panels, _version]);
}
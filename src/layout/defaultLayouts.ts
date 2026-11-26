import type { PanelDefinition, PageLayout } from './types';

export function computeDefaultLayout(pageId: string, panels: PanelDefinition[]): PageLayout {
  return {
    pageId,
    version: 1,
    columns: 12,
    rowHeight: 80,
    panels: panels.map((panel) => ({
      id: panel.id,
      x: panel.defaultLayout.x,
      y: panel.defaultLayout.y,
      w: panel.defaultLayout.w,
      h: panel.defaultLayout.h,
      minW: panel.minWidth,
      minH: panel.minHeight,
      visible: true,
    })),
    updatedAt: Date.now(),
  };
}
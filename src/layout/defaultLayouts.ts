import type { PanelDefinition, PanelLayout, PageLayout } from './types';
import {
  DEFAULT_PANEL_GAP,
  DEFAULT_CANVAS_WIDTH,
  DEFAULT_SNAP_GRID_SIZE,
  MIN_CANVAS_HEIGHT,
} from './canvasConstants';

export function computeDefaultLayout(pageId: string, panels: PanelDefinition[]): PageLayout {
  const GAP = DEFAULT_PANEL_GAP;
  let currentX = 0;
  let currentY = 0;
  let rowMaxHeight = 0;
  const CANVAS_WIDTH = DEFAULT_CANVAS_WIDTH;

  const panelLayouts: PanelLayout[] = panels.map((panel) => {
    const w =
      typeof panel.defaultLayout.width === 'number' ? panel.defaultLayout.width : CANVAS_WIDTH;
    const h = panel.defaultLayout.height;

    // Wrap to next row if panel doesn't fit
    if (currentX + w > CANVAS_WIDTH && currentX > 0) {
      currentX = 0;
      currentY += rowMaxHeight + GAP;
      rowMaxHeight = 0;
    }

    const layout: PanelLayout = {
      id: panel.id,
      x: panel.defaultLayout.x || currentX,
      y: panel.defaultLayout.y || currentY,
      width: panel.defaultLayout.width,
      height: panel.defaultLayout.height,
      minWidth: panel.minWidth,
      minHeight: panel.minHeight,
      maxWidth: panel.maxWidth,
      maxHeight: panel.maxHeight,
      visible: true,
    };

    currentX += w + GAP;
    rowMaxHeight = Math.max(rowMaxHeight, h);

    return layout;
  });

  return {
    pageId,
    version: 2,
    canvasWidth: CANVAS_WIDTH,
    canvasHeight: Math.max(currentY + rowMaxHeight + GAP, MIN_CANVAS_HEIGHT),
    snapGridSize: DEFAULT_SNAP_GRID_SIZE,
    panels: panelLayouts,
    updatedAt: Date.now(),
  };
}
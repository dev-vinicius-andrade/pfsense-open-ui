/**
 * Resize handle direction for canvas panels.
 */
export type ResizeHandleAxis = 'se' | 'e' | 's' | 'n' | 'w' | 'ne' | 'nw' | 'sw';

/**
 * Pixel-based panel layout for canvas positioning.
 * Replaces the old grid-unit {x, y, w, h} with continuous pixel coordinates.
 */
export interface PanelLayout {
  id: string;
  x: number; // pixels from left edge of canvas
  y: number; // pixels from top edge of canvas
  width: number | string; // pixels or percentage string (e.g. '100%') for responsive
  height: number; // pixels
  minWidth?: number; // minimum width in pixels
  minHeight?: number; // minimum height in pixels
  maxWidth?: number; // maximum width in pixels
  maxHeight?: number; // maximum height in pixels
  visible: boolean; // false = hidden from view
  zIndex?: number; // layering order for overlapping panels
  runtimeLocked?: boolean; // user-toggled lock (separate from definition.locked)
  snapToGrid?: boolean; // per-panel snap toggle (default true)
  resizeHandles?: ResizeHandleAxis[]; // allowed resize directions
  // Style overrides — user-configurable visual appearance
  bgColor?: string; // custom background color override
  borderColor?: string; // custom border color override
  borderRadius?: number; // custom border radius in px
  headerBgColor?: string; // custom header background color
  textColor?: string; // custom text color override
}

/**
 * Page-level canvas layout configuration.
 */
export interface PageLayout {
  pageId: string;
  version: number; // schema version (2 for canvas)
  canvasWidth: number; // virtual canvas width in px
  canvasHeight: number; // virtual canvas height in px (auto-grow or fixed)
  snapGridSize: number; // global snap grid size in px (default 16)
  panels: PanelLayout[];
  updatedAt: number; // epoch ms for debugging
}

/**
 * Panel definition registered by each page.
 */
export interface PanelDefinition {
  id: string;
  title: string;
  description: string;
  component: React.LazyExoticComponent<React.ComponentType<{ panelId: string }>>;
  defaultLayout: {
    x: number;
    y: number;
    width: number | string;
    height: number;
  };
  category: string;
  minWidth?: number;
  minHeight?: number;
  maxWidth?: number;
  maxHeight?: number;
  locked?: boolean; // cannot be hidden or moved
  defaultStyle?: {
    bgColor?: string;
    borderColor?: string;
    borderRadius?: number;
    headerBgColor?: string;
    textColor?: string;
  };
}
export interface PanelLayout {
  id: string; // matches PanelDefinition.id
  x: number; // grid column (0-indexed)
  y: number; // grid row (0-indexed)
  w: number; // width in grid columns
  h: number; // height in grid rows
  minW?: number; // minimum width override
  minH?: number; // minimum height override
  visible: boolean; // false = hidden from view
}

export interface PageLayout {
  pageId: string; // matches PAGE_REGISTRY entry id
  version: number; // schema version for migrations (starts at 1)
  columns: number; // grid column count (12 for desktop)
  rowHeight: number; // pixels per grid row (default: 80)
  panels: PanelLayout[];
  updatedAt: number; // epoch ms for debugging
}

export interface PanelDefinition {
  id: string;
  title: string;
  description: string;
  component: React.LazyExoticComponent<React.ComponentType<{ panelId: string }>>;
  defaultLayout: { x: number; y: number; w: number; h: number };
  category: string;
  minWidth?: number;
  minHeight?: number;
  locked?: boolean; // cannot be hidden or resized below minimum
}
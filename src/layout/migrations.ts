// Migration registry: maps version N to N+1 transform functions
export type MigrationFn = (layout: Record<string, unknown>) => Record<string, unknown>;

// Conversion constants matching old grid system
const OLD_COL_WIDTH = 100; // approximate pixels per grid column
const OLD_ROW_HEIGHT = 80; // pixels per grid row
const OLD_MARGIN_X = 16;
const OLD_MARGIN_Y = 16;

function migrateV1ToV2(layout: Record<string, unknown>): Record<string, unknown> {
  const panels = (layout.panels as Array<Record<string, unknown>>) ?? [];

  const migratedPanels = panels
    .map((panel) => {
      const w = panel.w as number | undefined;
      const h = panel.h as number | undefined;

      if (w === undefined || h === undefined) {
        return null;
      }

      return {
        ...panel,
        // Convert grid units to pixels
        x: (panel.x as number) * (OLD_COL_WIDTH + OLD_MARGIN_X),
        y: (panel.y as number) * (OLD_ROW_HEIGHT + OLD_MARGIN_Y),
        width: w * OLD_COL_WIDTH + (w - 1) * OLD_MARGIN_X,
        height: h * OLD_ROW_HEIGHT + (h - 1) * OLD_MARGIN_Y,
        // Remove old grid-specific fields
        w: undefined,
        h: undefined,
        minW: undefined,
        minH: undefined,
        maxW: undefined,
        maxH: undefined,
        // Map old fields to new names
        minWidth: panel.minW as number | undefined,
        minHeight: panel.minH as number | undefined,
        maxWidth: panel.maxW as number | undefined,
        maxHeight: panel.maxH as number | undefined,
      };
    })
    .filter(
      (p): p is NonNullable<typeof p> =>
        p !== null && p.width !== undefined && p.height !== undefined,
    );

  return {
    ...layout,
    version: 2,
    canvasWidth: 1920,
    canvasHeight: 1080,
    snapGridSize: 16,
    panels: migratedPanels,
    // Remove old grid-specific page fields
    columns: undefined,
    rowHeight: undefined,
  };
}

export const MIGRATIONS: Record<number, MigrationFn> = {
  1: migrateV1ToV2,
};

export const CURRENT_VERSION = 2;

export function runMigrations(layout: Record<string, unknown>): Record<string, unknown> {
  let current = layout;
  let version = (current.version as number) ?? 0;

  while (version < CURRENT_VERSION) {
    const migrate = MIGRATIONS[version];
    if (!migrate) {
      console.warn(`No migration found for version ${version}, resetting to defaults`);
      return current;
    }
    current = migrate(current);
    version++;
  }

  return current;
}
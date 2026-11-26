// Migration registry: maps version N to N+1 transform functions
// Initially empty — version 1 is the baseline
export type MigrationFn = (layout: Record<string, unknown>) => Record<string, unknown>;

export const MIGRATIONS: Record<number, MigrationFn> = {
  // Future migrations go here:
  // 1: (layout) => { /* transform v1 → v2 */ return layout; },
};

export const CURRENT_VERSION = 1;

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
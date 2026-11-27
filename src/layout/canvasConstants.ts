/** Default snap grid size in pixels */
export const DEFAULT_SNAP_GRID_SIZE = 16;

/** Default gap between panels in pixels */
export const DEFAULT_PANEL_GAP = 16;

/** Minimum canvas height in pixels */
export const MIN_CANVAS_HEIGHT = 600;

/** Default canvas width (matches common desktop viewport) */
export const DEFAULT_CANVAS_WIDTH = 1920;

/** Default canvas height */
export const DEFAULT_CANVAS_HEIGHT = 1080;

/** Size presets for quick panel resizing (pixel values) */
export const SIZE_PRESETS = {
  small: { width: 300, height: 240 },
  medium: { width: 480, height: 320 },
  large: { width: 720, height: 400 },
  fullWidth: { width: '100%' as const, height: 320 },
} as const;// cache-bust 1795812143
// deploy-trigger-1795815932-f8f345e

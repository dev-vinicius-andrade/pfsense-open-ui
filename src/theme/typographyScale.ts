export function applyFontScale(baseSize: number, scale: number): number {
  return Math.round(baseSize * scale * 100) / 100;
}
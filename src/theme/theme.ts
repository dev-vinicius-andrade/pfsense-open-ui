import { createTheme, type ThemeOptions } from '@mui/material/styles';
import { lightPalette, darkPalette } from './palette';
import { typography } from './typography';
import { components } from './components';
import { colorSchemes } from './schemes';
import { getLayoutOverrides, type LayoutPresetConfig } from './presets';
import { applyFontScale } from './typographyScale';

export interface LayoutOverrides {
  sidebarWidth?: number;
  density?: 'compact' | 'comfortable';
  fontScale?: number;
}

export function getTheme(
  mode: 'light' | 'dark',
  schemeName?: string,
  layoutOverrides?: LayoutOverrides,
  layoutPreset?: string,
  customLayoutOptions?: Partial<LayoutPresetConfig>,
) {
  const resolvedScheme = schemeName ?? 'default-teal';
  const scheme = colorSchemes[resolvedScheme];

  let palette;

  if (scheme) {
    const requestedVariant = mode === 'light' ? scheme.light : scheme.dark;

    if (requestedVariant) {
      palette = requestedVariant;
    } else if (mode === 'light' && scheme.dark) {
      console.warn(
        `Color scheme "${resolvedScheme}" has no light variant; falling back to dark.`,
      );
      palette = scheme.dark;
    } else if (mode === 'dark' && scheme.light) {
      console.warn(
        `Color scheme "${resolvedScheme}" has no dark variant; falling back to light.`,
      );
      palette = scheme.light;
    } else {
      console.warn(
        `Color scheme "${resolvedScheme}" has no palette for mode "${mode}"; using default-teal.`,
      );
      palette = mode === 'light' ? lightPalette : darkPalette;
    }
  } else {
    console.warn(
      `Unknown color scheme "${resolvedScheme}"; falling back to default-teal.`,
    );
    palette = mode === 'light' ? lightPalette : darkPalette;
  }

  // Resolve layout preset overrides
  const resolvedPreset = layoutPreset ?? 'relaxed';
  const layoutResult = getLayoutOverrides(resolvedPreset, customLayoutOptions);

  // Merge base components with layout preset components
  const mergedComponents = {
    ...components,
    ...layoutResult.components,
  };

  // Apply font scale from preset or legacy layoutOverrides
  const fontScale = layoutOverrides?.fontScale ?? layoutResult.spacing.fontScale ?? 1.0;
  const scaledTypography = {
    ...typography,
    fontSize: applyFontScale(14, fontScale),
  };

  const themeOptions: ThemeOptions = {
    palette,
    typography: scaledTypography,
    components: mergedComponents,
    shape: {
      borderRadius: 8,
    },
  };

  return createTheme(themeOptions);
}

export const lightTheme = getTheme('light');
export const darkTheme = getTheme('dark');
import type { Components, Theme } from '@mui/material/styles';

export interface LayoutPresetConfig {
  sidebarWidth: number;
  sidebarCollapsedWidth: number;
  cardPadding: number;
  tableCellPadding: string;
  containerMaxWidth: false | 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  fontScale: number;
  density: 'compact' | 'comfortable';
}

export const PRESETS: Record<string, LayoutPresetConfig> = {
  enterprise: {
    sidebarWidth: 240,
    sidebarCollapsedWidth: 64,
    cardPadding: 12,
    tableCellPadding: '4px 8px',
    containerMaxWidth: false,
    fontScale: 0.9,
    density: 'compact',
  },
  relaxed: {
    sidebarWidth: 260,
    sidebarCollapsedWidth: 260,
    cardPadding: 24,
    tableCellPadding: '12px 16px',
    containerMaxWidth: 'xl',
    fontScale: 1.0,
    density: 'comfortable',
  },
};

export interface LayoutOverridesResult {
  components: Partial<Components<Theme>>;
  spacing: LayoutPresetConfig;
}

export function getLayoutOverrides(
  preset: string,
  customOptions?: Partial<LayoutPresetConfig>,
): LayoutOverridesResult {
  const base = PRESETS[preset] ?? PRESETS.relaxed;
  const config =
    preset === 'custom' && customOptions
      ? { ...base, ...customOptions }
      : base;

  return {
    spacing: config,
    components: {
      MuiCard: {
        styleOverrides: {
          root: { padding: config.cardPadding },
        },
      },
      MuiCardContent: {
        styleOverrides: {
          root: {
            padding: config.cardPadding,
            '&:last-child': { paddingBottom: config.cardPadding },
          },
        },
      },
      MuiTableCell: {
        styleOverrides: {
          root: { padding: config.tableCellPadding },
        },
      },
      MuiContainer: {
        defaultProps: {
          maxWidth: config.containerMaxWidth,
        },
      },
      MuiTable: {
        defaultProps: {
          size: config.density === 'compact' ? 'small' : 'medium',
        },
      },
    },
  };
}
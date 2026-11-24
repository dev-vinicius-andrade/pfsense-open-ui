import type { PaletteOptions } from '@mui/material/styles';

export interface ColorSchemeDefinition {
  name: string;
  light?: PaletteOptions;
  dark?: PaletteOptions;
}
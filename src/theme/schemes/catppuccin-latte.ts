import type { ColorSchemeDefinition } from './types';

export const catppuccinLatte: ColorSchemeDefinition = {
  name: 'catppuccin-latte',
  light: {
    mode: 'light',
    primary: {
      main: '#8839EF',
      light: '#A05CF2',
      dark: '#6E2CC4',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#EA76CB',
      light: '#F09ADB',
      dark: '#D45AB5',
      contrastText: '#FFFFFF',
    },
    error: {
      main: '#D20F39',
      light: '#E5405E',
      dark: '#B00C30',
    },
    warning: {
      main: '#DF8E1D',
      light: '#E9A84C',
      dark: '#BC7618',
    },
    info: {
      main: '#1E66F5',
      light: '#4D8AF7',
      dark: '#1850C4',
    },
    success: {
      main: '#40A02B',
      light: '#66B853',
      dark: '#348223',
    },
    background: {
      default: '#EFF1F5',
      paper: '#FFFFFF',
    },
    text: {
      primary: '#4C4F69',
      secondary: '#6C6F85',
    },
    divider: '#CCD0DA',
  },
};
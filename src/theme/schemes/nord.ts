import type { ColorSchemeDefinition } from './types';

export const nord: ColorSchemeDefinition = {
  name: 'nord',
  dark: {
    mode: 'dark',
    primary: {
      main: '#88C0D0',
      light: '#A3D4E0',
      dark: '#6AA0B0',
      contrastText: '#2E3440',
    },
    secondary: {
      main: '#81A1C1',
      light: '#9BBBD5',
      dark: '#6181A1',
      contrastText: '#2E3440',
    },
    error: {
      main: '#BF616A',
      light: '#D08088',
      dark: '#9F414A',
    },
    warning: {
      main: '#EBCB8B',
      light: '#F2DCA8',
      dark: '#CBAB6B',
    },
    info: {
      main: '#88C0D0',
      light: '#A3D4E0',
      dark: '#6AA0B0',
    },
    success: {
      main: '#A3BE8C',
      light: '#B9D0A6',
      dark: '#839E6C',
    },
    background: {
      default: '#2E3440',
      paper: '#3B4252',
    },
    text: {
      primary: '#ECEFF4',
      secondary: '#D8DEE9',
    },
    divider: '#4C566A',
  },
};
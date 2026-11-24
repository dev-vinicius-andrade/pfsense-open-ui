import type { ColorSchemeDefinition } from './types';

export const tokyoNight: ColorSchemeDefinition = {
  name: 'tokyo-night',
  dark: {
    mode: 'dark',
    primary: {
      main: '#7AA2F7',
      light: '#9AB8FA',
      dark: '#5A82D7',
      contrastText: '#1A1B26',
    },
    secondary: {
      main: '#BB9AF7',
      light: '#D0B3FA',
      dark: '#9B7AD7',
      contrastText: '#1A1B26',
    },
    error: {
      main: '#F7768E',
      light: '#FA96A8',
      dark: '#D7566E',
    },
    warning: {
      main: '#E0AF68',
      light: '#EAC588',
      dark: '#C08F48',
    },
    info: {
      main: '#7DCFFF',
      light: '#9DDFFF',
      dark: '#5DAFDF',
    },
    success: {
      main: '#9ECE6A',
      light: '#B4DE8A',
      dark: '#7EAE4A',
    },
    background: {
      default: '#1A1B26',
      paper: '#24283B',
    },
    text: {
      primary: '#C0CAF5',
      secondary: '#9AA5CE',
    },
    divider: '#3B4261',
  },
};
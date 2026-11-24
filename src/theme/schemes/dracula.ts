import type { ColorSchemeDefinition } from './types';

export const dracula: ColorSchemeDefinition = {
  name: 'dracula',
  dark: {
    mode: 'dark',
    primary: {
      main: '#BD93F9',
      light: '#CAA8FA',
      dark: '#A070E8',
      contrastText: '#282A36',
    },
    secondary: {
      main: '#FF79C6',
      light: '#FF92D0',
      dark: '#E05AAF',
      contrastText: '#282A36',
    },
    error: {
      main: '#FF5555',
      light: '#FF6E6E',
      dark: '#D63E3E',
    },
    warning: {
      main: '#F1FA8C',
      light: '#F5FBAA',
      dark: '#D4DE6A',
    },
    info: {
      main: '#8BE9FD',
      light: '#A6EEFE',
      dark: '#6BC4E0',
    },
    success: {
      main: '#50FA7B',
      light: '#72FB96',
      dark: '#3AD662',
    },
    background: {
      default: '#282A36',
      paper: '#343746',
    },
    text: {
      primary: '#F8F8F2',
      secondary: '#BFBFBF',
    },
    divider: '#44475A',
  },
};
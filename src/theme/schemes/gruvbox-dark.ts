import type { ColorSchemeDefinition } from './types';

export const gruvboxDark: ColorSchemeDefinition = {
  name: 'gruvbox-dark',
  dark: {
    mode: 'dark',
    primary: {
      main: '#FABD2F',
      light: '#FBCC5C',
      dark: '#DAA00F',
      contrastText: '#282828',
    },
    secondary: {
      main: '#FE8019',
      light: '#FE9A4A',
      dark: '#DE6000',
      contrastText: '#282828',
    },
    error: {
      main: '#FB4934',
      light: '#FC6E5E',
      dark: '#DB2914',
    },
    warning: {
      main: '#FABD2F',
      light: '#FBCC5C',
      dark: '#DAA00F',
    },
    info: {
      main: '#83A598',
      light: '#A0BFB4',
      dark: '#638578',
    },
    success: {
      main: '#B8BB26',
      light: '#CACA50',
      dark: '#989B06',
    },
    background: {
      default: '#282828',
      paper: '#3C3836',
    },
    text: {
      primary: '#EBDBB2',
      secondary: '#A89984',
    },
    divider: '#504945',
  },
};
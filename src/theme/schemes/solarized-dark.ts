import type { ColorSchemeDefinition } from './types';

export const solarizedDark: ColorSchemeDefinition = {
  name: 'solarized-dark',
  dark: {
    mode: 'dark',
    primary: {
      main: '#268BD2',
      light: '#4DA3E0',
      dark: '#1A6BB2',
      contrastText: '#002B36',
    },
    secondary: {
      main: '#D33682',
      light: '#E05A9E',
      dark: '#B31666',
      contrastText: '#002B36',
    },
    error: {
      main: '#DC322F',
      light: '#E65A57',
      dark: '#BC120F',
    },
    warning: {
      main: '#B58900',
      light: '#CC9F2E',
      dark: '#956E00',
    },
    info: {
      main: '#2AA198',
      light: '#4DB9B0',
      dark: '#0A8178',
    },
    success: {
      main: '#859900',
      light: '#9DB32E',
      dark: '#657900',
    },
    background: {
      default: '#002B36',
      paper: '#073642',
    },
    text: {
      primary: '#839496',
      secondary: '#657B83',
    },
    divider: '#586E75',
  },
};
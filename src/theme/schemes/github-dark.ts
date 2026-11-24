import type { ColorSchemeDefinition } from './types';

export const githubDark: ColorSchemeDefinition = {
  name: 'github-dark',
  dark: {
    mode: 'dark',
    primary: {
      main: '#58A6FF',
      light: '#79BAFF',
      dark: '#388ADF',
      contrastText: '#0D1117',
    },
    secondary: {
      main: '#BC8CFF',
      light: '#D0A8FF',
      dark: '#9C6CDF',
      contrastText: '#0D1117',
    },
    error: {
      main: '#F85149',
      light: '#FA736C',
      dark: '#D83129',
    },
    warning: {
      main: '#D29922',
      light: '#E0B04A',
      dark: '#B27902',
    },
    info: {
      main: '#58A6FF',
      light: '#79BAFF',
      dark: '#388ADF',
    },
    success: {
      main: '#3FB950',
      light: '#62CC72',
      dark: '#1F9930',
    },
    background: {
      default: '#0D1117',
      paper: '#161B22',
    },
    text: {
      primary: '#C9D1D9',
      secondary: '#8B949E',
    },
    divider: '#30363D',
  },
};
import type { PaletteOptions } from '@mui/material/styles';

export const lightPalette: PaletteOptions = {
  mode: 'light',
  primary: {
    main: '#00897B',
    light: '#4DB6AC',
    dark: '#00695C',
    contrastText: '#FFFFFF',
  },
  secondary: {
    main: '#FFA000',
    light: '#FFD54F',
    dark: '#FF8F00',
    contrastText: '#212121',
  },
  error: {
    main: '#D32F2F',
    light: '#EF5350',
    dark: '#C62828',
  },
  warning: {
    main: '#FFA000',
    light: '#FFD54F',
    dark: '#FF8F00',
  },
  info: {
    main: '#0288D1',
    light: '#4FC3F7',
    dark: '#01579B',
  },
  success: {
    main: '#2E7D32',
    light: '#66BB6A',
    dark: '#1B5E20',
  },
  background: {
    default: '#FAFAFA',
    paper: '#FFFFFF',
  },
  text: {
    primary: '#37474F',
    secondary: '#546E7A',
  },
  divider: '#CFD8DC',
};

export const darkPalette: PaletteOptions = {
  mode: 'dark',
  primary: {
    main: '#4DB6AC',
    light: '#80CBC4',
    dark: '#00897B',
    contrastText: '#000000',
  },
  secondary: {
    main: '#FFB74D',
    light: '#FFE082',
    dark: '#FFA000',
    contrastText: '#000000',
  },
  error: {
    main: '#EF5350',
    light: '#E57373',
    dark: '#D32F2F',
  },
  warning: {
    main: '#FFB74D',
    light: '#FFE082',
    dark: '#FFA000',
  },
  info: {
    main: '#4FC3F7',
    light: '#81D4FA',
    dark: '#0288D1',
  },
  success: {
    main: '#66BB6A',
    light: '#A5D6A7',
    dark: '#2E7D32',
  },
  background: {
    default: '#121212',
    paper: '#1E1E1E',
  },
  text: {
    primary: '#ECEFF1',
    secondary: '#B0BEC5',
  },
  divider: '#37474F',
};
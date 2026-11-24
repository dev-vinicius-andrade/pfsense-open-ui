import { createTheme } from '@mui/material/styles';
import { lightPalette, darkPalette } from './palette';
import { typography } from './typography';
import { components } from './components';

export function getTheme(mode: 'light' | 'dark') {
  return createTheme({
    palette: mode === 'light' ? lightPalette : darkPalette,
    typography,
    components,
    shape: {
      borderRadius: 8,
    },
  });
}

export const lightTheme = getTheme('light');
export const darkTheme = getTheme('dark');
import type { ColorSchemeDefinition } from './types';

export const oneDarkPro: ColorSchemeDefinition = {
  name: 'one-dark-pro',
  dark: {
    mode: 'dark',
    primary: {
      main: '#61AFEF',
      light: '#82C4F5',
      dark: '#418FCF',
      contrastText: '#282C34',
    },
    secondary: {
      main: '#C678DD',
      light: '#D698E8',
      dark: '#A658BD',
      contrastText: '#282C34',
    },
    error: {
      main: '#E06C75',
      light: '#EA8E95',
      dark: '#C04C55',
    },
    warning: {
      main: '#E5C07B',
      light: '#EDD29B',
      dark: '#C5A05B',
    },
    info: {
      main: '#56B6C2',
      light: '#78CAD4',
      dark: '#3696A2',
    },
    success: {
      main: '#98C379',
      light: '#AECE99',
      dark: '#78A359',
    },
    background: {
      default: '#282C34',
      paper: '#2C313A',
    },
    text: {
      primary: '#ABB2BF',
      secondary: '#7F848E',
    },
    divider: '#3E4451',
  },
};
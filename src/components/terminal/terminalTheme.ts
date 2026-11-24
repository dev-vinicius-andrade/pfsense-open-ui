import type { ITheme } from '@xterm/xterm';
import type { Theme } from '@mui/material/styles';

export function getTerminalTheme(muiTheme: Theme): ITheme {
  return {
    background: muiTheme.palette.background.default,
    foreground: muiTheme.palette.text.primary,
    cursor: muiTheme.palette.primary.main,
    selectionBackground: muiTheme.palette.primary.main + '40',
    black: muiTheme.palette.text.secondary,
    red: muiTheme.palette.error.main,
    green: muiTheme.palette.success.main,
    yellow: muiTheme.palette.warning.main,
    blue: muiTheme.palette.info.main,
    magenta: muiTheme.palette.secondary.main,
    cyan: muiTheme.palette.primary.main,
    white: muiTheme.palette.text.primary,
  };
}
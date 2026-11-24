import type { Components, Theme } from '@mui/material/styles';

export const components: Components<Theme> = {
  MuiButton: {
    styleOverrides: {
      root: {
        borderRadius: 6,
        paddingInline: 20,
      },
    },
    defaultProps: {
      disableElevation: true,
    },
  },
  MuiCard: {
    styleOverrides: {
      root: {
        borderRadius: 8,
        border: '1px solid',
        borderColor: 'divider',
        backgroundImage: 'none',
      },
    },
    defaultProps: {
      variant: 'outlined',
    },
  },
  MuiTextField: {
    defaultProps: {
      size: 'small',
      variant: 'outlined',
    },
  },
  MuiAppBar: {
    defaultProps: {
      elevation: 0,
    },
    styleOverrides: {
      root: {
        borderBottom: '1px solid',
        borderColor: 'divider',
      },
    },
  },
  MuiDrawer: {
    styleOverrides: {
      paper: {
        borderRight: '1px solid',
        borderColor: 'divider',
      },
    },
  },
  MuiListItemButton: {
    styleOverrides: {
      root: {
        borderRadius: 6,
        marginBlock: 2,
        marginInline: 8,
        '&.Mui-selected': {
          fontWeight: 600,
        },
      },
    },
  },
  MuiChip: {
    styleOverrides: {
      root: {
        fontWeight: 500,
      },
    },
  },
  MuiDialog: {
    defaultProps: {
      maxWidth: 'sm',
      fullWidth: true,
    },
  },
};
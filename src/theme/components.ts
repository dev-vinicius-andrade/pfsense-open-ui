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
      root: ({ theme }) => ({
        borderRadius: 12,
        border: '1px solid',
        borderColor: theme.palette.divider,
        backgroundImage: 'none',
        boxShadow: theme.palette.mode === 'dark'
          ? '0 2px 8px rgba(0,0,0,0.4)'
          : '0 1px 3px rgba(0,0,0,0.08)',
        transition: 'box-shadow 0.2s ease, border-color 0.2s ease',
      }),
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
        transition: 'background-color 200ms ease, transform 200ms ease, color 200ms ease',
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
  MuiPaper: {
    styleOverrides: {
      root: ({ theme }) => ({
        border: '1px solid',
        borderColor: theme.palette.divider,
        backgroundImage: 'none',
      }),
    },
  },
  MuiTypography: {
    styleOverrides: {
      subtitle2: ({ theme }) => ({
        color: theme.palette.text.secondary,
      }),
    },
  },
};
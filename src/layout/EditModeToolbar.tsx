import { Button, Typography, Paper } from '@mui/material';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import CloseIcon from '@mui/icons-material/Close';
import { useUiStore } from '@/stores/uiStore';

interface EditModeToolbarProps {
  onReset: () => void;
}

export function EditModeToolbar({ onReset }: EditModeToolbarProps) {
  const setLayoutEditMode = useUiStore((state) => state.setLayoutEditMode);

  return (
    <Paper
      elevation={4}
      sx={{
        position: 'fixed',
        bottom: 24,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: (theme) => theme.zIndex.tooltip + 1,
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        px: 3,
        py: 1.5,
        borderRadius: 3,
        bgcolor: 'background.paper',
        border: '1px solid',
        borderColor: 'primary.main',
        boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
      }}
    >
      <Typography variant="body2" color="primary" sx={{ fontWeight: 600 }}>
        Edit Layout Mode
      </Typography>
      <Button
        startIcon={<RestartAltIcon />}
        size="small"
        variant="outlined"
        onClick={onReset}
        aria-label="reset layout to default"
      >
        Reset to Default
      </Button>
      <Button
        startIcon={<CloseIcon />}
        size="small"
        variant="contained"
        onClick={() => setLayoutEditMode(false)}
        aria-label="exit edit mode"
      >
        Done
      </Button>
    </Paper>
  );
}
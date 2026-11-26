import { Button, Typography, Paper, Divider, IconButton, Tooltip } from '@mui/material';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import CloseIcon from '@mui/icons-material/Close';
import AspectRatioIcon from '@mui/icons-material/AspectRatio';
import AlignHorizontalLeftIcon from '@mui/icons-material/AlignHorizontalLeft';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import UnfoldMoreIcon from '@mui/icons-material/UnfoldMore';
import { useUiStore } from '@/stores/uiStore';

interface EditModeToolbarProps {
  onReset: () => void;
  onFitWidth: () => void;
  onFitHeight: () => void;
  onAlignLeft: () => void;
  onAutoArrange: () => void;
}

export function EditModeToolbar({
  onReset,
  onFitWidth,
  onFitHeight,
  onAlignLeft,
  onAutoArrange,
}: EditModeToolbarProps) {
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
        gap: 1,
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

      <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />

      <Tooltip title="Fit Width">
        <IconButton size="small" onClick={onFitWidth} aria-label="fit all panels to full width">
          <AspectRatioIcon fontSize="small" />
        </IconButton>
      </Tooltip>

      <Tooltip title="Fit Height">
        <IconButton size="small" onClick={onFitHeight} aria-label="fit all panels to standard height">
          <UnfoldMoreIcon fontSize="small" />
        </IconButton>
      </Tooltip>

      <Tooltip title="Align Left">
        <IconButton size="small" onClick={onAlignLeft} aria-label="align all panels to left edge">
          <AlignHorizontalLeftIcon fontSize="small" />
        </IconButton>
      </Tooltip>

      <Tooltip title="Auto Arrange">
        <IconButton size="small" onClick={onAutoArrange} aria-label="auto arrange all panels">
          <AutoFixHighIcon fontSize="small" />
        </IconButton>
      </Tooltip>

      <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />

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
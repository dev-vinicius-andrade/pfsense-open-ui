import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  TextField,
  Typography,
  Box,
} from '@mui/material';
import WarningIcon from '@mui/icons-material/Warning';

interface DangerousActionConfirmProps {
  open: boolean;
  title: string;
  message: string;
  confirmationWord: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  isPending?: boolean;
}

export function DangerousActionConfirm({
  open,
  title,
  message,
  confirmationWord,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
  isPending = false,
}: DangerousActionConfirmProps) {
  const [inputValue, setInputValue] = useState('');

  const canConfirm = inputValue === confirmationWord;

  const handleClose = () => {
    setInputValue('');
    onCancel();
  };

  const handleConfirm = () => {
    if (canConfirm) {
      setInputValue('');
      onConfirm();
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <WarningIcon color="error" />
        {title}
      </DialogTitle>
      <DialogContent>
        <DialogContentText sx={{ mb: 2 }}>{message}</DialogContentText>
        <Box sx={{ mt: 2 }}>
          <Typography variant="body2" sx={{ mb: 1 }}>
            Type <strong>{confirmationWord}</strong> to confirm:
          </Typography>
          <TextField
            fullWidth
            size="small"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={confirmationWord}
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter' && canConfirm) {
                handleConfirm();
              }
            }}
            aria-label="Confirmation input"
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={isPending}>
          {cancelLabel}
        </Button>
        <Button
          onClick={handleConfirm}
          color="error"
          variant="contained"
          disabled={!canConfirm || isPending}
        >
          {isPending ? 'Processing...' : confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
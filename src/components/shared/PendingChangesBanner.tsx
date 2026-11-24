import { Alert, AlertTitle, Button } from '@mui/material';

interface PendingChangesBannerProps {
  hasChanges: boolean;
  onApply: () => void;
  isApplying: boolean;
  title?: string;
  message?: string;
}

export function PendingChangesBanner({
  hasChanges,
  onApply,
  isApplying,
  title = 'Pending Changes',
  message = 'You have unsaved changes. Apply them to make them active.',
}: PendingChangesBannerProps) {
  if (!hasChanges) return null;

  return (
    <Alert
      severity="warning"
      sx={{ mb: 3 }}
      action={
        <Button
          color="inherit"
          size="small"
          variant="contained"
          onClick={onApply}
          disabled={isApplying}
        >
          {isApplying ? 'Applying...' : 'Apply Changes'}
        </Button>
      }
    >
      <AlertTitle>{title}</AlertTitle>
      {message}
    </Alert>
  );
}
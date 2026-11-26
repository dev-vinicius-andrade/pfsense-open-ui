import { Box } from '@mui/material';
import { DiagnosticsTab } from '../DiagnosticsTab';
import { useSystemContext } from '../SystemContext';

interface DiagnosticsPanelProps {
  panelId: string;
}

export function DiagnosticsPanel({ panelId }: DiagnosticsPanelProps) {
  const { activeTab } = useSystemContext();

  if (activeTab !== 'diagnostics') return null;

  return (
    <Box data-panel-id={panelId}>
      <DiagnosticsTab />
    </Box>
  );
}
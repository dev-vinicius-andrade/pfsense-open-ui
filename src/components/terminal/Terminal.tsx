import { useRef, useState, useEffect } from 'react';
import { Box, Alert } from '@mui/material';
import { useAuthStore } from '@/auth/authStore';
import { useTerminal } from './useTerminal';

const REQUIRED_PRIVILEGE = 'page-diagnostics-command-prompt';

export function Terminal() {
  const containerRef = useRef<HTMLDivElement>(null);
  const user = useAuthStore((state) => state.user);
  const [hasPrivilege, setHasPrivilege] = useState(false);

  useEffect(() => {
    const privileges = user?.privileges ?? [];
    setHasPrivilege(privileges.includes(REQUIRED_PRIVILEGE));
  }, [user]);

  const { clearHistory } = useTerminal({
    containerRef,
    enabled: hasPrivilege,
  });

  // Clear history on unmount (logout scenario handled by auth store listener elsewhere)
  useEffect(() => {
    return () => {
      clearHistory();
    };
  }, [clearHistory]);

  if (!hasPrivilege) {
    return (
      <Alert severity="warning" sx={{ m: 2 }}>
        Insufficient privileges for command prompt access.
      </Alert>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Box
        sx={{
          px: 2,
          py: 0.5,
          bgcolor: 'warning.dark',
          color: 'warning.contrastText',
          fontSize: '0.75rem',
          fontWeight: 600,
          textAlign: 'center',
        }}
      >
        All commands are logged and audited.
      </Box>
      <Box
        ref={containerRef}
        sx={{
          flex: 1,
          minHeight: 300,
          p: 1,
          bgcolor: 'background.default',
          '& .xterm': { height: '100%' },
          '& .xterm-viewport': { overflowY: 'auto !important' },
        }}
        role="application"
        aria-label="Interactive terminal"
      />
    </Box>
  );
}
import { lazy, Suspense } from 'react';
import { Box, CircularProgress, Paper, Typography } from '@mui/material';

const Terminal = lazy(() =>
 import('./Terminal').then((m) => ({ default: m.Terminal })),
);

export function TerminalDiagnosticsTab() {
 return (
 <Paper sx={{ p: 0, overflow: 'hidden' }}>
 <Box sx={{ px: 3, pt: 3, pb: 1 }}>
 <Typography variant="h6" gutterBottom>
 Command Prompt
 </Typography>
 <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
 Interactive terminal for executing diagnostic commands on the pfSense appliance.
 </Typography>
 </Box>
 <Box sx={{ height: 450, minHeight: 300 }}>
 <Suspense
 fallback={
 <Box
 sx={{
 display: 'flex',
 justifyContent: 'center',
 alignItems: 'center',
 height: '100%',
 }}
 >
 <CircularProgress size={24} />
 </Box>
 }
 >
 <Terminal />
 </Suspense>
 </Box>
 </Paper>
 );
}
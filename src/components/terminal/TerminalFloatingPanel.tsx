import { useState, useRef, useCallback, useEffect, lazy, Suspense } from 'react';
import { Box, IconButton, Paper, Typography } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import { useAuthStore } from '@/auth/authStore';
import CircularProgress from '@mui/material/CircularProgress';

const Terminal = lazy(() =>
 import('./Terminal').then((m) => ({ default: m.Terminal })),
);

const REQUIRED_PRIVILEGE = 'page-diagnostics-command-prompt';

interface Position {
 x: number;
 y: number;
}

interface Size {
 width: number;
 height: number;
}

interface TerminalFloatingPanelProps {
 open: boolean;
 onClose: () => void;
}

export function TerminalFloatingPanel({ open, onClose }: TerminalFloatingPanelProps) {
 const user = useAuthStore((state) => state.user);
 const [position, setPosition] = useState<Position>({ x: 0, y: 0 });
 const [size, setSize] = useState<Size>({ width: 700, height: 450 });
 const [isDragging, setIsDragging] = useState(false);
 const dragStartRef = useRef<{ mouseX: number; mouseY: number; posX: number; posY: number } | null>(null);
 const panelRef = useRef<HTMLDivElement>(null);

 const hasPrivilege = user?.privileges.includes(REQUIRED_PRIVILEGE) ?? false;

 // Initialize position to bottom-right on first open
 useEffect(() => {
 if (open && position.x === 0 && position.y === 0) {
 setPosition({
 x: window.innerWidth - size.width - 24,
 y: window.innerHeight - size.height - 24,
 });
 }
 }, [open, position.x, position.y, size.width, size.height]);

 const handleMouseDown = useCallback((e: React.MouseEvent) => {
 e.preventDefault();
 dragStartRef.current = {
 mouseX: e.clientX,
 mouseY: e.clientY,
 posX: position.x,
 posY: position.y,
 };
 setIsDragging(true);
 }, [position]);

 useEffect(() => {
 if (!isDragging) return;

 const handleMouseMove = (e: MouseEvent) => {
 if (!dragStartRef.current) return;
 const dx = e.clientX - dragStartRef.current.mouseX;
 const dy = e.clientY - dragStartRef.current.mouseY;
 setPosition({
 x: Math.max(0, dragStartRef.current.posX + dx),
 y: Math.max(0, dragStartRef.current.posY + dy),
 });
 };

 const handleMouseUp = () => {
 setIsDragging(false);
 dragStartRef.current = null;
 };

 window.addEventListener('mousemove', handleMouseMove);
 window.addEventListener('mouseup', handleMouseUp);
 return () => {
 window.removeEventListener('mousemove', handleMouseMove);
 window.removeEventListener('mouseup', handleMouseUp);
 };
 }, [isDragging]);

 // Resize handler
 const handleResizeMouseDown = useCallback((e: React.MouseEvent, direction: 'se' | 'sw' | 'ne' | 'nw') => {
 e.preventDefault();
 e.stopPropagation();
 const startX = e.clientX;
 const startY = e.clientY;
 const startWidth = size.width;
 const startHeight = size.height;
 const startPosX = position.x;
 const startPosY = position.y;

 const handleMouseMove = (ev: MouseEvent) => {
 const dx = ev.clientX - startX;
 const dy = ev.clientY - startY;

 let newWidth = startWidth;
 let newHeight = startHeight;
 let newX = startPosX;
 let newY = startPosY;

 if (direction.includes('e')) newWidth = Math.max(400, startWidth + dx);
 if (direction.includes('w')) {
 newWidth = Math.max(400, startWidth - dx);
 newX = startPosX + dx;
 }
 if (direction.includes('s')) newHeight = Math.max(250, startHeight + dy);
 if (direction.includes('n')) {
 newHeight = Math.max(250, startHeight - dy);
 newY = startPosY + dy;
 }

 setSize({ width: newWidth, height: newHeight });
 setPosition({ x: Math.max(0, newX), y: Math.max(0, newY) });
 };

 const handleMouseUp = () => {
 window.removeEventListener('mousemove', handleMouseMove);
 window.removeEventListener('mouseup', handleMouseUp);
 };

 window.addEventListener('mousemove', handleMouseMove);
 window.addEventListener('mouseup', handleMouseUp);
 }, [size, position]);

 if (!open || !hasPrivilege) return null;

 return (
 <Paper
 ref={panelRef}
 elevation={8}
 sx={{
 position: 'fixed',
 left: position.x,
 top: position.y,
 width: size.width,
 height: size.height,
 zIndex: 1300,
 display: 'flex',
 flexDirection: 'column',
 overflow: 'hidden',
 border: 1,
 borderColor: 'divider',
 }}
 role="dialog"
 aria-label="Floating terminal"
 >
 {/* Title bar / drag handle */}
 <Box
 onMouseDown={handleMouseDown}
 sx={{
 display: 'flex',
 alignItems: 'center',
 px: 1,
 py: 0.5,
 bgcolor: 'grey.800',
 color: 'grey.100',
 cursor: isDragging ? 'grabbing' : 'grab',
 userSelect: 'none',
 flexShrink: 0,
 }}
 >
 <DragIndicatorIcon sx={{ fontSize: 18, mr: 1, opacity: 0.7 }} />
 <Typography variant="caption" sx={{ flex: 1, fontWeight: 600 }}>
 Terminal
 </Typography>
 <IconButton size="small" onClick={onClose} sx={{ color: 'grey.100', p: 0.25 }}>
 <CloseIcon sx={{ fontSize: 18 }} />
 </IconButton>
 </Box>

 {/* Terminal content */}
 <Box sx={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
 <Suspense
 fallback={
 <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
 <CircularProgress size={24} />
 </Box>
 }
 >
 <Terminal />
 </Suspense>
 </Box>

 {/* Resize handles */}
 <Box
 onMouseDown={(e) => handleResizeMouseDown(e, 'se')}
 sx={{
 position: 'absolute',
 right: 0,
 bottom: 0,
 width: 16,
 height: 16,
 cursor: 'se-resize',
 '&::after': {
 content: '""',
 position: 'absolute',
 right: 3,
 bottom: 3,
 width: 8,
 height: 8,
 borderRight: '2px solid',
 borderBottom: '2px solid',
 borderColor: 'grey.500',
 },
 }}
 />
 </Paper>
 );
}
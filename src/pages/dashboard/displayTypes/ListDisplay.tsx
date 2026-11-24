import { Box, List, ListItem, ListItemText, Typography, useTheme } from '@mui/material';

interface ListItemData {
  label: string;
  value?: string;
  status?: 'online' | 'offline' | 'warning';
}

interface ListDisplayProps {
  items: ListItemData[];
  maxHeight?: number;
}

const statusDotColor: Record<string, string> = {
  online: '#2E7D32',
  offline: '#D32F2F',
  warning: '#FFA000',
};

export function ListDisplay({ items, maxHeight = 300 }: ListDisplayProps) {
  const theme = useTheme();

  if (!items || items.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography variant="body2" color="text.secondary">
          No data
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ maxHeight, overflowY: 'auto' }} role="list" aria-label="Status list">
      <List dense disablePadding>
        {items.map((item, index) => (
          <ListItem key={`${item.label}-${index}`} divider={index < items.length - 1}>
            {item.status && (
              <Box
                sx={{
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  backgroundColor: statusDotColor[item.status] ?? theme.palette.text.disabled,
                  mr: 1.5,
                  flexShrink: 0,
                }}
                aria-label={`Status: ${item.status}`}
              />
            )}
            <ListItemText
              primary={<Typography variant="body2" sx={{ fontWeight: 500 }}>{item.label}</Typography>}
              secondary={item.value}
              slotProps={{ secondary: { variant: 'caption', color: 'text.secondary' } }}
            />
          </ListItem>
        ))}
      </List>
    </Box>
  );
}
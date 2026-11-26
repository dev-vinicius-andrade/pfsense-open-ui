import { Drawer, Box, Typography, Button, List, ListItem, ListItemText, IconButton } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import type { PanelDefinition, PanelLayout } from './types';

interface AddPanelDrawerProps {
  open: boolean;
  onClose: () => void;
  hiddenPanels: Array<{ definition: PanelDefinition; layout: PanelLayout }>;
  onAddPanel: (panelId: string) => void;
}

export function AddPanelDrawer({ open, onClose, hiddenPanels, onAddPanel }: AddPanelDrawerProps) {
  return (
    <Drawer anchor="right" open={open} onClose={onClose}>
      <Box sx={{ width: 320, p: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">Add Panels</Typography>
          <IconButton size="small" onClick={onClose} aria-label="close add panels drawer">
            <CloseIcon />
          </IconButton>
        </Box>
        {hiddenPanels.length === 0 ? (
          <Typography color="text.secondary">All panels are visible.</Typography>
        ) : (
          <List>
            {hiddenPanels.map(({ definition }) => (
              <ListItem
                key={definition.id}
                secondaryAction={
                  <Button
                    size="small"
                    startIcon={<AddIcon />}
                    onClick={() => onAddPanel(definition.id)}
                    aria-label={`add ${definition.title} panel`}
                  >
                    Add
                  </Button>
                }
              >
                <ListItemText primary={definition.title} secondary={definition.description} />
              </ListItem>
            ))}
          </List>
        )}
      </Box>
    </Drawer>
  );
}
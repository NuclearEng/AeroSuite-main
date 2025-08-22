import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Typography,
  Box,
  IconButton,
  Divider,
  TextField,
  InputAdornment,
  useTheme,
  DialogActions,
  Button,
  Grid,
  Paper,
  List,
  ListItem,
  ListItemText,
  alpha
} from '@mui/material';
import {
  Close as CloseIcon,
  Search as SearchIcon,
  Keyboard as KeyboardIcon,
} from '@mui/icons-material';
import { shortcutGroups, formatShortcut, KeyboardShortcut, ShortcutMap } from '../../utils/keyboardShortcuts';

interface KeyboardShortcutsDialogProps {
  open: boolean;
  onClose: () => void;
}

interface FilteredGroup {
  name: string;
  shortcuts: ShortcutMap;
  hasMatches: boolean;
}

const KeyboardShortcutsDialog: React.FC<KeyboardShortcutsDialogProps> = ({
  open,
  onClose,
}) => {
  const theme = useTheme();
  const [searchTerm, setSearchTerm] = useState('');
  
  // Reset search term when dialog opens
  useEffect(() => {
    if (open) {
      setSearchTerm('');
    }
  }, [open]);
  
  // Filter shortcuts based on search term
  const filteredGroups = shortcutGroups
    .map(group => {
      // Filter shortcuts in this group
      const filteredShortcuts = Object.entries(group.shortcuts)
        .filter(([id, shortcut]: any) => {
          const searchLower = searchTerm.toLowerCase();
          const typedShortcut = shortcut as KeyboardShortcut;
          return (
            typedShortcut.description.toLowerCase().includes(searchLower) ||
            typedShortcut.key.toLowerCase().includes(searchLower) ||
            formatShortcut({
              key: typedShortcut.key,
              ctrlKey: typedShortcut.ctrlKey,
              altKey: typedShortcut.altKey,
              shiftKey: typedShortcut.shiftKey,
              metaKey: typedShortcut.metaKey
            }).toLowerCase().includes(searchLower)
          );
        })
        .reduce<ShortcutMap>((acc, [id, shortcut]) => {
          acc[id] = shortcut as KeyboardShortcut;
          return acc;
        }, {});
      
      // Return group with filtered shortcuts
      return {
        name: group.name,
        shortcuts: filteredShortcuts,
        hasMatches: Object.keys(filteredShortcuts).length > 0,
      } as FilteredGroup;
    })
    .filter(group => group.hasMatches);
  
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { 
          borderRadius: 2,
          overflow: 'hidden'
        }
      }}
      aria-labelledby="keyboard-shortcuts-dialog-title"
    >
      <DialogTitle 
        id="keyboard-shortcuts-dialog-title"
        sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          py: 2,
          bgcolor: alpha(theme.palette.primary.main, 0.05)
        }}
      >
        <Box display="flex" alignItems="center">
          <KeyboardIcon 
            color="primary"
            sx={{ mr: 1.5, fontSize: 28 }}
          />
          <Typography variant="h6" component="span">
            Keyboard Shortcuts
          </Typography>
        </Box>
        <IconButton
          aria-label="close"
          onClick={onClose}
          size="small"
          edge="end"
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      <Box sx={{ px: 3, py: 2, bgcolor: alpha(theme.palette.primary.main, 0.05) }}>
        <TextField
          fullWidth
          placeholder="Search shortcuts..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          variant="outlined"
          size="small"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              bgcolor: theme.palette.background.paper,
              borderRadius: 2,
            }
          }}
        />
      </Box>
      
      <DialogContent 
        dividers 
        sx={{ 
          p: 3,
          maxHeight: '60vh',
        }}
      >
        {filteredGroups.length === 0 ? (
          <Box 
            sx={{ 
              py: 8, 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center',
              color: 'text.secondary'
            }}
          >
            <KeyboardIcon sx={{ fontSize: 48, mb: 2, opacity: 0.6 }} />
            <Typography variant="h6">No shortcuts found</Typography>
            <Typography variant="body2">
              Try a different search term
            </Typography>
          </Box>
        ) : (
          <Grid container spacing={3}>
            {filteredGroups.map((group: any) => (
              <Grid item xs={12} md={6} key={group.name}>
                <Paper 
                  elevation={0}
                  sx={{ 
                    p: 2, 
                    height: '100%',
                    borderRadius: 2,
                    border: `1px solid ${theme.palette.divider}`,
                  }}
                >
                  <Typography 
                    variant="subtitle1" 
                    fontWeight="bold" 
                    color="primary"
                    gutterBottom
                  >
                    {group.name}
                  </Typography>
                  <Divider sx={{ mb: 1 }} />
                  <List dense disablePadding>
                    {Object.entries(group.shortcuts).map(([id, shortcutEntry]: any) => {
                      const shortcut = shortcutEntry as KeyboardShortcut;
                      return (
                        <ListItem
                          key={id}
                          disableGutters
                          sx={{ 
                            py: 0.75, 
                            px: 0,
                            borderBottom: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
                            '&:last-child': {
                              borderBottom: 'none',
                            }
                          }}
                        >
                          <ListItemText
                            primary={shortcut.description}
                            sx={{ flexGrow: 1 }}
                          />
                          <Box 
                            component="code"
                            sx={{ 
                              ml: 2,
                              px: 1, 
                              py: 0.5, 
                              borderRadius: 1,
                              fontSize: '0.85rem',
                              bgcolor: alpha(theme.palette.primary.main, 0.1),
                              color: theme.palette.primary.main,
                              fontFamily: 'monospace',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {formatShortcut({
                              key: shortcut.key,
                              ctrlKey: shortcut.ctrlKey,
                              altKey: shortcut.altKey,
                              shiftKey: shortcut.shiftKey,
                              metaKey: shortcut.metaKey
                            })}
                          </Box>
                        </ListItem>
                      );
                    })}
                  </List>
                </Paper>
              </Grid>
            ))}
          </Grid>
        )}
      </DialogContent>
      
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            Press <code>?</code> at any time to show this dialog
          </Typography>
        </Box>
        <Button onClick={onClose} variant="outlined">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default KeyboardShortcutsDialog; 
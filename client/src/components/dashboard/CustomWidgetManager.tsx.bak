import React, { useState } from 'react';
import {
  Box,
  Button,
  Typography,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  Paper,
  Tooltip,
  Fab,
  NoSsr } from
'@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Close as CloseIcon,
  Visibility as ViewIcon,
  WidgetsOutlined as WidgetsIcon } from
'@mui/icons-material';
import { useAppDispatch, useAppSelector } from '../../redux/store';
import { removeWidget, toggleWidgetVisibility } from '../../redux/slices/dashboard.slice';
import CustomWidgetBuilder from './widgets/CustomWidgetBuilder';
import { getAllWidgets } from './widgets/WidgetRegistry';

const CustomWidgetManager: React.FC = () => {
  const dispatch = useAppDispatch();
  const { widgets } = useAppSelector((state) => state.dashboard);

  // Dialog state
  const [builderOpen, setBuilderOpen] = useState(false);
  const [managerOpen, setManagerOpen] = useState(false);

  // Get all custom widgets
  const customWidgets = getAllWidgets().filter((widget) => widget.isCustom);

  // Handle opening the widget builder
  const handleOpenBuilder = () => {
    setBuilderOpen(true);
  };

  // Handle closing the widget builder
  const handleCloseBuilder = () => {
    setBuilderOpen(false);
  };

  // Handle saving a custom widget
  const handleSaveWidget = (widgetId: string) => {
    // Close the builder
    setBuilderOpen(false);
    // Open the manager to show the new widget
    setManagerOpen(true);
  };

  // Handle deleting a custom widget
  const handleDeleteWidget = (widgetId: string) => {
    // Remove widget from dashboard
    dispatch(removeWidget(widgetId));
  };

  // Handle toggling widget visibility
  const handleToggleVisibility = (widgetId: string) => {
    dispatch(toggleWidgetVisibility(widgetId));
  };

  return (
    <NoSsr>
      
      <Tooltip title="Manage Custom Widgets" placement="left">
        <Fab
          color="primary"
          size="medium"
          aria-label="manage widgets"
          onClick={() => setManagerOpen(true)}
          sx={{
            position: 'fixed',
            bottom: (theme) => theme.spacing(3),
            right: (theme) => theme.spacing(3),
            zIndex: 1000
          }}>

          <WidgetsIcon />
        </Fab>
      </Tooltip>
      
      
      <Dialog
        open={managerOpen}
        onClose={() => setManagerOpen(false)}
        maxWidth="sm"
        fullWidth>

        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">Custom Widgets</Typography>
            <IconButton
              edge="end"
              color="inherit"
              onClick={() => setManagerOpen(false)}
              aria-label="close">

              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={handleOpenBuilder}
            sx={{ mb: 2 }}
            fullWidth>

            Create New Widget
          </Button>
          
          {customWidgets.length === 0 ?
          <Paper sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="body1" color="textSecondary">
                You haven't created any custom widgets yet.
              </Typography>
              <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                Click the button above to create your first custom widget.
              </Typography>
            </Paper> :

          <List>
              {customWidgets.map((widget) =>
            <React.Fragment key={widget.id}>
                  <ListItem>
                    <ListItemText
                  primary={widget.title}
                  secondary={widget.description} />

                    <ListItemSecondaryAction>
                      <Tooltip title={widgets[widget.id]?.visible ? "Hide Widget" : "Show Widget"}>
                        <IconButton
                      edge="end"
                      aria-label="toggle visibility"
                      onClick={() => handleToggleVisibility(widget.id)}
                      color={widgets[widget.id]?.visible ? "primary" : "default"}
                      sx={{ mr: 1 }}>

                          <ViewIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete Widget">
                        <IconButton
                      edge="end"
                      aria-label="delete"
                      onClick={() => handleDeleteWidget(widget.id)}
                      color="error">

                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </ListItemSecondaryAction>
                  </ListItem>
                  <Divider variant="inset" component="li" />
                </React.Fragment>
            )}
            </List>
          }
        </DialogContent>
      </Dialog>
      
      
      <Dialog
        open={builderOpen}
        onClose={handleCloseBuilder}
        maxWidth="md"
        fullWidth>

        <DialogContent>
          <CustomWidgetBuilder
            onClose={handleCloseBuilder}
            onSave={handleSaveWidget} />

        </DialogContent>
      </Dialog>
    </NoSsr>);

};

export default CustomWidgetManager;
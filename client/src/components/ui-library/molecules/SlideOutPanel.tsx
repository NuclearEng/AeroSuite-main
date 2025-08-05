import React from 'react';
import Drawer from '@mui/material/Drawer';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
import Typography from '@mui/material/Typography';

export interface SlideOutPanelProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  width?: number | string;
  children: React.ReactNode;
}

const SlideOutPanel: React.FC<SlideOutPanelProps> = ({ open, onClose, title, width = 400, children }) => {
  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{ sx: { width, maxWidth: '100vw', p: 2, borderTopLeftRadius: 8, borderBottomLeftRadius: 8 } }}
      aria-label={title ? `${title} panel` : 'Slide out panel'}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        {title && <Typography variant="h6" sx={{ flexGrow: 1 }}>{title}</Typography>}
        <IconButton onClick={onClose} aria-label="Close panel">
          <CloseIcon />
        </IconButton>
      </Box>
      <Box sx={{ overflowY: 'auto', maxHeight: 'calc(100vh - 64px)' }}>{children}</Box>
    </Drawer>
  );
};

export default SlideOutPanel; 
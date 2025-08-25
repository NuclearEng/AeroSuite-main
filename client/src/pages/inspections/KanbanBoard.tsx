import React from 'react';
import { Box, Paper, Typography } from '@mui/material';

const KanbanBoard = () => {
  return (
    <Box display="flex" gap={2}>
      <Paper sx={{ p: 2, width: 300 }}>
        <Typography>Todo</Typography>
        {/* Cards */}
      </Paper>
      <Paper sx={{ p: 2, width: 300 }}>
        <Typography>In Progress</Typography>
      </Paper>
      <Paper sx={{ p: 2, width: 300 }}>
        <Typography>Done</Typography>
      </Paper>
    </Box>
  );
};

export default KanbanBoard;

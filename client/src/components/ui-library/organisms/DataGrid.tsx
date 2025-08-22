import * as React from 'react';
import Box from '@mui/material/Box';
import { DataGrid as MUIDataGrid, GridColDef, GridRowsProp, DataGridProps as MUIDataGridProps } from '@mui/x-data-grid';

export interface DataGridProps extends Partial<MUIDataGridProps> {
  columns: GridColDef[];
  rows: GridRowsProp;
}

const DataGrid: React.FC<DataGridProps> = ({ columns, rows, ...props }) => {
  return (
    <Box sx={{ width: '100%', height: 400, backgroundColor: 'background.paper', borderRadius: 2, p: 2 }}>
      <MUIDataGrid
        columns={columns}
        rows={rows}
        initialState={{
          pagination: {
            paginationModel: { pageSize: 10 }
          }
        }}
        pageSizeOptions={[10, 25, 50]}
        disableRowSelectionOnClick
        autoHeight
        aria-label="Data Grid"
        {...props}
      />
    </Box>
  );
};

export default DataGrid; 
import React from 'react';
import { 
  DataGrid, 
  GridColDef, 
  GridRowsProp,
  GridToolbar,
  GridToolbarContainer,
  GridToolbarFilterButton,
  GridToolbarExport,
  GridToolbarDensitySelector
} from '@mui/x-data-grid';
import { Box, Paper, Typography } from '@mui/material';

interface DataTableProps {
  rows: GridRowsProp;
  columns: GridColDef[];
  loading?: boolean;
  pageSize?: number;
  title?: string;
  autoHeight?: boolean;
  disableSelectionOnClick?: boolean;
  disableColumnMenu?: boolean;
  disableColumnFilter?: boolean;
  disableDensitySelector?: boolean;
  disableExport?: boolean;
  height?: number | string;
  onRowClick?: (params: any) => void;
}

const CustomToolbar = ({ 
  disableColumnFilter,
  disableDensitySelector,
  disableExport
}: {
  disableColumnFilter?: boolean;
  disableDensitySelector?: boolean;
  disableExport?: boolean;
}) => {
  return (
    <GridToolbarContainer>
      {!disableColumnFilter && <GridToolbarFilterButton />}
      {!disableDensitySelector && <GridToolbarDensitySelector />}
      {!disableExport && <GridToolbarExport />}
    </GridToolbarContainer>
  );
};

const DataTable: React.FC<DataTableProps> = ({
  rows,
  columns,
  loading = false,
  pageSize = 10,
  title,
  autoHeight = true,
  disableSelectionOnClick = true,
  disableColumnMenu = false,
  disableColumnFilter = false,
  disableDensitySelector = false,
  disableExport = false,
  height = 400,
  onRowClick
}) => {
  return (
    <Paper elevation={1} sx={{ p: 2 }}>
      {title && (
        <Box mb={2}>
          <Typography variant="h6">{title}</Typography>
        </Box>
      )}
      <Box sx={{ height: autoHeight ? 'auto' : height, width: '100%' }}>
        <DataGrid
          rows={rows}
          columns={columns}
          loading={loading}
          initialState={{
            pagination: {
              paginationModel: { pageSize, page: 0 },
            },
          }}
          pageSizeOptions={[5, 10, 25, 50, 100]}
          disableRowSelectionOnClick={disableSelectionOnClick}
          disableColumnMenu={disableColumnMenu}
          autoHeight={autoHeight}
          slots={{
            toolbar: () => (
              <CustomToolbar
                disableColumnFilter={disableColumnFilter}
                disableDensitySelector={disableDensitySelector}
                disableExport={disableExport}
              />
            ),
          }}
          onRowClick={onRowClick}
        />
      </Box>
    </Paper>
  );
};

export default DataTable; 
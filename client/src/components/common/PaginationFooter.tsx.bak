import React from 'react';
import {
  Box,
  Pagination
} from '@mui/material';

interface PaginationFooterProps {
  page: number;
  totalPages: number;
  onPageChange: (event: React.ChangeEvent<unknown>, value: number) => void;
}

const PaginationFooter: React.FC<PaginationFooterProps> = ({
  page,
  totalPages,
  onPageChange
}) => {
  if (totalPages <= 1) {
    return null;
  }
  
  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
      <Pagination
        count={totalPages}
        page={page}
        onChange={onPageChange}
        color="primary"
      />
    </Box>
  );
};

export default PaginationFooter; 
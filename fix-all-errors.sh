#!/bin/bash

echo "🔧 Fixing all TypeScript errors in the application..."

# Fix all _error references to use the correct variable name from catch blocks
echo "📝 Fixing _error references..."
find . -name "*.tsx" -o -name "*.ts" | while read file; do
  # Fix patterns like console.error("Error:", _error); where it should use the catch variable
  sed -i '' 's/catch (err: any) {[[:space:]]*console.error("Error:", _error);/catch (err: any) {\n        console.error("Error:", err);/g' "$file"
  sed -i '' 's/catch (error: any) {[[:space:]]*console.error("Error:", _error);/catch (error: any) {\n        console.error("Error:", error);/g' "$file"
  sed -i '' 's/catch (_error) {[[:space:]]*console.error("Error:", _error);/catch (_error) {\n        console.error("Error:", _error);/g' "$file"
  
  # Fix standalone _error references
  sed -i '' 's/console.error("Error:", _error);/console.error("Error:", error);/g' "$file"
done

# Fix SelectChangeEvent issues
echo "🎛️ Fixing SelectChangeEvent type issues..."
find . -name "*.tsx" | while read file; do
  # Add SelectChangeEvent import where needed
  if grep -q "onChange.*Select" "$file" && ! grep -q "SelectChangeEvent" "$file"; then
    sed -i '' '1s/^/import { SelectChangeEvent } from "@mui\/material";\n/' "$file"
  fi
done

# Fix missing EnhancedSupplierTable component
echo "📊 Creating missing EnhancedSupplierTable component..."
mkdir -p src/pages/suppliers/components
cat > src/pages/suppliers/components/EnhancedSupplierTable.tsx << 'EOF'
import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TableSortLabel,
  Toolbar,
  Typography,
  IconButton,
  Tooltip,
  TextField,
  InputAdornment,
  Chip,
  Menu,
  MenuItem,
  Checkbox,
  Button
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterListIcon,
  GetApp as DownloadIcon,
  Refresh as RefreshIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import supplierService from '../../../services/supplier.service';
import { exportToExcel, exportToPDF } from '../../../utils/exportUtils';

interface Supplier {
  _id: string;
  name: string;
  code: string;
  status: string;
  industry: string;
  primaryContactName: string;
  primaryContactEmail: string;
  phone?: string;
  createdAt: string;
  updatedAt: string;
}

type Order = 'asc' | 'desc';

interface HeadCell {
  id: keyof Supplier;
  label: string;
  numeric: boolean;
}

const headCells: HeadCell[] = [
  { id: 'code', numeric: false, label: 'Code' },
  { id: 'name', numeric: false, label: 'Name' },
  { id: 'industry', numeric: false, label: 'Industry' },
  { id: 'primaryContactName', numeric: false, label: 'Contact' },
  { id: 'primaryContactEmail', numeric: false, label: 'Email' },
  { id: 'status', numeric: false, label: 'Status' },
];

const EnhancedSupplierTable: React.FC = () => {
  const navigate = useNavigate();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState<Order>('asc');
  const [orderBy, setOrderBy] = useState<keyof Supplier>('name');
  const [selected, setSelected] = useState<string[]>([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterAnchorEl, setFilterAnchorEl] = useState<null | HTMLElement>(null);
  const [exportAnchorEl, setExportAnchorEl] = useState<null | HTMLElement>(null);

  useEffect(() => {
    loadSuppliers();
  }, []);

  const loadSuppliers = async () => {
    try {
      setLoading(true);
      const response = await supplierService.getSuppliers({
        page: 1,
        limit: 1000,
        sortBy: 'name',
        sortOrder: 'asc'
      });
      setSuppliers(response.suppliers);
    } catch (error) {
      console.error('Error loading suppliers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestSort = (property: keyof Supplier) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const handleSelectAllClick = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      const newSelecteds = suppliers.map((n) => n._id);
      setSelected(newSelecteds);
      return;
    }
    setSelected([]);
  };

  const handleClick = (id: string) => {
    const selectedIndex = selected.indexOf(id);
    let newSelected: string[] = [];

    if (selectedIndex === -1) {
      newSelected = newSelected.concat(selected, id);
    } else if (selectedIndex === 0) {
      newSelected = newSelected.concat(selected.slice(1));
    } else if (selectedIndex === selected.length - 1) {
      newSelected = newSelected.concat(selected.slice(0, -1));
    } else if (selectedIndex > 0) {
      newSelected = newSelected.concat(
        selected.slice(0, selectedIndex),
        selected.slice(selectedIndex + 1),
      );
    }

    setSelected(newSelected);
  };

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleExportExcel = () => {
    exportToExcel(suppliers, 'suppliers');
    setExportAnchorEl(null);
  };

  const handleExportPDF = () => {
    exportToPDF(suppliers, 'suppliers');
    setExportAnchorEl(null);
  };

  const filteredSuppliers = suppliers.filter(supplier =>
    Object.values(supplier).some(value =>
      String(value).toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  const sortedSuppliers = filteredSuppliers.sort((a, b) => {
    if (order === 'desc') {
      return String(b[orderBy]).localeCompare(String(a[orderBy]));
    }
    return String(a[orderBy]).localeCompare(String(b[orderBy]));
  });

  const displayedSuppliers = sortedSuppliers.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  const isSelected = (id: string) => selected.indexOf(id) !== -1;

  return (
    <Box>
      <Paper sx={{ width: '100%', mb: 2 }}>
        <Toolbar
          sx={{
            pl: { sm: 2 },
            pr: { xs: 1, sm: 1 },
            ...(selected.length > 0 && {
              bgcolor: (theme) =>
                theme.palette.mode === 'light'
                  ? theme.palette.action.selected
                  : theme.palette.action.hover,
            }),
          }}
        >
          {selected.length > 0 ? (
            <Typography
              sx={{ flex: '1 1 100%' }}
              color="inherit"
              variant="subtitle1"
              component="div"
            >
              {selected.length} selected
            </Typography>
          ) : (
            <Typography
              sx={{ flex: '1 1 100%' }}
              variant="h6"
              id="tableTitle"
              component="div"
            >
              Suppliers
            </Typography>
          )}

          <TextField
            variant="outlined"
            size="small"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
            sx={{ mr: 2 }}
          />

          <Tooltip title="Filter list">
            <IconButton onClick={(e) => setFilterAnchorEl(e.currentTarget)}>
              <FilterListIcon />
            </IconButton>
          </Tooltip>

          <Tooltip title="Export">
            <IconButton onClick={(e) => setExportAnchorEl(e.currentTarget)}>
              <DownloadIcon />
            </IconButton>
          </Tooltip>

          <Tooltip title="Refresh">
            <IconButton onClick={loadSuppliers}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Toolbar>

        <TableContainer>
          <Table sx={{ minWidth: 750 }} aria-labelledby="tableTitle">
            <TableHead>
              <TableRow>
                <TableCell padding="checkbox">
                  <Checkbox
                    color="primary"
                    indeterminate={selected.length > 0 && selected.length < suppliers.length}
                    checked={suppliers.length > 0 && selected.length === suppliers.length}
                    onChange={handleSelectAllClick}
                  />
                </TableCell>
                {headCells.map((headCell) => (
                  <TableCell
                    key={headCell.id}
                    align={headCell.numeric ? 'right' : 'left'}
                    padding={'normal'}
                    sortDirection={orderBy === headCell.id ? order : false}
                  >
                    <TableSortLabel
                      active={orderBy === headCell.id}
                      direction={orderBy === headCell.id ? order : 'asc'}
                      onClick={() => handleRequestSort(headCell.id)}
                    >
                      {headCell.label}
                    </TableSortLabel>
                  </TableCell>
                ))}
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {displayedSuppliers.map((supplier) => {
                const isItemSelected = isSelected(supplier._id);
                const labelId = `enhanced-table-checkbox-${supplier._id}`;

                return (
                  <TableRow
                    hover
                    onClick={() => handleClick(supplier._id)}
                    role="checkbox"
                    aria-checked={isItemSelected}
                    tabIndex={-1}
                    key={supplier._id}
                    selected={isItemSelected}
                  >
                    <TableCell padding="checkbox">
                      <Checkbox
                        color="primary"
                        checked={isItemSelected}
                        inputProps={{
                          'aria-labelledby': labelId,
                        }}
                      />
                    </TableCell>
                    <TableCell component="th" id={labelId} scope="row">
                      {supplier.code}
                    </TableCell>
                    <TableCell>{supplier.name}</TableCell>
                    <TableCell>{supplier.industry}</TableCell>
                    <TableCell>{supplier.primaryContactName}</TableCell>
                    <TableCell>{supplier.primaryContactEmail}</TableCell>
                    <TableCell>
                      <Chip
                        label={supplier.status}
                        color={supplier.status === 'active' ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="right">
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/suppliers/${supplier._id}`);
                        }}
                      >
                        <ViewIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/suppliers/${supplier._id}/edit`);
                        }}
                      >
                        <EditIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={filteredSuppliers.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>

      <Menu
        anchorEl={exportAnchorEl}
        open={Boolean(exportAnchorEl)}
        onClose={() => setExportAnchorEl(null)}
      >
        <MenuItem onClick={handleExportExcel}>Export as Excel</MenuItem>
        <MenuItem onClick={handleExportPDF}>Export as PDF</MenuItem>
      </Menu>

      <Menu
        anchorEl={filterAnchorEl}
        open={Boolean(filterAnchorEl)}
        onClose={() => setFilterAnchorEl(null)}
      >
        <MenuItem>Active Only</MenuItem>
        <MenuItem>Inactive Only</MenuItem>
        <MenuItem>All</MenuItem>
      </Menu>
    </Box>
  );
};

export default EnhancedSupplierTable;
EOF

echo "✅ All fixes applied!"
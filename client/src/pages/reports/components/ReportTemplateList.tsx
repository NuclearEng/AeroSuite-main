import React, { useState } from 'react';
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
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Typography,
  Chip,
  IconButton,
  Tooltip,
  Grid,
  Divider,
  Card,
  CardContent,
  CardActions,
  Avatar,
  SelectChangeEvent
} from '@mui/material';
import {
  Search as SearchIcon,
  Description as DescriptionIcon,
  EditNote as EditNoteIcon,
  BarChart as BarChartIcon,
  TableChart as TableChartIcon,
  PieChart as PieChartIcon,
  Image as ImageIcon,
  Public as PublicIcon,
  Person as PersonIcon,
  Schedule as ScheduleIcon
} from '@mui/icons-material';
import { ReportTemplate } from '../../../services/report.service';
import { format } from 'date-fns';

interface ReportTemplateListProps {
  templates: ReportTemplate[];
  loading: boolean;
  onSelectTemplate: (template: ReportTemplate) => void;
}

const ReportTemplateList: React.FC<ReportTemplateListProps> = ({ 
  templates, 
  loading, 
  onSelectTemplate 
}) => {
  // State
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<string>('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [orderBy, setOrderBy] = useState<keyof ReportTemplate>('updatedAt');
  const [order, setOrder] = useState<'asc' | 'desc'>('desc');
  
  // Handle search change
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(event.target.value);
    setPage(0);
  };
  
  // Handle category filter change
  const handleCategoryChange = (event: SelectChangeEvent) => {
    setCategory(event.target.value);
    setPage(0);
  };
  
  // Handle sort request
  const handleRequestSort = (property: keyof ReportTemplate) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };
  
  // Handle page change
  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };
  
  // Handle rows per page change
  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };
  
  // Filter and sort templates
  const filteredTemplates = templates.filter((template) => {
    const searchMatch = search === '' ||
      template.name.toLowerCase().includes(search.toLowerCase()) ||
      (template.description && template.description.toLowerCase().includes(search.toLowerCase())) ||
      (template.keywords && template.keywords.toLowerCase().includes(search.toLowerCase()));
    
    const categoryMatch = category === '' || template.category === category;
    
    return searchMatch && categoryMatch;
  });
  
  // Sort templates
  const sortedTemplates = [...filteredTemplates].sort((a, b) => {
    const aValue = a[orderBy];
    const bValue = b[orderBy];
    
    if (!aValue || !bValue) return 0;
    
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      if (order === 'asc') {
        return aValue.localeCompare(bValue);
      } else {
        return bValue.localeCompare(aValue);
      }
    }
    
    if (order === 'asc') {
      return aValue < bValue ? -1 : 1;
    } else {
      return bValue < aValue ? -1 : 1;
    }
  });
  
  // Paginate templates
  const paginatedTemplates = sortedTemplates.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );
  
  // Get category icon
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'inspection':
        return <DescriptionIcon />;
      case 'supplier':
        return <PersonIcon />;
      case 'customer':
        return <PersonIcon />;
      case 'performance':
        return <BarChartIcon />;
      default:
        return <DescriptionIcon />;
    }
  };
  
  // Format date
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM d, yyyy');
    } catch (_error) {
      return 'Invalid date';
    }
  };
  
  // Render template cards
  return (
    <Box>
      {/* Filters */}
      <Box sx={{ mb: 3, display: 'flex', gap: 2 }}>
        <TextField
          placeholder="Search templates..."
          variant="outlined"
          size="small"
          value={search}
          onChange={handleSearchChange}
          sx={{ flexGrow: 1 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
        
        <FormControl size="small" sx={{ minWidth: 180 }}>
          <InputLabel id="category-filter-label">Category</InputLabel>
          <Select
            labelId="category-filter-label"
            id="category-filter"
            value={category}
            label="Category"
            onChange={handleCategoryChange}
          >
            <MenuItem value="">All Categories</MenuItem>
            <MenuItem value="inspection">Inspection</MenuItem>
            <MenuItem value="supplier">Supplier</MenuItem>
            <MenuItem value="customer">Customer</MenuItem>
            <MenuItem value="performance">Performance</MenuItem>
            <MenuItem value="general">General</MenuItem>
          </Select>
        </FormControl>
      </Box>
      
      {/* Loading indicator */}
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4, mb: 4 }}>
          <CircularProgress />
        </Box>
      )}
      
      {/* Empty state */}
      {!loading && paginatedTemplates.length === 0 && (
        <Box sx={{ textAlign: 'center', mt: 4, mb: 4 }}>
          <Typography variant="body1" color="text.secondary">
            {search || category
              ? 'No templates match your search criteria'
              : 'No report templates found. Create your first template to get started.'}
          </Typography>
        </Box>
      )}
      
      {/* Template cards */}
      <Grid container spacing={2}>
        {paginatedTemplates.map((template) => (
          <Grid item xs={12} sm={6} md={4} key={template._id}>
            <Card
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                cursor: 'pointer',
                '&:hover': {
                  boxShadow: 3,
                },
              }}
              onClick={() => onSelectTemplate(template)}
            >
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  p: 2,
                  backgroundColor: 'primary.main',
                  color: 'primary.contrastText',
                }}
              >
                <Avatar sx={{ mr: 1, bgcolor: 'white' }}>
                  {getCategoryIcon(template.category)}
                </Avatar>
                <Box>
                  <Typography variant="subtitle1" fontWeight="bold" noWrap>
                    {template.name}
                  </Typography>
                  <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center' }}>
                    <ScheduleIcon fontSize="inherit" sx={{ mr: 0.5 }} />
                    {formatDate(template.updatedAt)}
                    {template.isPublic && (
                      <>
                        <PublicIcon fontSize="inherit" sx={{ ml: 1, mr: 0.5 }} />
                        Public
                      </>
                    )}
                  </Typography>
                </Box>
              </Box>
              
              <CardContent sx={{ flexGrow: 1 }}>
                {template.description && (
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    {template.description.length > 120
                      ? template.description.substring(0, 120) + '...'
                      : template.description}
                  </Typography>
                )}
                
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1 }}>
                  {template.sections.map((section, index) => {
                    let icon;
                    switch (section.type) {
                      case 'table':
                        icon = <TableChartIcon fontSize="small" />;
                        break;
                      case 'chart':
                        icon = section.chartOptions?.type === 'pie' || section.chartOptions?.type === 'doughnut'
                          ? <PieChartIcon fontSize="small" />
                          : <BarChartIcon fontSize="small" />;
                        break;
                      case 'image':
                        icon = <ImageIcon fontSize="small" />;
                        break;
                      default:
                        icon = <EditNoteIcon fontSize="small" />;
                    }
                    
                    return (
                      <Chip
                        key={index}
                        icon={icon}
                        label={section.type}
                        size="small"
                        variant="outlined"
                      />
                    );
                  })}
                </Box>
              </CardContent>
              
              <CardActions sx={{ p: 2, pt: 1 }}>
                <Box sx={{ width: '100%', display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="caption" color="text.secondary">
                    {template.category.charAt(0).toUpperCase() + template.category.slice(1)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {template.sections.length} section{template.sections.length !== 1 ? 's' : ''}
                  </Typography>
                </Box>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>
      
      {/* Pagination */}
      <TablePagination
        component="div"
        count={filteredTemplates.length}
        page={page}
        onPageChange={handleChangePage}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        rowsPerPageOptions={[5, 10, 25]}
        sx={{ mt: 2 }}
      />
    </Box>
  );
};

export default ReportTemplateList; 
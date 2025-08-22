import React, { ChangeEvent, useState } from 'react';
import {
  Box,
  Typography,
  Divider,
  Button,
  Card,
  CardContent,
  CardHeader,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Tab,
  Tabs,
  Alert,
  CircularProgress } from
'@mui/material';
import {
  Add as AddIcon,
  FilterList as FilterListIcon,
  Search as SearchIcon,
  InfoOutlined as InfoIcon } from
'@mui/icons-material';
import ChecklistItemCard from './ChecklistItemCard';
import { ChecklistItem, CATEGORY_INFO } from '../hooks/useSupplierAudit';

interface AuditChecklistProps {
  checklist: ChecklistItem[];
  onAddItem: (item: ChecklistItem) => void;
  onUpdateItem: (itemId: string, updates: Partial<ChecklistItem>) => void;
  onDeleteItem: (itemId: string) => void;
  onAddFinding: (itemId: string, finding: NonNullable<ChecklistItem['findings']>[0]) => void;
  onRemoveFinding: (itemId: string, findingIndex: number) => void;
  loading?: boolean;
  readOnly?: boolean;
}

const AuditChecklist: React.FC<AuditChecklistProps> = ({
  checklist,
  onAddItem,
  onUpdateItem,
  onDeleteItem,
  onAddFinding,
  onRemoveFinding,
  loading = false,
  readOnly = false
}) => {
  const [activeTab, setActiveTab] = useState<any>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newItem, setNewItem] = useState<any>({
    category: 'quality',
    question: '',
    description: '',
    responseType: 'yes-no',
    weight: 1
  });

  // Group checklist items by category
  const groupedItems = React.useMemo(() => {
    // Filter based on search and active tab
    const filteredItems = checklist.filter((item: any) => {
      const matchesSearch =
      searchTerm === '' ||
      item.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description && item.description.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCategory = activeTab === 'all' || item.category === activeTab;

      return matchesSearch && matchesCategory;
    });

    // Group by category
    return filteredItems.reduce((groups, item) => {
      const category = item.category;
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(item);
      return groups;
    }, {} as Record<string, ChecklistItem[]>);
  }, [checklist, searchTerm, activeTab]);

  // Calculate stats
  const stats = React.useMemo(() => {
    const totalItems = checklist.length;
    const completedItems = checklist.filter((item: any) => item.score !== undefined).length;
    const findings = checklist.reduce((count, item) => count + (item.findings?.length || 0), 0);

    return {
      totalItems,
      completedItems,
      completionRate: totalItems > 0 ? Math.round(completedItems / totalItems * 100) : 0,
      findings
    };
  }, [checklist]);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: string) => {
    setActiveTab(newValue);
  };

  const handleAddDialogOpen = () => {
    setShowAddDialog(true);
  };

  const handleAddDialogClose = () => {
    setShowAddDialog(false);
  };

  const handleNewItemChange = (e: React.ChangeEvent<HTMLInputElement | {name?: string;value: any;}>) => {
    const { name, value } = e.target;
    if (name) {
      setNewItem({
        ...newItem,
        [name]: value
      });
    }
  };

  const handleNewItemSelectChange = (event: any) => {
    const { name, value } = event.target;
    if (name) {
      setNewItem({
        ...newItem,
        [name]: value
      });
    }
  };

  const handleAddItem = () => {
    onAddItem(newItem);
    setNewItem({
      category: 'quality',
      question: '',
      description: '',
      responseType: 'yes-no',
      weight: 1
    });
    setShowAddDialog(false);
  };

  // Render category tabs
  const RenderCategoryTabs = () => {
    return (
      <Tabs
        value={activeTab}
        onChange={handleTabChange}
        variant="scrollable"
        scrollButtons="auto"
        sx={{ mb: 3 }}>

        <Tab label="All Categories" value="all" />
        {Object.entries(CATEGORY_INFO).map(([key, info]: any) =>
        <Tab
          key={key}
          label={info.label}
          value={key}
          sx={{
            color: activeTab === key ? info.color : 'inherit',
            '&.Mui-selected': {
              color: info.color
            }
          }} />

        )}
      </Tabs>);

  };

  // Render checklist content
  const RenderChecklist = () => {
    if (loading) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>);

    }

    if (checklist.length === 0) {
      return (
        <Alert severity="info" sx={{ my: 2 }}>
          No checklist items available. {!readOnly && 'Add some items to get started.'}
        </Alert>);

    }

    const categoryKeys = Object.keys(groupedItems);

    if (categoryKeys.length === 0) {
      return (
        <Alert severity="info" sx={{ my: 2 }}>
          No items match the current filters.
        </Alert>);

    }

    return (
      <>
        {categoryKeys.map((category: any) => {
          const items = groupedItems[category];
          const categoryInfo = CATEGORY_INFO[category as keyof typeof CATEGORY_INFO] || {
            label: category,
            color: '#757575',
            icon: 'help'
          };

          return (
            <Box key={category} sx={{ mb: 4 }}>
              <Box sx={{
                display: 'flex',
                alignItems: 'center',
                p: 1.5,
                mb: 2,
                bgcolor: `${categoryInfo.color}10`,
                borderRadius: 1
              }}>
                <Box
                  sx={{
                    width: 16,
                    height: 16,
                    borderRadius: '50%',
                    bgcolor: categoryInfo.color,
                    mr: 2
                  }} />

                <Typography variant="h6" sx={{ color: categoryInfo.color }}>
                  {categoryInfo.label}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ ml: 2 }}>
                  {items.length} item{items.length !== 1 ? 's' : ''}
                </Typography>
              </Box>
              
              {items.map((item: any) =>
              <ChecklistItemCard
                key={item._id || item.question}
                item={item}
                onUpdate={onUpdateItem}
                onDelete={onDeleteItem}
                onAddFinding={onAddFinding}
                onRemoveFinding={onRemoveFinding}
                readOnly={readOnly} />

              )}
            </Box>);

        })}
      </>);

  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" component="h2">
          Audit Checklist
        </Typography>
        
        {!readOnly &&
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleAddDialogOpen}>

            Add Item
          </Button>
        }
      </Box>

      
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Total Items
              </Typography>
              <Typography variant="h4">
                {stats.totalItems}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Completion Rate
              </Typography>
              <Typography variant="h4">
                {stats.completionRate}%
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Items Completed
              </Typography>
              <Typography variant="h4">
                {stats.completedItems} / {stats.totalItems}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Total Findings
              </Typography>
              <Typography variant="h4" color={stats.findings > 0 ? 'error.main' : 'inherit'}>
                {stats.findings}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center' }}>
        <TextField
          placeholder="Search checklist items..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          variant="outlined"
          size="small"
          fullWidth
          InputProps={{
            startAdornment: <SearchIcon color="action" sx={{ mr: 1 }} />
          }}
          sx={{ mr: 2 }} />

      </Box>

      
      {RenderCategoryTabs()}

      
      {RenderChecklist()}

      
      <Dialog open={showAddDialog} onClose={handleAddDialogClose} maxWidth="sm" fullWidth>
        <DialogTitle>Add Checklist Item</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12}>
              <TextField
                name="question"
                label="Question"
                fullWidth
                value={newItem.question}
                onChange={handleNewItemChange}
                required />

            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Category</InputLabel>
                <Select
                  name="category"
                  value={newItem.category}
                  onChange={handleNewItemSelectChange}
                  label="Category">

                  {Object.entries(CATEGORY_INFO).map(([key, value]: any) =>
                  <MenuItem key={key} value={key}>
                      {value.label}
                    </MenuItem>
                  )}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Response Type</InputLabel>
                <Select
                  name="responseType"
                  value={newItem.responseType}
                  onChange={handleNewItemSelectChange}
                  label="Response Type">

                  <MenuItem value="yes-no">Yes/No</MenuItem>
                  <MenuItem value="scale">Scale (1-5)</MenuItem>
                  <MenuItem value="text">Text</MenuItem>
                  <MenuItem value="multiple-choice">Multiple Choice</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                name="description"
                label="Description"
                fullWidth
                multiline
                rows={2}
                value={newItem.description}
                onChange={handleNewItemChange} />

            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                name="weight"
                label="Weight (0-1)"
                type="number"
                fullWidth
                inputProps={{ min: 0, max: 1, step: 0.1 }}
                value={newItem.weight}
                onChange={handleNewItemChange} />

            </Grid>
            
            {newItem.responseType === 'multiple-choice' &&
            <Grid item xs={12}>
                <TextField
                name="options"
                label="Options (comma separated)"
                fullWidth
                value={newItem.options ? newItem.options.join(', ') : ''}
                onChange={(e) => setNewItem({
                  ...newItem,
                  options: e.target.value.split(',').map((opt: any) => opt.trim())
                })}
                helperText="Enter options separated by commas" />

              </Grid>
            }
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleAddDialogClose} color="inherit">
            Cancel
          </Button>
          <Button
            onClick={handleAddItem}
            color="primary"
            variant="contained"
            disabled={!newItem.question}>

            Add Item
          </Button>
        </DialogActions>
      </Dialog>
    </Box>);

};

export default AuditChecklist;
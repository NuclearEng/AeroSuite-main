import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  IconButton,
  TextField,
  FormControl,
  RadioGroup,
  FormControlLabel,
  Radio,
  MenuItem,
  Select,
  InputLabel,
  Rating,
  Button,
  Collapse,
  Divider,
  Stack,
  Badge,
  Tooltip,
  Alert,
  Grid } from
'@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  InfoOutlined as InfoIcon,
  Add as AddIcon } from
'@mui/icons-material';
import { ChecklistItem, CATEGORY_INFO, FINDING_TYPE_INFO } from '../hooks/useSupplierAudit';

interface ChecklistItemCardProps {
  item: ChecklistItem;
  onUpdate: (itemId: string, updates: Partial<ChecklistItem>) => void;
  onDelete: (itemId: string) => void;
  onAddFinding: (itemId: string, finding: ChecklistItem['findings'][0]) => void;
  onRemoveFinding: (itemId: string, findingIndex: number) => void;
  readOnly?: boolean;
}

const ChecklistItemCard: React.FC<ChecklistItemCardProps> = ({
  item,
  onUpdate,
  onDelete,
  onAddFinding,
  onRemoveFinding,
  readOnly = false
}) => {
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [showFindingForm, setShowFindingForm] = useState(false);
  const [editedItem, setEditedItem] = useState<Partial<ChecklistItem>>(item);
  const [newFinding, setNewFinding] = useState<ChecklistItem['findings'][0]>({
    type: 'observation',
    description: '',
    correctiveAction: '',
    dueDate: undefined
  });

  const categoryInfo = CATEGORY_INFO[item.category as keyof typeof CATEGORY_INFO] || {
    label: item.category,
    color: '#757575',
    icon: 'help'
  };

  const handleToggleExpand = () => {
    setExpanded(!expanded);
  };

  const handleEditStart = () => {
    setEditedItem(item);
    setEditing(true);
  };

  const handleEditCancel = () => {
    setEditing(false);
  };

  const handleEditSave = () => {
    onUpdate(item._id || item.question, editedItem);
    setEditing(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | {name?: string;value: unknown;}>) => {
    const { name, value } = e.target;
    if (name) {
      setEditedItem({
        ...editedItem,
        [name]: value
      });
    }
  };

  const handleScoreChange = (_event: React.SyntheticEvent, newValue: number | null) => {
    setEditedItem({
      ...editedItem,
      score: newValue || 0
    });
  };

  const handleNewFindingChange = (e: React.ChangeEvent<HTMLInputElement | {name?: string;value: unknown;}>) => {
    const { name, value } = e.target;
    if (name) {
      setNewFinding({
        ...newFinding,
        [name]: value
      });
    }
  };

  const handleAddFinding = () => {
    onAddFinding(item._id || item.question, newFinding);
    setNewFinding({
      type: 'observation',
      description: '',
      correctiveAction: '',
      dueDate: undefined
    });
    setShowFindingForm(false);
  };

  // Determine response display based on type
  const RenderResponse = () => {
    if (readOnly) {
      switch (item.responseType) {
        case 'yes-no':
          return (
            <Typography variant="body2" fontWeight="medium">
              {item.score === 5 ? 'Yes' : item.score === 0 ? 'No' : 'N/A'}
            </Typography>);

        case 'scale':
          return (
            <Rating
              value={item.score}
              readOnly
              max={5}
              size="small" />);


        case 'text':
          return (
            <Typography variant="body2">
              {item.evidence || 'No response provided'}
            </Typography>);

        case 'multiple-choice':
          return (
            <Typography variant="body2" fontWeight="medium">
              {item.evidence || 'No option selected'}
            </Typography>);

        default:
          return null;
      }
    }

    // Editable responses
    switch (item.responseType) {
      case 'yes-no':
        return (
          <FormControl component="fieldset">
            <RadioGroup
              row
              name="score"
              value={editedItem.score || 0}
              onChange={(e) => setEditedItem({
                ...editedItem,
                score: parseInt(e.target.value, 10)
              })}>

              <FormControlLabel value={5} control={<Radio />} label="Yes" />
              <FormControlLabel value={0} control={<Radio />} label="No" />
              <FormControlLabel value={null} control={<Radio />} label="N/A" />
            </RadioGroup>
          </FormControl>);

      case 'scale':
        return (
          <Box>
            <Typography component="legend" variant="body2" gutterBottom>
              Rating (1-5)
            </Typography>
            <Rating
              name="score"
              value={editedItem.score || 0}
              onChange={handleScoreChange}
              max={5} />

          </Box>);

      case 'text':
        return (
          <TextField
            fullWidth
            multiline
            rows={2}
            name="evidence"
            label="Evidence/Comments"
            value={editedItem.evidence || ''}
            onChange={handleInputChange}
            variant="outlined"
            size="small"
            margin="normal" />);


      case 'multiple-choice':
        return (
          <FormControl fullWidth margin="normal" size="small">
            <InputLabel>Select Option</InputLabel>
            <Select
              name="evidence"
              value={editedItem.evidence || ''}
              onChange={handleInputChange}
              label="Select Option">

              {item.options?.map((option, index) =>
              <MenuItem key={index} value={option}>
                  {option}
                </MenuItem>
              )}
            </Select>
          </FormControl>);

      default:
        return null;
    }
  };

  return (
    <Card
      variant="outlined"
      sx={{
        mb: 2,
        borderLeft: `4px solid ${categoryInfo.color}`,
        transition: 'all 0.2s'
      }}>

      <CardContent sx={{ pb: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <Chip
                label={categoryInfo.label}
                size="small"
                sx={{
                  bgcolor: `${categoryInfo.color}20`,
                  color: categoryInfo.color,
                  fontWeight: 'medium',
                  mr: 1
                }} />

              
              {item.findings && item.findings.length > 0 &&
              <Badge
                badgeContent={item.findings.length}
                color="error"
                sx={{ mr: 1 }}>

                  <Chip
                  label="Findings"
                  size="small"
                  color="warning" />

                </Badge>
              }
            </Box>
            
            <Typography variant="subtitle1" component="div" fontWeight="medium">
              {item.question}
            </Typography>
          </Box>
          
          <Box>
            {!readOnly &&
            <>
                {editing ?
              <>
                    <IconButton size="small" onClick={handleEditSave} color="primary">
                      <SaveIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small" onClick={handleEditCancel} color="inherit">
                      <CancelIcon fontSize="small" />
                    </IconButton>
                  </> :

              <>
                    <IconButton size="small" onClick={handleEditStart} color="primary">
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small" onClick={() => onDelete(item._id || item.question)} color="error">
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </>
              }
              </>
            }
            <IconButton size="small" onClick={handleToggleExpand}>
              {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </IconButton>
          </Box>
        </Box>
        
        {item.description &&
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1, mb: 2 }}>
            {item.description}
          </Typography>
        }
        
        <Box sx={{ mt: 2 }}>
          {editing ?
          // Edit mode
          RenderResponse() :

          // View mode
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                Response:
              </Typography>
              {RenderResponse()}
            </Box>
          }
        </Box>
        
        <Collapse in={expanded}>
          <Divider sx={{ my: 2 }} />
          
          {editing &&
          <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Item Details
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TextField
                  fullWidth
                  name="question"
                  label="Question"
                  value={editedItem.question || ''}
                  onChange={handleInputChange}
                  variant="outlined"
                  size="small" />

                </Grid>
                
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Category</InputLabel>
                    <Select
                    name="category"
                    value={editedItem.category || ''}
                    onChange={handleInputChange}
                    label="Category">

                      {Object.entries(CATEGORY_INFO).map(([key, value]) =>
                    <MenuItem key={key} value={key}>
                          {value.label}
                        </MenuItem>
                    )}
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12}>
                  <TextField
                  fullWidth
                  name="description"
                  label="Description"
                  value={editedItem.description || ''}
                  onChange={handleInputChange}
                  variant="outlined"
                  size="small"
                  multiline
                  rows={2} />

                </Grid>
                
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Response Type</InputLabel>
                    <Select
                    name="responseType"
                    value={editedItem.responseType || 'yes-no'}
                    onChange={handleInputChange}
                    label="Response Type">

                      <MenuItem value="yes-no">Yes/No</MenuItem>
                      <MenuItem value="scale">Scale (1-5)</MenuItem>
                      <MenuItem value="text">Text</MenuItem>
                      <MenuItem value="multiple-choice">Multiple Choice</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <TextField
                  fullWidth
                  name="weight"
                  label="Weight (0-1)"
                  type="number"
                  inputProps={{ min: 0, max: 1, step: 0.1 }}
                  value={editedItem.weight || 1}
                  onChange={handleInputChange}
                  variant="outlined"
                  size="small" />

                </Grid>
                
                {editedItem.responseType === 'multiple-choice' &&
              <Grid item xs={12}>
                    <TextField
                  fullWidth
                  name="options"
                  label="Options (comma separated)"
                  value={editedItem.options ? editedItem.options.join(', ') : ''}
                  onChange={(e) => setEditedItem({
                    ...editedItem,
                    options: e.target.value.split(',').map((opt) => opt.trim())
                  })}
                  variant="outlined"
                  size="small"
                  helperText="Enter options separated by commas" />

                  </Grid>
              }
              </Grid>
            </Box>
          }
          
          <Box sx={{ mt: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="subtitle2">
                Findings ({item.findings?.length || 0})
              </Typography>
              
              {!readOnly && !showFindingForm &&
              <Button
                startIcon={<AddIcon />}
                size="small"
                onClick={() => setShowFindingForm(true)}>

                  Add Finding
                </Button>
              }
            </Box>
            
            {showFindingForm &&
            <Box sx={{ p: 2, bgcolor: 'background.default', borderRadius: 1, mb: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  New Finding
                </Typography>
                
                <FormControl fullWidth margin="dense" size="small">
                  <InputLabel>Finding Type</InputLabel>
                  <Select
                  name="type"
                  value={newFinding.type}
                  onChange={handleNewFindingChange}
                  label="Finding Type">

                    {Object.entries(FINDING_TYPE_INFO).map(([key, value]) =>
                  <MenuItem key={key} value={key}>
                        {value.label}
                      </MenuItem>
                  )}
                  </Select>
                </FormControl>
                
                <TextField
                fullWidth
                name="description"
                label="Description"
                value={newFinding.description || ''}
                onChange={handleNewFindingChange}
                variant="outlined"
                size="small"
                margin="dense"
                multiline
                rows={2} />

                
                <TextField
                fullWidth
                name="correctiveAction"
                label="Corrective Action"
                value={newFinding.correctiveAction || ''}
                onChange={handleNewFindingChange}
                variant="outlined"
                size="small"
                margin="dense"
                multiline
                rows={2} />

                
                <TextField
                fullWidth
                name="dueDate"
                label="Due Date"
                type="date"
                value={newFinding.dueDate ? new Date(newFinding.dueDate).toISOString().split('T')[0] : ''}
                onChange={(e) => setNewFinding({
                  ...newFinding,
                  dueDate: e.target.value ? new Date(e.target.value) : undefined
                })}
                variant="outlined"
                size="small"
                margin="dense"
                InputLabelProps={{ shrink: true }} />

                
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                  <Button
                  variant="outlined"
                  color="inherit"
                  size="small"
                  onClick={() => setShowFindingForm(false)}
                  sx={{ mr: 1 }}>

                    Cancel
                  </Button>
                  <Button
                  variant="contained"
                  color="primary"
                  size="small"
                  onClick={handleAddFinding}
                  disabled={!newFinding.description}>

                    Add Finding
                  </Button>
                </Box>
              </Box>
            }
            
            {item.findings && item.findings.length > 0 ?
            <Stack spacing={1}>
                {item.findings.map((finding, index) => {
                const findingInfo = FINDING_TYPE_INFO[finding.type as keyof typeof FINDING_TYPE_INFO];
                return (
                  <Box
                    key={index}
                    sx={{
                      p: 1,
                      bgcolor: `${findingInfo.color}10`,
                      borderRadius: 1,
                      border: `1px solid ${findingInfo.color}40`
                    }}>

                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Chip
                        label={findingInfo.label}
                        size="small"
                        sx={{
                          bgcolor: findingInfo.color,
                          color: 'white',
                          fontWeight: 'medium',
                          mb: 1
                        }} />

                        
                        {!readOnly &&
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => onRemoveFinding(item._id || item.question, index)}>

                            <DeleteIcon fontSize="small" />
                          </IconButton>
                      }
                      </Box>
                      
                      <Typography variant="body2" fontWeight="medium">
                        {finding.description}
                      </Typography>
                      
                      {finding.correctiveAction &&
                    <Box sx={{ mt: 1 }}>
                          <Typography variant="caption" color="text.secondary">
                            Corrective Action:
                          </Typography>
                          <Typography variant="body2">
                            {finding.correctiveAction}
                          </Typography>
                        </Box>
                    }
                      
                      {finding.dueDate &&
                    <Box sx={{ mt: 0.5 }}>
                          <Typography variant="caption" color="text.secondary">
                            Due Date:
                          </Typography>
                          <Typography variant="body2">
                            {new Date(finding.dueDate).toLocaleDateString()}
                          </Typography>
                        </Box>
                    }
                    </Box>);

              })}
              </Stack> :

            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                No findings recorded for this item
              </Typography>
            }
          </Box>
        </Collapse>
      </CardContent>
    </Card>);

};

export default ChecklistItemCard;
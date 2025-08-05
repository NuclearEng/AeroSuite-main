import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  IconButton,
  InputAdornment,
  Stack,
  Chip
} from '@mui/material';
import { blue, green, purple, orange, grey } from '@mui/material/colors';

// Mock form component that simulates a heavy UI with many inputs and state
const HeavyComponent3: React.FC = () => {
  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    tags: [] as string[],
    currentTag: '',
    category: '',
    priority: '',
    assignee: '',
  });
  
  // Predefined tags for suggestions
  const tagSuggestions = [
    'Frontend', 'Backend', 'API', 'Database', 'UI/UX', 
    'Performance', 'Security', 'Testing', 'Documentation'
  ];
  
  // Mock team members
  const teamMembers = [
    { id: 1, name: 'Alex Johnson', role: 'Frontend Developer', avatar: 'A' },
    { id: 2, name: 'Taylor Smith', role: 'Backend Developer', avatar: 'T' },
    { id: 3, name: 'Jordan Lee', role: 'UX Designer', avatar: 'J' },
    { id: 4, name: 'Casey Brown', role: 'Product Manager', avatar: 'C' },
    { id: 5, name: 'Morgan Wilson', role: 'QA Engineer', avatar: 'M' },
  ];
  
  // Handle input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };
  
  // Handle tag input changes
  const handleTagChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      currentTag: e.target.value
    });
  };
  
  // Add a tag
  const addTag = () => {
    if (formData.currentTag.trim() && !formData.tags.includes(formData.currentTag.trim())) {
      setFormData({
        ...formData,
        tags: [...formData.tags, formData.currentTag.trim()],
        currentTag: ''
      });
    }
  };
  
  // Remove a tag
  const removeTag = (tagToRemove: string) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter(tag => tag !== tagToRemove)
    });
  };
  
  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted:', formData);
    // In a real app, this would trigger an API call
  };
  
  // Get avatar color based on id
  const getAvatarColor = (id: number) => {
    const colors = [blue[500], green[500], purple[500], orange[500], grey[700]];
    return colors[id % colors.length];
  };
  
  return (
    <Box width="100%">
      <Typography variant="h5" gutterBottom color="info.main">
        Complex Form Component
      </Typography>
      <Typography variant="body2" paragraph>
        This component simulates a heavy form with complex state management that would be 
        expensive to load upfront. It's dynamically imported only when needed.
      </Typography>
      
      <Paper 
        component="form" 
        onSubmit={handleSubmit}
        sx={{ p: 3 }}
      >
        <Stack spacing={3}>
          <TextField
            label="Title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            fullWidth
            required
            variant="outlined"
          />
          
          <TextField
            label="Description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            fullWidth
            multiline
            rows={3}
            variant="outlined"
          />
          
          <Box>
            <TextField
              label="Tags"
              name="currentTag"
              value={formData.currentTag}
              onChange={handleTagChange}
              fullWidth
              variant="outlined"
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <Button 
                      onClick={addTag}
                      variant="contained" 
                      size="small"
                      disabled={!formData.currentTag.trim()}
                    >
                      Add
                    </Button>
                  </InputAdornment>
                ),
              }}
              helperText="Press 'Add' or Enter to add a tag"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addTag();
                }
              }}
            />
            
            <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {formData.tags.map((tag, index) => (
                <Chip
                  key={index}
                  label={tag}
                  onDelete={() => removeTag(tag)}
                  color="primary"
                  variant="outlined"
                  size="small"
                />
              ))}
            </Box>
            
            <Box sx={{ mt: 1 }}>
              <Typography variant="caption" color="text.secondary">
                Suggestions:
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                {tagSuggestions.map((tag) => (
                  <Chip
                    key={tag}
                    label={tag}
                    size="small"
                    variant="outlined"
                    onClick={() => {
                      if (!formData.tags.includes(tag)) {
                        setFormData({
                          ...formData,
                          tags: [...formData.tags, tag]
                        });
                      }
                    }}
                    sx={{ 
                      opacity: formData.tags.includes(tag) ? 0.5 : 1,
                      pointerEvents: formData.tags.includes(tag) ? 'none' : 'auto'
                    }}
                  />
                ))}
              </Box>
            </Box>
          </Box>
          
          <Divider>Assignee</Divider>
          
          <List sx={{ bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
            {teamMembers.map((member) => (
              <ListItem
                key={member.id}
                secondaryAction={
                  <Button
                    variant={formData.assignee === member.name ? "contained" : "outlined"}
                    size="small"
                    onClick={() => setFormData({
                      ...formData,
                      assignee: formData.assignee === member.name ? '' : member.name
                    })}
                  >
                    {formData.assignee === member.name ? "Assigned" : "Assign"}
                  </Button>
                }
              >
                <ListItemAvatar>
                  <Avatar sx={{ bgcolor: getAvatarColor(member.id) }}>
                    {member.avatar}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={member.name}
                  secondary={member.role}
                />
              </ListItem>
            ))}
          </List>
          
          <Button 
            type="submit" 
            variant="contained" 
            color="primary" 
            size="large"
            disabled={!formData.title || !formData.description || formData.tags.length === 0}
          >
            Submit Form
          </Button>
        </Stack>
      </Paper>
      
      <Paper 
        sx={{ 
          p: 2, 
          mt: 3, 
          backgroundColor: 'rgba(25, 118, 210, 0.05)',
          border: '1px solid rgba(25, 118, 210, 0.2)',
        }}
      >
        <Typography variant="subtitle1" gutterBottom>
          Component Size Metrics
        </Typography>
        <Typography variant="body2">
          • Bundle Size: ~78KB (when built)<br />
          • State Management: Complex form with multiple inputs and validations<br />
          • Dependencies: MUI form components, state handling<br />
          • Time Saved: ~260ms on initial page load
        </Typography>
      </Paper>
    </Box>
  );
};

export default HeavyComponent3; 
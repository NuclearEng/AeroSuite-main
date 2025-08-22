import React from 'react';
import {
  Box,
  TextField,
  Button,
  InputAdornment,
  Chip,
  Typography
} from '@mui/material';

interface TagInputProps {
  currentTag: string;
  tags: string[];
  suggestions: string[];
  onTagChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onAddTag: () => void;
  onRemoveTag: (tag: string) => void;
  onSuggestionClick: (tag: string) => void;
}

const TagInput: React.FC<TagInputProps> = ({
  currentTag,
  tags,
  suggestions,
  onTagChange,
  onAddTag,
  onRemoveTag,
  onSuggestionClick
}) => {
  return (
    <Box>
      <TextField
        label="Tags"
        name="currentTag"
        value={currentTag}
        onChange={onTagChange}
        fullWidth
        variant="outlined"
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
              <Button 
                onClick={onAddTag}
                variant="contained" 
                size="small"
                disabled={!currentTag.trim()}
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
            onAddTag();
          }
        }}
      />
      
      <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
        {tags.map((tag, index) => (
          <Chip
            key={index}
            label={tag}
            onDelete={() => onRemoveTag(tag)}
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
          {suggestions.map((tag) => (
            <Chip
              key={tag}
              label={tag}
              size="small"
              variant="outlined"
              onClick={() => onSuggestionClick(tag)}
              sx={{ 
                opacity: tags.includes(tag) ? 0.5 : 1,
                pointerEvents: tags.includes(tag) ? 'none' : 'auto'
              }}
            />
          ))}
        </Box>
      </Box>
    </Box>
  );
};

export default TagInput; 
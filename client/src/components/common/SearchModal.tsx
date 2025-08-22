import React, { ChangeEvent, useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Typography,
  IconButton,
  InputAdornment,
  List,
  ListItem,
  ListItemText,
  ListItemButton,
  Chip,
  Divider,
  CircularProgress,
  Alert,
  useTheme,
  useMediaQuery,
  Tabs,
  Tab,
  Badge,
} from '@mui/material';
import {
  Search as SearchIcon,
  Close as CloseIcon,
  Clear as ClearIcon,
  TrendingUp as TrendingIcon,
  History as HistoryIcon,
  FilterList as FilterIcon,
} from '@mui/icons-material';
import { debounce } from 'lodash';

interface SearchResult {
  id: string;
  title: string;
  description?: string;
  type: 'supplier' | 'customer' | 'inspection' | 'report' | 'user';
  url: string;
  metadata?: Record<string, any>;
}

interface SearchModalProps {
  open: boolean;
  onClose: () => void;
  onSearch?: (query: string, filters?: SearchFilters) => Promise<SearchResult[]>;
  onResultClick?: (result: SearchResult) => void;
  placeholder?: string;
  showFilters?: boolean;
  showRecentSearches?: boolean;
  showTrending?: boolean;
  recentSearches?: string[];
  trendingSearches?: string[];
}

interface SearchFilters {
  type?: string[];
  dateFrom?: Date;
  dateTo?: Date;
  status?: string[];
}

const SearchModal: React.FC<SearchModalProps> = ({
  open,
  onClose,
  onSearch,
  onResultClick,
  placeholder = 'Search for suppliers, customers, inspections...',
  showFilters = true,
  showRecentSearches = true,
  showTrending = true,
  recentSearches = [],
  trendingSearches = [],
}) => {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));
  
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<any>(null);
  const [selectedTab, setSelectedTab] = useState(0);
  const [filters, setFilters] = useState<any>({});
  const [showFilterDialog, setShowFilterDialog] = useState(false);

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce(async (searchQuery: string) => {
      if (!searchQuery.trim() || !onSearch) {
        setResults([]);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const searchResults = await onSearch(searchQuery, filters);
        setResults(searchResults);
      } catch (err: any) {
        setError(err.message || 'Search failed. Please try again.');
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300),
    [onSearch, filters]
  );

  useEffect(() => {
    if (query) {
      debouncedSearch(query);
    } else {
      setResults([]);
    }
  }, [query, debouncedSearch]);

  const handleQueryChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(event.target.value);
  };

  const handleClearQuery = () => {
    setQuery('');
    setResults([]);
    setError(null);
  };

  const handleResultClick = (result: SearchResult) => {
    if (onResultClick) {
      onResultClick(result);
    }
    onClose();
  };

  const handleRecentSearchClick = (search: string) => {
    setQuery(search);
  };

  const handleClose = () => {
    setQuery('');
    setResults([]);
    setError(null);
    onClose();
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      supplier: 'primary',
      customer: 'secondary',
      inspection: 'success',
      report: 'info',
      user: 'warning',
    };
    return colors[type] || 'default';
  };

  const getTypeIcon = (type: string) => {
    // Icons would be imported and mapped here
    return type.charAt(0).toUpperCase();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      fullScreen={fullScreen}
      TransitionProps={{
        onEntered: () => {
          // Focus search input when dialog opens
          const searchInput = document.getElementById('search-modal-input');
          if (searchInput) {
            searchInput.focus();
          }
        },
      }}
    >
      <DialogTitle sx={{ pb: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <TextField
            id="search-modal-input"
            fullWidth
            variant="outlined"
            placeholder={placeholder}
            value={query}
            onChange={handleQueryChange}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
              endAdornment: query && (
                <InputAdornment position="end">
                  <IconButton onClick={handleClearQuery} size="small">
                    <ClearIcon />
                  </IconButton>
                </InputAdornment>
              ),
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
              },
            }}
          />
          <IconButton onClick={handleClose} edge="end">
            <CloseIcon />
          </IconButton>
        </Box>

        {(showRecentSearches || showTrending || showFilters) && (
          <Box sx={{ mt: 2 }}>
            <Tabs value={selectedTab} onChange={(_, v) => setSelectedTab(v)}>
              {query && <Tab label="Results" />}
              {showRecentSearches && <Tab label="Recent" icon={<HistoryIcon />} iconPosition="start" />}
              {showTrending && <Tab label="Trending" icon={<TrendingIcon />} iconPosition="start" />}
              {showFilters && (
                <Tab 
                  label="Filters" 
                  icon={
                    <Badge 
                      badgeContent={Object.keys(filters).length} 
                      color="primary"
                    >
                      <FilterIcon />
                    </Badge>
                  } 
                  iconPosition="start" 
                />
              )}
            </Tabs>
          </Box>
        )}
      </DialogTitle>

      <DialogContent dividers sx={{ p: 0, minHeight: 400 }}>
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        )}

        {error && (
          <Box sx={{ p: 2 }}>
            <Alert severity="error">{error}</Alert>
          </Box>
        )}

        {!loading && !error && query && results.length === 0 && (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="body1" color="text.secondary">
              No results found for "{query}"
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Try different keywords or adjust your filters
            </Typography>
          </Box>
        )}

        {!loading && !error && results.length > 0 && (
          <List>
            {results.map((result: any, index: number) => (
              <React.Fragment key={result.id}>
                <ListItemButton onClick={() => handleResultClick(result)}>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="subtitle1">{result.title}</Typography>
                        <Chip
                          label={result.type}
                          size="small"
                          color={getTypeColor(result.type) as any}
                          sx={{ height: 20 }}
                        />
                      </Box>
                    }
                    secondary={result.description}
                  />
                </ListItemButton>
                {index < results.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        )}

        {!loading && !query && showRecentSearches && selectedTab === 1 && (
          <List>
            {recentSearches.length === 0 ? (
              <ListItem>
                <ListItemText
                  primary="No recent searches"
                  secondary="Your search history will appear here"
                />
              </ListItem>
            ) : (
              recentSearches.map((search, index: any) => (
                <React.Fragment key={index}>
                  <ListItemButton onClick={() => handleRecentSearchClick(search)}>
                    <ListItemText primary={search} />
                  </ListItemButton>
                  {index < recentSearches.length - 1 && <Divider />}
                </React.Fragment>
              ))
            )}
          </List>
        )}

        {!loading && !query && showTrending && selectedTab === 2 && (
          <List>
            {trendingSearches.length === 0 ? (
              <ListItem>
                <ListItemText
                  primary="No trending searches"
                  secondary="Popular searches will appear here"
                />
              </ListItem>
            ) : (
              trendingSearches.map((search, index: any) => (
                <React.Fragment key={index}>
                  <ListItemButton onClick={() => handleRecentSearchClick(search)}>
                    <ListItemText 
                      primary={search}
                      secondary={`Trending`}
                    />
                  </ListItemButton>
                  {index < trendingSearches.length - 1 && <Divider />}
                </React.Fragment>
              ))
            )}
          </List>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Typography variant="caption" color="text.secondary" sx={{ flex: 1 }}>
          Press ESC to close • Use arrow keys to navigate
        </Typography>
        <Button onClick={handleClose} color="inherit">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SearchModal;
import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemButton,
  Grid,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
  Divider
} from '@mui/material';
import {
  useKeyboardNavigableList,
  useKeyboardNavigableGrid,
  useKeyboardNavigableTablist,
  useKeyboardNavigableMenu
} from '../../hooks/useKeyboardNavigation';

/**
 * Component to demonstrate keyboard navigation utilities
 */
const KeyboardNavigableDemo: React.FC = () => {
  const [selectedListItem, setSelectedListItem] = useState<number | null>(null);
  const [selectedGridItem, setSelectedGridItem] = useState<string | null>(null);
  const [selectedTabIndex, setSelectedTabIndex] = useState<number>(0);
  const [selectedMenuItem, setSelectedMenuItem] = useState<number | null>(null);
  
  // Keyboard navigable list
  const { containerRef: listRef, controller: listController } = useKeyboardNavigableList({
    onItemSelect: (item, index) => {
      setSelectedListItem(index);
    }
  });
  
  // Keyboard navigable grid
  const { containerRef: gridRef, controller: gridController } = useKeyboardNavigableGrid({
    onItemSelect: (item) => {
      setSelectedGridItem(item.textContent || null);
    }
  });
  
  // Keyboard navigable tabs
  const { containerRef: tabsRef, controller: tabsController } = useKeyboardNavigableTablist({
    onItemSelect: (item, index) => {
      setSelectedTabIndex(index);
    }
  });
  
  // Keyboard navigable menu
  const { containerRef: menuRef, controller: menuController } = useKeyboardNavigableMenu({
    onItemSelect: (item, index) => {
      setSelectedMenuItem(index);
    }
  });
  
  // Handle tab change
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setSelectedTabIndex(newValue);
  };
  
  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        Keyboard Navigation Demo
      </Typography>
      
      <Alert severity="info" sx={{ mb: 3 }}>
        Use keyboard arrow keys, Home, End, Enter, and Space to navigate these components.
        Tab to move between different components.
      </Alert>
      
      <Grid container spacing={4}>
        <Grid item xs={12} md={6}>
          <Typography variant="h6" gutterBottom>
            Keyboard Navigable List
          </Typography>
          
          <List 
            ref={listRef as React.RefObject<HTMLUListElement>} 
            component="ul"
            aria-label="Keyboard navigable list"
            sx={{ 
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 1,
              mb: 2
            }}
          >
            {['Item 1', 'Item 2', 'Item 3', 'Item 4', 'Item 5'].map((item, index) => (
              <ListItem key={index} disablePadding>
                <ListItemButton
                  selected={selectedListItem === index}
                  tabIndex={index === 0 ? 0 : -1}
                >
                  <ListItemText primary={item} />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
          
          {selectedListItem !== null && (
            <Typography variant="body2">
              Selected: Item {selectedListItem + 1}
            </Typography>
          )}
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Typography variant="h6" gutterBottom>
            Keyboard Navigable Menu
          </Typography>
          
          <List 
            ref={menuRef as React.RefObject<HTMLUListElement>}
            component="ul"
            role="menu"
            aria-label="Keyboard navigable menu"
            sx={{ 
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 1,
              mb: 2
            }}
          >
            {['Menu Item 1', 'Menu Item 2', 'Menu Item 3', 'Menu Item 4'].map((item, index) => (
              <ListItem key={index} disablePadding>
                <ListItemButton
                  role="menuitem"
                  selected={selectedMenuItem === index}
                  tabIndex={index === 0 ? 0 : -1}
                >
                  <ListItemText primary={item} />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
          
          {selectedMenuItem !== null && (
            <Typography variant="body2">
              Selected: Menu Item {selectedMenuItem + 1}
            </Typography>
          )}
        </Grid>
        
        <Grid item xs={12}>
          <Divider sx={{ my: 2 }} />
          
          <Typography variant="h6" gutterBottom>
            Keyboard Navigable Tabs
          </Typography>
          
          <Tabs
            ref={tabsRef as React.RefObject<HTMLDivElement>}
            value={selectedTabIndex}
            onChange={handleTabChange}
            aria-label="Keyboard navigable tabs"
            sx={{ mb: 2 }}
          >
            <Tab label="Tab 1" tabIndex={0} />
            <Tab label="Tab 2" tabIndex={-1} />
            <Tab label="Tab 3" tabIndex={-1} />
            <Tab label="Tab 4" tabIndex={-1} />
          </Tabs>
          
          <Box sx={{ p: 2, border: '1px solid', borderColor: 'divider' }}>
            <Typography>Tab {selectedTabIndex + 1} Content</Typography>
          </Box>
        </Grid>
        
        <Grid item xs={12}>
          <Divider sx={{ my: 2 }} />
          
          <Typography variant="h6" gutterBottom>
            Keyboard Navigable Grid
          </Typography>
          
          <TableContainer component={Paper} variant="outlined">
            <Table 
              ref={gridRef as React.RefObject<HTMLTableElement>}
              role="grid"
              aria-label="Keyboard navigable grid"
            >
              <TableHead>
                <TableRow>
                  <TableCell>Column 1</TableCell>
                  <TableCell>Column 2</TableCell>
                  <TableCell>Column 3</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {[1, 2, 3].map((row) => (
                  <TableRow key={row}>
                    {[1, 2, 3].map((col) => (
                      <TableCell 
                        key={`${row}-${col}`} 
                        role="gridcell"
                        tabIndex={row === 1 && col === 1 ? 0 : -1}
                      >
                        Cell {row}-{col}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          
          {selectedGridItem && (
            <Typography variant="body2" sx={{ mt: 2 }}>
              Selected: {selectedGridItem}
            </Typography>
          )}
        </Grid>
      </Grid>
      
      <Box sx={{ mt: 4 }}>
        <Typography variant="h6" gutterBottom>
          Keyboard Navigation Instructions
        </Typography>
        
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" gutterBottom>
              List and Menu Navigation:
            </Typography>
            <ul>
              <li>Up/Down arrows: Move focus between items</li>
              <li>Home: Move focus to first item</li>
              <li>End: Move focus to last item</li>
              <li>Enter/Space: Select the focused item</li>
            </ul>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" gutterBottom>
              Tab Navigation:
            </Typography>
            <ul>
              <li>Left/Right arrows: Move focus between tabs</li>
              <li>Home: Move focus to first tab</li>
              <li>End: Move focus to last tab</li>
              <li>Enter/Space: Activate the focused tab</li>
            </ul>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" gutterBottom>
              Grid Navigation:
            </Typography>
            <ul>
              <li>Up/Down/Left/Right arrows: Move focus between cells</li>
              <li>Home: Move focus to first cell in row</li>
              <li>End: Move focus to last cell in row</li>
              <li>Enter/Space: Select the focused cell</li>
            </ul>
          </Grid>
        </Grid>
      </Box>
    </Paper>
  );
};

export default KeyboardNavigableDemo; 
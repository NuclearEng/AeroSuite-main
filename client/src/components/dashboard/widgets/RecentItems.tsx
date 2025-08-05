import React from 'react';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import ListItemText from '@mui/material/ListItemText';
import Avatar from '@mui/material/Avatar';
import Typography from '@mui/material/Typography';
import Link from '@mui/material/Link';
import Box from '@mui/material/Box';

export interface RecentItem {
  id: string;
  title: string;
  description?: string;
  iconUrl?: string;
  timestamp: string;
  link?: string;
}

export interface RecentItemsProps {
  items: RecentItem[];
  title?: string;
}

const RecentItems: React.FC<RecentItemsProps> = ({ items, title = 'Recent Items' }) => {
  return (
    <Box>
      <Typography variant="h6" sx={{ mb: 2 }}>{title}</Typography>
      <List>
        {items.map(item => (
          <ListItem key={item.id} alignItems="flex-start" sx={{ mb: 1 }}>
            <ListItemAvatar>
              <Avatar src={item.iconUrl} alt={item.title} />
            </ListItemAvatar>
            <ListItemText
              primary={item.link ? <Link href={item.link}>{item.title}</Link> : item.title}
              secondary={
                <>
                  {item.description && <Typography variant="body2" color="text.secondary">{item.description}</Typography>}
                  <Typography variant="caption" color="text.secondary">{item.timestamp}</Typography>
                </>
              }
            />
          </ListItem>
        ))}
      </List>
    </Box>
  );
};

export default RecentItems; 
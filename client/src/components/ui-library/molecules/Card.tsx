import React from 'react';
import { 
  Card as MuiCard, 
  CardContent, 
  CardHeader, 
  CardActions,
  Typography
} from '@mui/material';

interface CardComponentProps {
  title?: React.ReactNode;
  subheader?: React.ReactNode;
  action?: React.ReactNode;
  footer?: React.ReactNode;
  children?: React.ReactNode;
  elevation?: number;
  variant?: 'outlined' | 'elevation';
  className?: string;
  sx?: any;
}

const Card: React.FC<CardComponentProps> = ({
  title,
  subheader,
  action,
  footer,
  children,
  ...rest
}) => {
  return (
    <MuiCard {...rest}>
      {(title || subheader || action) && (
        <CardHeader
          title={title && <Typography variant="h6">{title}</Typography>}
          subheader={subheader}
          action={action}
        />
      )}
      <CardContent>{children}</CardContent>
      {footer && <CardActions>{footer}</CardActions>}
    </MuiCard>
  );
};

export default Card; 
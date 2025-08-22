import React from 'react';
import Box from '@mui/material/Box';

export interface MapViewProps {
  location: string;
  apiKey?: string;
  width?: string | number;
  height?: string | number;
  style?: React.CSSProperties;
}

const MapView: React.FC<MapViewProps> = ({ location, apiKey, width = '100%', height = 400, style = {} }) => {
  const mapSrc = `https://www.google.com/maps/embed/v1/place?key=${apiKey || 'AIzaSyD-EXAMPLE'}&q=${encodeURIComponent(location)}`;
  return (
    <Box sx={{ width, height, borderRadius: 2, overflow: 'hidden', boxShadow: 1, ...style }}>
      <iframe
        title="Map View"
        width={typeof width === 'number' ? width : '100%'}
        height={typeof height === 'number' ? height : 400}
        frameBorder="0"
        style={{ border: 0, width: '100%', height }}
        src={mapSrc}
        allowFullScreen
        aria-label="Map View"
      />
    </Box>
  );
};

export default MapView; 
import React from 'react';
import Box from '@mui/material/Box';

export interface DocumentViewerProps {
  src: string;
  type?: 'pdf' | 'image';
  width?: string | number;
  height?: string | number;
  style?: React.CSSProperties;
}

const DocumentViewer: React.FC<DocumentViewerProps> = ({ src, type = 'pdf', width = '100%', height = 600, style = {} }) => {
  if (type === 'image') {
    return (
      <Box sx={{ width, height, display: 'flex', justifyContent: 'center', alignItems: 'center', ...style }}>
        <img src={src} alt="Document" style={{ maxWidth: '100%', maxHeight: '100%', borderRadius: 8 }} />
      </Box>
    );
  }
  // Default to PDF
  return (
    <Box sx={{ width, height, ...style }}>
      <iframe
        src={src}
        title="Document Viewer"
        width={typeof width === 'number' ? width : '100%'}
        height={typeof height === 'number' ? height : 600}
        style={{ border: 'none', borderRadius: 8, width: '100%', height }}
        aria-label="Document Viewer"
      />
    </Box>
  );
};

export default DocumentViewer; 
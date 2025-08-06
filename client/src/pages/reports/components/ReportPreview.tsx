import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  CircularProgress,
  Alert,
  Button,
  Divider,
  Skeleton,
  Stack,
  Toolbar,
  IconButton,
  Tooltip,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  LinearProgress
} from '@mui/material';
import {
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon,
  Download as DownloadIcon,
  Refresh as RefreshIcon,
  InsertDriveFile as FileIcon,
  PictureAsPdf as PdfIcon,
  TableChart as ExcelIcon
} from '@mui/icons-material';
import reportService from '../../../services/report.service';
import { debounce } from 'lodash';

interface ReportPreviewProps {
  templateId: string;
  filters?: Record<string, any>;
}

// Cache for report preview URLs
const previewCache = new Map<string, { url: string, timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

const ReportPreview: React.FC<ReportPreviewProps> = ({ templateId, filters }) => {
  const [loading, setLoading] = useState(false);
  const [excelLoading, setExcelLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [downloadMenuAnchor, setDownloadMenuAnchor] = useState<null | HTMLElement>(null);
  const [progress, setProgress] = useState(0);
  const [isRendering, setIsRendering] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const progressTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Generate cache key from templateId and filters
  const getCacheKey = useCallback(() => {
    return `${templateId}-${JSON.stringify(filters || {})}`;
  }, [templateId, filters]);
  
  // Check cache for existing preview
  const checkCache = useCallback(() => {
    const cacheKey = getCacheKey();
    const cachedPreview = previewCache.get(cacheKey);
    
    if (cachedPreview && Date.now() - cachedPreview.timestamp < CACHE_TTL) {
      return cachedPreview.url;
    }
    
    return null;
  }, [getCacheKey]);
  
  // Update cache with new preview
  const updateCache = useCallback((url: string) => {
    const cacheKey = getCacheKey();
    previewCache.set(cacheKey, {
      url,
      timestamp: Date.now()
    });
  }, [getCacheKey]);
  
  // Clean up progress timer
  const clearProgressTimer = () => {
    if (progressTimerRef.current) {
      clearInterval(progressTimerRef.current);
      progressTimerRef.current = null;
    }
  };
  
  // Simulate progress during loading
  const startProgressSimulation = () => {
    clearProgressTimer();
    setProgress(0);
    
    progressTimerRef.current = setInterval(() => {
      setProgress(prev => {
        if (prev >= 90) {
          return 90; // Halt at 90% until actual loading completes
        }
        return prev + (90 - prev) * 0.1;
      });
    }, 300);
  };
  
  // Debounced version of generate preview to prevent excessive calls
  const debouncedGeneratePreview = useCallback(
    debounce(() => {
      generatePreview();
    }, 500),
    [templateId, filters]
  );
  
  // Load preview when templateId changes
  useEffect(() => {
    if (!templateId) return;
    
    debouncedGeneratePreview();
    
    // Prefetch formats for faster download if needed
    reportService.prefetchReportFormats(templateId, filters);
    
    return () => {
      clearProgressTimer();
    };
  }, [templateId, filters, debouncedGeneratePreview]);
  
  // Handle iframe load events
  useEffect(() => {
    const iframe = iframeRef.current;
    
    const handleLoad = () => {
      setIsRendering(false);
      setProgress(100);
      clearProgressTimer();
      
      // After a delay, reset progress bar
      setTimeout(() => {
        setProgress(0);
      }, 500);
    };
    
    if (iframe) {
      iframe.addEventListener('load', handleLoad);
    }
    
    return () => {
      if (iframe) {
        iframe.removeEventListener('load', handleLoad);
      }
    };
  }, [previewUrl]);
  
  // Generate preview
  const generatePreview = async () => {
    try {
      // Check cache first
      const cachedUrl = checkCache();
      if (cachedUrl) {
        setPreviewUrl(cachedUrl);
        return;
      }
      
      setLoading(true);
      setError(null);
      startProgressSimulation();
      setIsRendering(true);
      
      // Get preview from API
      const result = await reportService.previewReport({
        templateId,
        filters,
        download: false
      });
      
      setPreviewUrl(result.reportUrl);
      updateCache(result.reportUrl);
      setProgress(100);
    } catch (err: any) {
      console.error("Error:", _error);
      setError(err.message || 'Failed to generate report preview');
      setPreviewUrl(null);
    } finally {
      setLoading(false);
      clearProgressTimer();
    }
  };
  
  // Handle zoom in
  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 0.1, 2));
  };
  
  // Handle zoom out
  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev - 0.1, 0.5));
  };
  
  // Handle download menu open
  const handleDownloadMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setDownloadMenuAnchor(event.currentTarget);
  };
  
  // Handle download menu close
  const handleDownloadMenuClose = () => {
    setDownloadMenuAnchor(null);
  };
  
  // Handle PDF download
  const handlePdfDownload = () => {
    handleDownloadMenuClose();
    const downloadUrl = reportService.getDownloadUrl(templateId, filters);
    window.open(downloadUrl, '_blank');
  };
  
  // Handle Excel download
  const handleExcelDownload = async () => {
    handleDownloadMenuClose();
    
    try {
      setExcelLoading(true);
      
      // Get Excel download URL
      const downloadUrl = reportService.getExcelDownloadUrl(templateId, filters);
      window.open(downloadUrl, '_blank');
    } catch (err: any) {
      console.error("Error:", _error);
      setError(err.message || 'Failed to generate Excel report');
    } finally {
      setExcelLoading(false);
    }
  };
  
  // Handle refresh
  const handleRefresh = () => {
    // Force bypass cache
    previewCache.delete(getCacheKey());
    generatePreview();
  };
  
  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Toolbar
        variant="dense"
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          borderBottom: 1,
          borderColor: 'divider',
          p: 1
        }}
      >
        <Typography variant="subtitle1">
          Report Preview
        </Typography>
        
        <Box>
          <Tooltip title="Zoom out">
            <IconButton onClick={handleZoomOut} disabled={loading || isRendering}>
              <ZoomOutIcon />
            </IconButton>
          </Tooltip>
          
          <Typography variant="body2" component="span" sx={{ mx: 1 }}>
            {Math.round(zoom * 100)}%
          </Typography>
          
          <Tooltip title="Zoom in">
            <IconButton onClick={handleZoomIn} disabled={loading || isRendering}>
              <ZoomInIcon />
            </IconButton>
          </Tooltip>
          
          <Tooltip title="Refresh preview">
            <IconButton onClick={handleRefresh} disabled={loading || isRendering} sx={{ ml: 1 }}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          
          <Tooltip title="Download report">
            <IconButton 
              onClick={handleDownloadMenuOpen} 
              disabled={loading || !previewUrl || excelLoading || isRendering} 
              sx={{ ml: 1 }}
            >
              <DownloadIcon />
            </IconButton>
          </Tooltip>
          
          <Menu
            anchorEl={downloadMenuAnchor}
            open={Boolean(downloadMenuAnchor)}
            onClose={handleDownloadMenuClose}
          >
            <MenuItem onClick={handlePdfDownload}>
              <ListItemIcon>
                <PdfIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Download as PDF</ListItemText>
            </MenuItem>
            <MenuItem onClick={handleExcelDownload} disabled={excelLoading}>
              <ListItemIcon>
                {excelLoading ? (
                  <CircularProgress size={20} />
                ) : (
                  <ExcelIcon fontSize="small" />
                )}
              </ListItemIcon>
              <ListItemText>Download as Excel</ListItemText>
            </MenuItem>
          </Menu>
        </Box>
      </Toolbar>
      
      {(loading || isRendering || progress > 0) && (
        <LinearProgress 
          variant={progress > 0 ? "determinate" : "indeterminate"} 
          value={progress} 
          sx={{ borderRadius: 0 }} 
        />
      )}
      
      <Box sx={{ flexGrow: 1, overflow: 'auto', p: 2, bgcolor: '#f5f5f5' }}>
        {loading && !previewUrl && (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mt: 4 }}>
            <CircularProgress />
            <Typography variant="body2" sx={{ mt: 2 }}>
              Generating preview...
            </Typography>
          </Box>
        )}
        
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}
        
        {!loading && !error && previewUrl && (
          <Box
            sx={{
              width: '100%',
              height: '100%',
              display: 'flex',
              justifyContent: 'center',
              overflow: 'auto'
            }}
          >
            <Box
              sx={{
                transform: `scale(${zoom})`,
                transformOrigin: 'top center',
                width: `${100 / zoom}%`,
                height: `${100 / zoom}%`,
                transition: 'transform 0.2s ease-in-out'
              }}
            >
              <iframe
                ref={iframeRef}
                src={previewUrl}
                width="100%"
                height="100%"
                style={{ 
                  border: '1px solid rgba(0, 0, 0, 0.12)', 
                  borderRadius: '4px',
                  backgroundColor: 'white' 
                }}
                title="Report Preview"
                loading="lazy"
              >
                <Alert severity="warning">
                  Your browser doesn't support iframe preview. 
                  <Button 
                    variant="text" 
                    onClick={handlePdfDownload} 
                    sx={{ ml: 1 }}
                  >
                    Download the PDF
                  </Button>
                </Alert>
              </iframe>
            </Box>
          </Box>
        )}
        
        {!loading && !error && !previewUrl && (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mt: 4 }}>
            <Typography variant="body1" color="text.secondary">
              No preview available
            </Typography>
            <Button
              variant="outlined"
              onClick={handleRefresh}
              startIcon={<RefreshIcon />}
              sx={{ mt: 2 }}
            >
              Generate Preview
            </Button>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default ReportPreview; 
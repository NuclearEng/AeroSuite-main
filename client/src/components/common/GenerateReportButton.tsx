import React, { useState } from 'react';
import { 
  Button, 
  Menu, 
  MenuItem, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions,
  FormControlLabel,
  Checkbox,
  CircularProgress,
  Snackbar,
  Alert
} from '@mui/material';
import DescriptionIcon from '@mui/icons-material/Description';
import GetAppIcon from '@mui/icons-material/GetApp';
import PreviewIcon from '@mui/icons-material/Preview';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import inspectionService from '../../services/inspection.service';

interface GenerateReportButtonProps {
  inspectionId: string;
  disabled?: boolean;
  variant?: 'text' | 'outlined' | 'contained';
  color?: 'primary' | 'secondary' | 'success' | 'error' | 'info' | 'warning';
  size?: 'small' | 'medium' | 'large';
  fullWidth?: boolean;
}

const GenerateReportButton: React.FC<GenerateReportButtonProps> = ({
  inspectionId,
  disabled = false,
  variant = 'contained',
  color = 'primary',
  size = 'medium',
  fullWidth = false
}) => {
  // Menu state
  const [anchorEl, setAnchorEl] = useState<any>(null);
  const open = Boolean(anchorEl);
  
  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogAction, setDialogAction] = useState<any>('download');
  
  // Options state
  const [includePhotos, setIncludePhotos] = useState(true);
  const [includeSignatures, setIncludeSignatures] = useState(true);
  
  // Loading state
  const [loading, setLoading] = useState(false);
  
  // Snackbar state
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<any>('success');
  
  // Report URL for preview
  const [reportUrl, setReportUrl] = useState<any>(null);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  
  // Handlers
  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };
  
  const handleClose = () => {
    setAnchorEl(null);
  };
  
  const handleOptionClick = (action: 'download' | 'preview') => {
    setDialogAction(action);
    setDialogOpen(true);
    handleClose();
  };
  
  const handleDialogClose = () => {
    setDialogOpen(false);
  };
  
  const handlePreviewDialogClose = () => {
    setPreviewDialogOpen(false);
    setReportUrl(null);
  };
  
  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };
  
  const handleGenerateReport = async () => {
    setLoading(true);
    try {
      if (dialogAction === 'download') {
        // Direct download
        await inspectionService.generateInspectionReport(inspectionId, {
          download: true,
          includePhotos,
          includeSignatures
        });
        
        setSnackbarMessage('Report download initiated');
        setSnackbarSeverity('success');
        setSnackbarOpen(true);
      } else {
        // Preview
        const result = await inspectionService.generateInspectionReport(inspectionId, {
          download: false,
          includePhotos,
          includeSignatures
        });
        
        if (result.success && result.data && result.data.reportUrl) {
          setReportUrl(result.data.reportUrl);
          setPreviewDialogOpen(true);
        } else {
          throw new Error('Failed to generate report preview');
        }
      }
      
      setDialogOpen(false);
    } catch (_error) {
      console.error("Error:", _error);
      setSnackbarMessage('Error generating report');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <>
      <Button
        variant={variant}
        color={color}
        size={size}
        disabled={disabled}
        fullWidth={fullWidth}
        startIcon={<DescriptionIcon />}
        endIcon={<ExpandMoreIcon />}
        onClick={handleClick}
      >
        Generate Report
      </Button>
      
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
      >
        <MenuItem onClick={() => handleOptionClick('download')}>
          <GetAppIcon fontSize="small" style={{ marginRight: 8 }} />
          Download Report
        </MenuItem>
        <MenuItem onClick={() => handleOptionClick('preview')}>
          <PreviewIcon fontSize="small" style={{ marginRight: 8 }} />
          Preview Report
        </MenuItem>
      </Menu>
      
      <Dialog open={dialogOpen} onClose={handleDialogClose}>
        <DialogTitle>
          {dialogAction === 'download' ? 'Download Report' : 'Preview Report'}
        </DialogTitle>
        <DialogContent>
          <FormControlLabel
            control={
              <Checkbox
                checked={includePhotos}
                onChange={(e) => setIncludePhotos(e.target.checked)}
              />
            }
            label="Include Photos"
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={includeSignatures}
                onChange={(e) => setIncludeSignatures(e.target.checked)}
              />
            }
            label="Include Signature Fields"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDialogClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={handleGenerateReport}
            color="primary"
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : null}
          >
            {loading ? 'Generating...' : 'Generate'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {reportUrl && (
        <Dialog
          open={previewDialogOpen}
          onClose={handlePreviewDialogClose}
          maxWidth="lg"
          fullWidth
        >
          <DialogTitle>Report Preview</DialogTitle>
          <DialogContent style={{ height: '80vh', padding: 0 }}>
            <iframe
              src={reportUrl}
              style={{ width: '100%', height: '100%', border: 'none' }}
              title="Report Preview"
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={handlePreviewDialogClose}>
              Close
            </Button>
            <Button
              color="primary"
              onClick={() => {
                window.open(reportUrl, '_blank');
              }}
            >
              Download
            </Button>
          </DialogActions>
        </Dialog>
      )}
      
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
      >
        <Alert
          onClose={handleSnackbarClose}
          severity={snackbarSeverity}
          sx={{ width: '100%' }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </>
  );
};

export default GenerateReportButton; 
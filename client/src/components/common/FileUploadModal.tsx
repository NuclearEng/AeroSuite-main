import React, { useState, useCallback, useRef } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  IconButton,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  CircularProgress,
  Alert,
  Divider,
  Chip,
  Grid,
  Paper,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tooltip,
  useTheme,
} from '@mui/material';
import {
  Close as CloseIcon,
  CloudUpload as CloudUploadIcon,
  Description as FileIcon,
  DeleteOutline as DeleteIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  Folder as FolderIcon,
  AttachFile as AttachFileIcon,
  Image as ImageIcon,
  PictureAsPdf as PdfIcon,
  TableChart as SpreadsheetIcon,
  Movie as VideoIcon,
  Code as CodeIcon,
  Archive as ZipIcon,
  AudioFile as AudioIcon,
  Article as DocIcon,
} from '@mui/icons-material';
// Custom hook to handle file drop functionality

// Types for uploaded files
export interface UploadedFile {
  id: string;
  file: File;
  progress: number;
  status: 'queued' | 'uploading' | 'completed' | 'error';
  error?: string;
  url?: string;
  metadata?: Record<string, any>;
}

export interface FileCategory {
  id: string;
  name: string;
}

interface FileUploadModalProps {
  open: boolean;
  onClose: () => void;
  onUpload: (files: File[], category?: string, description?: string) => Promise<void>;
  title?: string;
  maxFiles?: number;
  maxSize?: number; // in bytes
  acceptedFileTypes?: string[];
  categories?: FileCategory[];
  showDescriptionField?: boolean;
  showCategoryField?: boolean;
  instructionText?: string;
  multiple?: boolean;
}

const FileUploadModal: React.FC<FileUploadModalProps> = ({
  open,
  onClose,
  onUpload,
  title = 'Upload Files',
  maxFiles = 10,
  maxSize = 10 * 1024 * 1024, // 10MB default
  acceptedFileTypes,
  categories = [],
  showDescriptionField = true,
  showCategoryField = true,
  instructionText = 'Drag and drop files here, or click to select files',
  multiple = true,
}) => {
  const theme = useTheme();
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [overallProgress, setOverallProgress] = useState(0);

  // Create a unique ID for each file
  const fileIdCounter = useRef(0);

  // Handle file drop
  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: any[]) => {
    // Handle rejected files (too large, wrong type, etc.)
    if (rejectedFiles.length > 0) {
      const errors: string[] = [];
      
      rejectedFiles.forEach(({ file, errors: fileErrors }) => {
        fileErrors.forEach((err: any) => {
          if (err.code === 'file-too-large') {
            errors.push(`${file.name} is too large (max: ${formatBytes(maxSize)})`);
          } else if (err.code === 'file-invalid-type') {
            errors.push(`${file.name} has an invalid file type`);
          } else {
            errors.push(`${file.name}: ${err.message}`);
          }
        });
      });
      
      setError(errors.join('. '));
      return;
    }
    
    // Check if adding these files would exceed maxFiles
    if (files.length + acceptedFiles.length > maxFiles) {
      setError(`You can only upload a maximum of ${maxFiles} files`);
      return;
    }
    
    // Add accepted files to the list
    setError(null);
    const newFiles = acceptedFiles.map((file) => ({
      id: `file-${fileIdCounter.current++}`,
      file,
      progress: 0,
      status: 'queued' as const,
    }));
    
    setFiles((prevFiles) => [...prevFiles, ...newFiles]);
  }, [files, maxFiles, maxSize]);

  // Custom drop zone state
  const [isDragActive, setIsDragActive] = useState(false);
  const [isDragAccept, setIsDragAccept] = useState(false);
  const [isDragReject, setIsDragReject] = useState(false);
  
  // File input ref
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Handle drag events
  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(true);
    
    // Check if files are valid
    if (e.dataTransfer.items && e.dataTransfer.items.length) {
      const isValid = Array.from(e.dataTransfer.items).every(item => {
        return acceptedFileTypes ? acceptedFileTypes.some(type => {
          return item.type.match(new RegExp(type.replace('*', '.*')));
        }) : true;
      });
      setIsDragAccept(isValid);
      setIsDragReject(!isValid);
    }
  };
  
  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    setIsDragAccept(false);
    setIsDragReject(false);
  };
  
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(true);
  };
  
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    setIsDragAccept(false);
    setIsDragReject(false);
    
    if (!uploading && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFiles = Array.from(e.dataTransfer.files);
      processFiles(droppedFiles);
    }
  };
  
  // Handle file input change
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(Array.from(e.target.files));
    }
  };
  
  // Process files after selection
  const processFiles = (selectedFiles: File[]) => {
    // Filter files by type if needed
    const filteredFiles = acceptedFileTypes
      ? selectedFiles.filter(file => {
          return acceptedFileTypes.some(type => {
            return file.type.match(new RegExp(type.replace('*', '.*')));
          });
        })
      : selectedFiles;
    
    // Filter files by size
    const validFiles = filteredFiles.filter(file => file.size <= maxSize);
    const oversizedFiles = filteredFiles.filter(file => file.size > maxSize);
    
    if (oversizedFiles.length > 0) {
      setError(`${oversizedFiles.length} file(s) exceed the maximum size of ${formatBytes(maxSize)}`);
    }
    
    // Check if adding these files would exceed maxFiles
    if (files.length + validFiles.length > maxFiles) {
      setError(`You can only upload a maximum of ${maxFiles} files`);
      return;
    }
    
    // Add valid files to the list
    if (validFiles.length > 0) {
      setError(null);
      const newFiles = validFiles.map((file) => ({
        id: `file-${fileIdCounter.current++}`,
        file,
        progress: 0,
        status: 'queued' as const,
      }));
      
      setFiles((prevFiles) => [...prevFiles, ...newFiles]);
    }
  };
  
  // Handle file browse button click
  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  // Remove a file from the list
  const removeFile = (id: string) => {
    setFiles((prevFiles) => prevFiles.filter((file) => file.id !== id));
  };

  // Get file icon based on mime type
  const getFileIcon = (file: File) => {
    const type = file.type;
    
    if (type.startsWith('image/')) return <ImageIcon color="primary" />;
    if (type === 'application/pdf') return <PdfIcon color="error" />;
    if (type.includes('spreadsheet') || type.includes('excel')) return <SpreadsheetIcon color="success" />;
    if (type.includes('word') || type.includes('document')) return <DocIcon color="info" />;
    if (type.startsWith('video/')) return <VideoIcon color="secondary" />;
    if (type.startsWith('audio/')) return <AudioIcon color="warning" />;
    if (type.includes('zip') || type.includes('compressed')) return <ZipIcon />;
    if (type.includes('code') || type.includes('json') || type.includes('javascript')) return <CodeIcon />;
    
    return <FileIcon />;
  };

  // Format bytes to human-readable format
  const formatBytes = (bytes: number, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  // Start upload process
  const handleUpload = async () => {
    if (files.length === 0) {
      setError('Please select at least one file to upload');
      return;
    }
    
    setUploading(true);
    setError(null);
    
    try {
      // Update file statuses
      setFiles((prevFiles) =>
        prevFiles.map((file) => ({
          ...file,
          status: 'uploading',
        }))
      );
      
      // Start upload progress simulation
      const uploadInterval = setInterval(() => {
        setFiles((prevFiles) => {
          const updatedFiles = prevFiles.map((file) => {
            if (file.status === 'uploading' && file.progress < 99) {
              return {
                ...file,
                progress: Math.min(file.progress + Math.random() * 10, 99),
              };
            }
            return file;
          });
          
          // Calculate overall progress
          const totalProgress = updatedFiles.reduce(
            (sum, file) => sum + file.progress,
            0
          );
          const averageProgress = totalProgress / updatedFiles.length;
          setOverallProgress(averageProgress);
          
          return updatedFiles;
        });
      }, 300);
      
      // Perform actual upload
      await onUpload(
        files.map((f) => f.file),
        category || undefined,
        description || undefined
      );
      
      // Stop progress simulation and mark files as completed
      clearInterval(uploadInterval);
      
      setFiles((prevFiles) =>
        prevFiles.map((file) => ({
          ...file,
          progress: 100,
          status: 'completed',
        }))
      );
      
      setOverallProgress(100);
      
      // Auto-close after a short delay
      setTimeout(() => {
        onClose();
        // Reset state for next open
        setFiles([]);
        setDescription('');
        setCategory('');
        setError(null);
        setOverallProgress(0);
        setUploading(false);
      }, 2000);
      
    } catch (err: any) {
      clearInterval(uploadInterval);
      setError(err.message || 'Upload failed');
      
      // Mark files as error
      setFiles((prevFiles) =>
        prevFiles.map((file) => ({
          ...file,
          status: 'error',
          error: 'Upload failed',
        }))
      );
      
      setUploading(false);
    }
  };

  // Handle dialog close
  const handleClose = () => {
    if (uploading) {
      // Warn user that upload is in progress
      if (window.confirm('Upload is in progress. Are you sure you want to cancel?')) {
        onClose();
        // Reset state for next open
        setFiles([]);
        setDescription('');
        setCategory('');
        setError(null);
        setOverallProgress(0);
        setUploading(false);
      }
    } else {
      onClose();
      // Reset state for next open
      setFiles([]);
      setDescription('');
      setCategory('');
      setError(null);
      setOverallProgress(0);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      aria-labelledby="file-upload-dialog-title"
    >
      <DialogTitle id="file-upload-dialog-title">
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box display="flex" alignItems="center">
            <CloudUploadIcon sx={{ mr: 1 }} />
            <Typography variant="h6">{title}</Typography>
          </Box>
          <IconButton
            edge="end"
            color="inherit"
            onClick={handleClose}
            disabled={uploading}
            aria-label="close"
          >
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Grid container spacing={3}>
          <Grid item xs={12}>
                      <Paper
            sx={{
                border: '2px dashed',
                borderColor: isDragReject
                  ? theme.palette.error.main
                  : isDragAccept
                  ? theme.palette.success.main
                  : theme.palette.divider,
                borderRadius: 2,
                p: 3,
                backgroundColor: isDragActive
                  ? alpha => theme.palette.action.hover
                  : 'transparent',
                outline: 'none',
                cursor: uploading ? 'not-allowed' : 'pointer',
                transition: 'border-color 0.2s, background-color 0.2s',
              }}
            >
              <input
              ref={fileInputRef}
              type="file"
              accept={acceptedFileTypes?.join(',')}
              multiple={multiple}
              onChange={handleFileChange}
              disabled={uploading}
              style={{ display: 'none' }}
            />
              <Box
                display="flex"
                flexDirection="column"
                alignItems="center"
                justifyContent="center"
                py={3}
                onDragEnter={handleDragEnter}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <AttachFileIcon
                  color={isDragReject ? 'error' : 'primary'}
                  sx={{ fontSize: 48, mb: 2 }}
                />
                <Typography variant="h6" align="center" gutterBottom>
                  {isDragActive
                    ? isDragReject
                      ? 'Some files are not allowed'
                      : 'Drop files here'
                    : instructionText}
                </Typography>
                <Typography variant="body2" color="textSecondary" align="center">
                  {acceptedFileTypes
                    ? `Accepted file types: ${acceptedFileTypes.join(', ')}`
                    : 'All file types accepted'}
                </Typography>
                <Typography variant="body2" color="textSecondary" align="center">
                  Maximum file size: {formatBytes(maxSize)}
                </Typography>
                <Typography variant="body2" color="textSecondary" align="center">
                  Maximum files: {maxFiles}
                </Typography>

                {!isDragActive && !uploading && (
                  <Button
                    variant="outlined"
                    color="primary"
                    startIcon={<CloudUploadIcon />}
                    sx={{ mt: 2 }}
                    onClick={handleBrowseClick}
                  >
                    Select Files
                  </Button>
                )}
                {uploading && (
                  <CircularProgress size={24} sx={{ mt: 2 }} />
                )}
              </Box>
            </Paper>
          </Grid>

          {(showCategoryField || showDescriptionField) && (
            <Grid item xs={12}>
              <Grid container spacing={2}>
                {showCategoryField && categories.length > 0 && (
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth>
                      <InputLabel id="category-select-label">Category</InputLabel>
                      <Select
                        labelId="category-select-label"
                        id="category-select"
                        value={category}
                        label="Category"
                        onChange={(e) => setCategory(e.target.value as string)}
                        disabled={uploading}
                      >
                        <MenuItem value="">
                          <em>None</em>
                        </MenuItem>
                        {categories.map((cat) => (
                          <MenuItem key={cat.id} value={cat.id}>
                            {cat.name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                )}

                {showDescriptionField && (
                  <Grid item xs={12} sm={showCategoryField ? 6 : 12}>
                    <TextField
                      label="Description"
                      fullWidth
                      multiline
                      rows={2}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      disabled={uploading}
                    />
                  </Grid>
                )}
              </Grid>
            </Grid>
          )}

          {files.length > 0 && (
            <Grid item xs={12}>
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle1" gutterBottom>
                  Selected Files ({files.length})
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={overallProgress}
                  sx={{ height: 8, borderRadius: 4 }}
                />
                <Box
                  display="flex"
                  justifyContent="space-between"
                  alignItems="center"
                  mt={0.5}
                >
                  <Typography variant="body2" color="textSecondary">
                    {uploading
                      ? 'Uploading...'
                      : overallProgress === 100
                      ? 'Upload complete'
                      : 'Ready to upload'}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    {Math.round(overallProgress)}%
                  </Typography>
                </Box>
              </Box>

              <Paper variant="outlined" sx={{ maxHeight: 300, overflow: 'auto' }}>
                <List dense>
                  {files.map((fileItem, index) => (
                    <React.Fragment key={fileItem.id}>
                      <ListItem>
                        <ListItemIcon>
                          {getFileIcon(fileItem.file)}
                        </ListItemIcon>
                        <ListItemText
                          primary={fileItem.file.name}
                          secondary={
                            <>
                              {formatBytes(fileItem.file.size)}
                              {fileItem.status === 'error' && (
                                <Typography
                                  component="span"
                                  variant="body2"
                                  color="error"
                                  sx={{ ml: 1 }}
                                >
                                  • {fileItem.error}
                                </Typography>
                              )}
                            </>
                          }
                        />
                        <Box sx={{ width: 100, mr: 2 }}>
                          <LinearProgress
                            variant="determinate"
                            value={fileItem.progress}
                            color={
                              fileItem.status === 'error'
                                ? 'error'
                                : fileItem.status === 'completed'
                                ? 'success'
                                : 'primary'
                            }
                            sx={{ height: 6, borderRadius: 3 }}
                          />
                        </Box>
                        <ListItemSecondaryAction>
                          {fileItem.status === 'completed' ? (
                            <Tooltip title="Upload successful">
                              <SuccessIcon color="success" />
                            </Tooltip>
                          ) : fileItem.status === 'error' ? (
                            <Tooltip title={fileItem.error || 'Error'}>
                              <ErrorIcon color="error" />
                            </Tooltip>
                          ) : (
                            <IconButton
                              edge="end"
                              aria-label="delete"
                              onClick={() => removeFile(fileItem.id)}
                              disabled={uploading}
                              size="small"
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          )}
                        </ListItemSecondaryAction>
                      </ListItem>
                      {index < files.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              </Paper>
            </Grid>
          )}
        </Grid>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button
          onClick={handleClose}
          disabled={uploading}
        >
          {uploading ? 'Uploading...' : files.length === 0 || overallProgress === 100 ? 'Close' : 'Cancel'}
        </Button>
        
        {files.length > 0 && overallProgress < 100 && (
          <Button
            variant="contained"
            color="primary"
            startIcon={uploading ? <CircularProgress size={20} /> : <CloudUploadIcon />}
            onClick={handleUpload}
            disabled={uploading || files.length === 0}
          >
            {uploading ? `Uploading (${Math.round(overallProgress)}%)` : `Upload ${files.length} ${files.length === 1 ? 'File' : 'Files'}`}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default FileUploadModal;
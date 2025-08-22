import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  IconButton,
  Button,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  SelectChangeEvent,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  Divider,
  Tooltip,
  Badge } from
'@mui/material';
import {
  Description as DocumentIcon,
  PictureAsPdf as PdfIcon,
  InsertDriveFile as FileIcon,
  Image as ImageIcon,
  ListAlt as SpecIcon,
  Book as ManualIcon,
  Architecture as DrawingIcon,
  LibraryBooks as TestReportIcon,
  VerifiedUser as CertificateIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  CloudUpload as UploadIcon,
  Download as DownloadIcon,
  Add as AddIcon,
  Folder as FolderIcon } from
'@mui/icons-material';
import useComponentDocumentation, { ComponentDocument } from '../../hooks/useComponentDocumentation';

interface DocumentationManagerProps {
  componentId: string;
}

const DocumentationManager: React.FC<DocumentationManagerProps> = ({ componentId }) => {
  const {
    loading,
    error,
    documents,
    categories,
    uploadDocument,
    deleteDocument,
    updateDocument
  } = useComponentDocumentation(componentId);

  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [openUploadDialog, setOpenUploadDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<ComponentDocument | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'specification',
    version: '',
    tags: '',
    file: null as File | null
  });

  // Get document icon based on category or file type
  const GetDocumentIcon = (document: ComponentDocument) => {
    switch (document.category) {
      case 'manual':
        return <ManualIcon />;
      case 'specification':
        return <SpecIcon />;
      case 'drawing':
        return <DrawingIcon />;
      case 'test_report':
        return <TestReportIcon />;
      case 'certificate':
        return <CertificateIcon />;
      default:
        // Fallback to file type icons
        if (document.fileType?.includes('pdf')) return <PdfIcon />;
        if (document.fileType?.includes('image')) return <ImageIcon />;
        return <FileIcon />;
    }
  };

  // Handle category tab change
  const handleCategoryChange = (event: React.SyntheticEvent, newValue: string) => {
    setActiveCategory(newValue);
  };

  // Handle input changes for form fields
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name) {
      setFormData((prev) => ({
        ...prev,
        [name]: value
      }));
    }
  };

  // Handle select input changes
  const handleSelectChange = (e: SelectChangeEvent) => {
    const { name, value } = e.target;
    if (name) {
      setFormData((prev) => ({
        ...prev,
        [name]: value
      }));
    }
  };

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFormData((prev) => ({
        ...prev,
        file: e.target.files![0]
      }));
    }
  };

  // Handle document upload
  const handleUploadDocument = async () => {
    if (!formData.file || !formData.title || !formData.category) return;

    const data = new FormData();
    data.append('file', formData.file);
    data.append('title', formData.title);
    data.append('description', formData.description);
    data.append('category', formData.category);
    data.append('version', formData.version);

    // Convert tags string to array
    if (formData.tags) {
      const tagsArray = formData.tags.split(',').map((tag) => tag.trim());
      tagsArray.forEach((tag) => data.append('tags[]', tag));
    }

    // Add current user info
    data.append('uploadedBy', 'Current User'); // This should be dynamic

    const result = await uploadDocument(componentId, data);

    if (result.success) {
      setOpenUploadDialog(false);
      resetForm();
    }
  };

  // Handle document edit
  const handleEditDocument = async () => {
    if (!selectedDocument || !formData.title || !formData.category) return;

    const updates = {
      title: formData.title,
      description: formData.description,
      category: formData.category as ComponentDocument['category'],
      version: formData.version,
      tags: formData.tags.split(',').map((tag) => tag.trim())
    };

    const success = await updateDocument(selectedDocument._id, updates);

    if (success) {
      setOpenEditDialog(false);
      setSelectedDocument(null);
      resetForm();
    }
  };

  // Handle document deletion
  const handleDeleteDocument = async (documentId: string) => {
    if (window.confirm('Are you sure you want to delete this document?')) {
      await deleteDocument(documentId);
    }
  };

  // Open edit dialog with document data
  const openEditDialogWithDocument = (document: ComponentDocument) => {
    setSelectedDocument(document);
    setFormData({
      title: document.title,
      description: document.description,
      category: document.category,
      version: document.version,
      tags: document.tags.join(', '),
      file: null
    });
    setOpenEditDialog(true);
  };

  // Reset form data
  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      category: 'specification',
      version: '',
      tags: '',
      file: null
    });
  };

  // Filter documents by active category
  const filteredDocuments = activeCategory === 'all' ?
  documents :
  documents.filter((doc) => doc.category === activeCategory);

  if (loading && documents.length === 0) {
    return (
      <Box display="flex" justifyContent="center" p={3}>
        <CircularProgress />
      </Box>);

  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 3 }}>
        {error}
      </Alert>);

  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6" component="h2">
          <DocumentIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
          Documentation
        </Typography>
        <Button
          variant="contained"
          startIcon={<UploadIcon />}
          onClick={() => setOpenUploadDialog(true)}
          size="small">

          Upload Document
        </Button>
      </Box>

      {documents.length === 0 ?
      <Alert severity="info">
          No documentation available for this component. Upload your first document.
        </Alert> :

      <>
          <Paper sx={{ mb: 3 }}>
            <Tabs
            value={activeCategory}
            onChange={handleCategoryChange}
            variant="scrollable"
            scrollButtons="auto"
            aria-label="document categories">

              <Tab
              label={`All (${documents.length})`}
              value="all"
              icon={<FolderIcon />}
              iconPosition="start" />

              {Object.entries(categories).map(([category, count]) =>
            <Tab
              key={category}
              label={`${category.charAt(0).toUpperCase() + category.slice(1)} (${count})`}
              value={category}
              icon={
              category === 'manual' ? <ManualIcon /> :
              category === 'specification' ? <SpecIcon /> :
              category === 'drawing' ? <DrawingIcon /> :
              category === 'test_report' ? <TestReportIcon /> :
              category === 'certificate' ? <CertificateIcon /> :
              <FileIcon />
              }
              iconPosition="start" />

            )}
            </Tabs>
          </Paper>

          <Grid container spacing={2}>
            {filteredDocuments.map((document) =>
          <Grid item xs={12} sm={6} md={4} key={document._id}>
                <Card variant="outlined">
                  <CardContent>
                    <Box display="flex" alignItems="center" mb={1}>
                      <Box mr={1}>
                        {GetDocumentIcon(document)}
                      </Box>
                      <Typography variant="subtitle1" noWrap title={document.title}>
                        {document.title}
                      </Typography>
                    </Box>
                    
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      {document.description.length > 60 ?
                  document.description.substring(0, 60) + '...' :
                  document.description}
                    </Typography>
                    
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                      <Chip
                    size="small"
                    label={document.category.replace('_', ' ')}
                    color={
                    document.category === 'manual' ? 'primary' :
                    document.category === 'specification' ? 'secondary' :
                    document.category === 'drawing' ? 'info' :
                    document.category === 'test_report' ? 'warning' :
                    document.category === 'certificate' ? 'success' :
                    'default'
                    } />

                      <Typography variant="caption" color="text.secondary">
                        v{document.version}
                      </Typography>
                    </Box>
                    
                    <Divider sx={{ my: 1 }} />
                    
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Typography variant="caption" color="text.secondary">
                        {new Date(document.uploadDate).toLocaleDateString()}
                      </Typography>
                      <Box>
                        {document.fileUrl &&
                    <Tooltip title="Download">
                            <Button
                        size="small"
                        href={document.fileUrl}
                        target="_blank"
                        download
                        sx={{ minWidth: 'auto', p: 0.5 }}>

                              <DownloadIcon fontSize="small" />
                            </Button>
                          </Tooltip>
                    }
                        <Tooltip title="Edit">
                          <IconButton size="small" onClick={() => openEditDialogWithDocument(document)}>
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton size="small" onClick={() => handleDeleteDocument(document._id)}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
          )}
          </Grid>
        </>
      }

      
      <Dialog open={openUploadDialog} onClose={() => setOpenUploadDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Upload Document</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                label="Title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                fullWidth
                required />

            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                fullWidth
                multiline
                rows={3} />

            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth required>
                <InputLabel id="category-label">Category</InputLabel>
                <Select
                  labelId="category-label"
                  name="category"
                  value={formData.category}
                  onChange={handleSelectChange}
                  label="Category">

                  <MenuItem value="manual">Manual</MenuItem>
                  <MenuItem value="specification">Specification</MenuItem>
                  <MenuItem value="drawing">Drawing</MenuItem>
                  <MenuItem value="test_report">Test Report</MenuItem>
                  <MenuItem value="certificate">Certificate</MenuItem>
                  <MenuItem value="other">Other</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Version"
                name="version"
                value={formData.version}
                onChange={handleInputChange}
                fullWidth
                required
                placeholder="e.g. 1.0" />

            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Tags"
                name="tags"
                value={formData.tags}
                onChange={handleInputChange}
                fullWidth
                placeholder="Comma-separated tags"
                helperText="Enter tags separated by commas" />

            </Grid>
            <Grid item xs={12}>
              <Button
                variant="outlined"
                component="label"
                startIcon={<UploadIcon />}
                fullWidth>

                {formData.file ? formData.file.name : 'Select File'}
                <input
                  type="file"
                  hidden
                  onChange={handleFileChange} />

              </Button>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenUploadDialog(false)}>Cancel</Button>
          <Button
            onClick={handleUploadDocument}
            variant="contained"
            disabled={!formData.title || !formData.category || !formData.version || !formData.file}>

            Upload
          </Button>
        </DialogActions>
      </Dialog>

      
      <Dialog open={openEditDialog} onClose={() => setOpenEditDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Document</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                label="Title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                fullWidth
                required />

            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                fullWidth
                multiline
                rows={3} />

            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth required>
                <InputLabel id="edit-category-label">Category</InputLabel>
                <Select
                  labelId="edit-category-label"
                  name="category"
                  value={formData.category}
                  onChange={handleSelectChange}
                  label="Category">

                  <MenuItem value="manual">Manual</MenuItem>
                  <MenuItem value="specification">Specification</MenuItem>
                  <MenuItem value="drawing">Drawing</MenuItem>
                  <MenuItem value="test_report">Test Report</MenuItem>
                  <MenuItem value="certificate">Certificate</MenuItem>
                  <MenuItem value="other">Other</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Version"
                name="version"
                value={formData.version}
                onChange={handleInputChange}
                fullWidth
                required />

            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Tags"
                name="tags"
                value={formData.tags}
                onChange={handleInputChange}
                fullWidth
                placeholder="Comma-separated tags"
                helperText="Enter tags separated by commas" />

            </Grid>
            {selectedDocument?.fileName &&
            <Grid item xs={12}>
                <Typography variant="body2" color="text.secondary">
                  Current File: {selectedDocument.fileName}
                </Typography>
              </Grid>
            }
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenEditDialog(false)}>Cancel</Button>
          <Button
            onClick={handleEditDocument}
            variant="contained"
            disabled={!formData.title || !formData.category || !formData.version}>

            Save Changes
          </Button>
        </DialogActions>
      </Dialog>
    </Box>);

};

export default DocumentationManager;
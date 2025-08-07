import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Grid,
  Divider,
  Chip,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Avatar,
  Rating,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Tab,
  Tabs,
  useTheme } from
'@mui/material';
import {
  Close as CloseIcon,
  Send as SendIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
  CheckCircle as CheckCircleIcon,
  SentimentSatisfied as SentimentSatisfiedIcon,
  SentimentDissatisfied as SentimentDissatisfiedIcon,
  SentimentNeutral as SentimentNeutralIcon,
  AttachFile as AttachFileIcon } from
'@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { Feedback } from '../../../services/feedback.service';

interface FeedbackDetailProps {
  open: boolean;
  onClose: () => void;
  feedback: Feedback;
  onUpdate: (id: string, data: any) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

const FeedbackDetail: React.FC<FeedbackDetailProps> = ({
  open,
  onClose,
  feedback,
  onUpdate,
  onDelete
}) => {
  const { t } = useTranslation();
  const theme = useTheme();

  // State
  const [tabValue, setTabValue] = useState<number>(0);
  const [editMode, setEditMode] = useState<boolean>(false);
  const [status, setStatus] = useState<string>(feedback.status);
  const [priority, setPriority] = useState<string>(feedback.priority);
  const [assignedTo, setAssignedTo] = useState<string | undefined>(feedback.assignedTo?._id);
  const [responseContent, setResponseContent] = useState<string>(feedback.response?.content || '');
  const [isPublicResponse, setIsPublicResponse] = useState<boolean>(feedback.response?.isPublic || false);
  const [note, setNote] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  // Handle tab change
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Handle save changes
  const handleSaveChanges = async () => {
    setLoading(true);

    const updateData: any = {
      status,
      priority
    };

    if (assignedTo) {
      updateData.assignedTo = assignedTo;
    }

    // Add response if provided
    if (responseContent.trim()) {
      updateData.response = {
        content: responseContent,
        isPublic: isPublicResponse
      };
    }

    // Add note if provided
    if (note.trim()) {
      updateData.note = note;
    }

    try {
      await onUpdate(feedback._id, updateData);
      setEditMode(false);
      setNote('');
    } catch (_error) {
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  };

  // Handle delete
  const handleDelete = () => {
    onDelete(feedback._id);
    onClose();
  };

  // Handle toggle featured
  const handleToggleFeatured = async () => {
    try {
      await onUpdate(feedback._id, {
        isFeatured: !feedback.isFeatured
      });
    } catch (_error) {
      console.error("Error:", err);
    }
  };

  // Handle toggle addressed
  const handleToggleAddressed = async () => {
    try {
      await onUpdate(feedback._id, {
        isAddressed: !feedback.isAddressed
      });
    } catch (_error) {
      console.error("Error:", err);
    }
  };

  // Get sentiment color
  const getSentimentColor = () => {
    if (!feedback.sentiment) return theme.palette.text.secondary;

    switch (feedback.sentiment.label) {
      case 'positive':
        return theme.palette.success.main;
      case 'negative':
        return theme.palette.error.main;
      case 'mixed':
        return theme.palette.warning.main;
      default:
        return theme.palette.text.secondary;
    }
  };

  // Get sentiment icon
  const GetSentimentIcon = () => {
    if (!feedback.sentiment) return <SentimentNeutralIcon />;

    switch (feedback.sentiment.label) {
      case 'positive':
        return <SentimentSatisfiedIcon style={{ color: theme.palette.success.main }} />;
      case 'negative':
        return <SentimentDissatisfiedIcon style={{ color: theme.palette.error.main }} />;
      default:
        return <SentimentNeutralIcon style={{ color: theme.palette.text.secondary }} />;
    }
  };

  // Render overview tab
  const RenderOverviewTab = () => {
    return (
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Box sx={{ mb: 2 }}>
            <Typography variant="h6" gutterBottom>
              {feedback.title || t('feedback.untitled')}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
              <Chip
                label={t(`feedback.types.${feedback.feedbackType}`)}
                size="small"
                color={
                feedback.feedbackType === 'bug' ? 'error' :
                feedback.feedbackType === 'feature' ? 'primary' :
                feedback.feedbackType === 'suggestion' ? 'success' :
                'default'
                } />

              <Chip
                label={t(`feedback.status.${feedback.status}`)}
                size="small"
                color={
                feedback.status === 'new' ? 'info' :
                feedback.status === 'in_progress' ? 'warning' :
                feedback.status === 'resolved' ? 'success' :
                feedback.status === 'closed' ? 'default' :
                'primary'
                } />

              <Chip
                label={t(`feedback.priority.${feedback.priority}`)}
                size="small"
                color={
                feedback.priority === 'critical' ? 'error' :
                feedback.priority === 'high' ? 'warning' :
                feedback.priority === 'medium' ? 'info' :
                'default'
                } />

              {feedback.sentiment &&
              <Chip
                icon={GetSentimentIcon()}
                label={t(`feedback.sentiment.${feedback.sentiment.label}`)}
                size="small"
                style={{ color: getSentimentColor() }} />

              }
            </Box>
          </Box>
        </Grid>
        
        <Grid item xs={12}>
          <Paper variant="outlined" sx={{ p: 2 }}>
            <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
              {feedback.content}
            </Typography>
          </Paper>
        </Grid>
        
        {feedback.rating &&
        <Grid item xs={12}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Typography variant="body2" sx={{ mr: 1 }}>
                {t('feedback.fields.rating')}:
              </Typography>
              <Rating value={feedback.rating} readOnly />
            </Box>
          </Grid>
        }
        
        {feedback.attachments && feedback.attachments.length > 0 &&
        <Grid item xs={12}>
            <Typography variant="subtitle2" gutterBottom>
              {t('feedback.attachments')}:
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {feedback.attachments.map((attachment, index) =>
            <Chip
              key={index}
              icon={<AttachFileIcon />}
              label={attachment.originalName}
              onClick={() => window.open(`/api/feedback/attachments/${attachment.filename}`, '_blank')} />

            )}
            </Box>
          </Grid>
        }
        
        <Grid item xs={12}>
          <Divider sx={{ my: 2 }} />
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Typography variant="subtitle2">
                {t('feedback.submissionInfo')}
              </Typography>
              <Box sx={{ mt: 1 }}>
                <Typography variant="body2">
                  <strong>{t('common.date')}:</strong> {format(new Date(feedback.createdAt), 'PPpp')}
                </Typography>
                <Typography variant="body2">
                  <strong>{t('feedback.fields.source')}:</strong> {t(`feedback.sources.${feedback.source}`)}
                </Typography>
                {feedback.context?.page &&
                <Typography variant="body2">
                    <strong>{t('feedback.fields.page')}:</strong> {feedback.context.page}
                  </Typography>
                }
                {feedback.userAgent &&
                <Typography variant="body2">
                    <strong>{t('feedback.fields.device')}:</strong> {feedback.userAgent.device} / {feedback.userAgent.browser} / {feedback.userAgent.os}
                  </Typography>
                }
              </Box>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="subtitle2">
                {t('feedback.submitter')}
              </Typography>
              <Box sx={{ mt: 1 }}>
                {feedback.user ?
                <>
                    <Typography variant="body2">
                      <strong>{t('common.name')}:</strong> {feedback.user.firstName} {feedback.user.lastName}
                    </Typography>
                    <Typography variant="body2">
                      <strong>{t('common.email')}:</strong> {feedback.user.email}
                    </Typography>
                  </> :
                feedback.contactInfo ?
                <>
                    {feedback.contactInfo.name &&
                  <Typography variant="body2">
                        <strong>{t('common.name')}:</strong> {feedback.contactInfo.name}
                      </Typography>
                  }
                    {feedback.contactInfo.email &&
                  <Typography variant="body2">
                        <strong>{t('common.email')}:</strong> {feedback.contactInfo.email}
                      </Typography>
                  }
                    {feedback.contactInfo.phone &&
                  <Typography variant="body2">
                        <strong>{t('common.phone')}:</strong> {feedback.contactInfo.phone}
                      </Typography>
                  }
                    <Typography variant="body2">
                      <strong>{t('feedback.allowContact')}:</strong> {feedback.contactInfo.allowContact ? t('common.yes') : t('common.no')}
                    </Typography>
                  </> :

                <Typography variant="body2" color="text.secondary">
                    {t('feedback.anonymous')}
                  </Typography>
                }
                {feedback.customer &&
                <Typography variant="body2">
                    <strong>{t('common.customer')}:</strong> {feedback.customer.name}
                  </Typography>
                }
              </Box>
            </Grid>
          </Grid>
        </Grid>
      </Grid>);

  };

  // Render response tab
  const RenderResponseTab = () => {
    return (
      <Grid container spacing={3}>
        {feedback.response ?
        <Grid item xs={12}>
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="subtitle2">
                  {t('feedback.response.title')}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {format(new Date(feedback.response.respondedAt), 'PPpp')} {t('common.by')} {feedback.response.respondedBy.firstName} {feedback.response.respondedBy.lastName}
                </Typography>
              </Box>
              <Divider sx={{ mb: 2 }} />
              <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                {feedback.response.content}
              </Typography>
              <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                <Chip
                label={feedback.response.isPublic ? t('feedback.response.public') : t('feedback.response.internal')}
                size="small"
                color={feedback.response.isPublic ? 'primary' : 'default'} />

              </Box>
            </Paper>
          </Grid> :

        <Grid item xs={12}>
            <Typography color="text.secondary" sx={{ fontStyle: 'italic' }}>
              {t('feedback.response.noResponse')}
            </Typography>
          </Grid>
        }
        
        {editMode &&
        <Grid item xs={12}>
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                {t('feedback.response.addResponse')}
              </Typography>
              <TextField
              fullWidth
              multiline
              rows={4}
              label={t('feedback.response.content')}
              value={responseContent}
              onChange={(e) => setResponseContent(e.target.value)}
              sx={{ mb: 2 }} />

              <FormControl component="fieldset">
                <label>
                  <input
                  type="checkbox"
                  checked={isPublicResponse}
                  onChange={(e) => setIsPublicResponse(e.target.checked)} />

                  {t('feedback.response.makePublic')}
                </label>
              </FormControl>
            </Box>
          </Grid>
        }
      </Grid>);

  };

  // Render notes tab
  const RenderNotesTab = () => {
    return (
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <List>
            {feedback.internalNotes && feedback.internalNotes.length > 0 ?
            feedback.internalNotes.map((note, index) =>
            <React.Fragment key={index}>
                  <ListItem alignItems="flex-start">
                    <ListItemAvatar>
                      <Avatar>
                        {note.user.firstName.charAt(0)}
                        {note.user.lastName.charAt(0)}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                  primary={
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="subtitle2">
                            {note.user.firstName} {note.user.lastName}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {format(new Date(note.createdAt), 'PPpp')}
                          </Typography>
                        </Box>
                  }
                  secondary={
                  <Typography
                    component="span"
                    variant="body2"
                    color="text.primary"
                    sx={{ display: 'inline', whiteSpace: 'pre-wrap' }}>

                          {note.content}
                        </Typography>
                  } />

                  </ListItem>
                  {index < feedback.internalNotes.length - 1 && <Divider variant="inset" component="li" />}
                </React.Fragment>
            ) :

            <Typography color="text.secondary" sx={{ fontStyle: 'italic', p: 2 }}>
                {t('feedback.notes.noNotes')}
              </Typography>
            }
          </List>
        </Grid>
        
        {editMode &&
        <Grid item xs={12}>
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                {t('feedback.notes.addNote')}
              </Typography>
              <TextField
              fullWidth
              multiline
              rows={3}
              label={t('feedback.notes.content')}
              value={note}
              onChange={(e) => setNote(e.target.value)} />

            </Box>
          </Grid>
        }
      </Grid>);

  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">
            {t('feedback.detail.title')}
          </Typography>
          <Box>
            <IconButton
              color={feedback.isFeatured ? 'warning' : 'default'}
              onClick={handleToggleFeatured}
              title={feedback.isFeatured ? t('feedback.unfeature') : t('feedback.feature')}>

              {feedback.isFeatured ? <StarIcon /> : <StarBorderIcon />}
            </IconButton>
            <IconButton
              color={feedback.isAddressed ? 'success' : 'default'}
              onClick={handleToggleAddressed}
              title={feedback.isAddressed ? t('feedback.unmarkAddressed') : t('feedback.markAddressed')}>

              <CheckCircleIcon />
            </IconButton>
            <IconButton
              color="primary"
              onClick={() => setEditMode(!editMode)}
              title={editMode ? t('common.cancel') : t('common.edit')}>

              <EditIcon />
            </IconButton>
            <IconButton
              color="error"
              onClick={handleDelete}
              title={t('common.delete')}>

              <DeleteIcon />
            </IconButton>
            <IconButton
              onClick={onClose}
              title={t('common.close')}>

              <CloseIcon />
            </IconButton>
          </Box>
        </Box>
      </DialogTitle>
      <DialogContent dividers>
        {editMode &&
        <Box sx={{ mb: 3, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={4}>
                <FormControl fullWidth size="small">
                  <InputLabel>{t('feedback.fields.status')}</InputLabel>
                  <Select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  label={t('feedback.fields.status')}>

                    <MenuItem value="new">{t('feedback.status.new')}</MenuItem>
                    <MenuItem value="reviewed">{t('feedback.status.reviewed')}</MenuItem>
                    <MenuItem value="in_progress">{t('feedback.status.in_progress')}</MenuItem>
                    <MenuItem value="resolved">{t('feedback.status.resolved')}</MenuItem>
                    <MenuItem value="closed">{t('feedback.status.closed')}</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={4}>
                <FormControl fullWidth size="small">
                  <InputLabel>{t('feedback.fields.priority')}</InputLabel>
                  <Select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  label={t('feedback.fields.priority')}>

                    <MenuItem value="low">{t('feedback.priority.low')}</MenuItem>
                    <MenuItem value="medium">{t('feedback.priority.medium')}</MenuItem>
                    <MenuItem value="high">{t('feedback.priority.high')}</MenuItem>
                    <MenuItem value="critical">{t('feedback.priority.critical')}</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={4}>
                <FormControl fullWidth size="small">
                  <InputLabel>{t('feedback.fields.assignedTo')}</InputLabel>
                  <Select
                  value={assignedTo || ''}
                  onChange={(e) => setAssignedTo(e.target.value)}
                  label={t('feedback.fields.assignedTo')}>

                    <MenuItem value="">{t('common.unassigned')}</MenuItem>
                    
                    <MenuItem value="user1">John Doe</MenuItem>
                    <MenuItem value="user2">Jane Smith</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </Box>
        }
        
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
          <Tabs value={tabValue} onChange={handleTabChange}>
            <Tab label={t('feedback.tabs.overview')} />
            <Tab label={t('feedback.tabs.response')} />
            <Tab label={t('feedback.tabs.notes')} />
          </Tabs>
        </Box>
        
        {tabValue === 0 && RenderOverviewTab()}
        {tabValue === 1 && RenderResponseTab()}
        {tabValue === 2 && RenderNotesTab()}
      </DialogContent>
      
      {editMode &&
      <DialogActions>
          <Button onClick={() => setEditMode(false)}>
            {t('common.cancel')}
          </Button>
          <Button
          onClick={handleSaveChanges}
          variant="contained"
          color="primary"
          disabled={loading}
          startIcon={<SendIcon />}>

            {t('common.save')}
          </Button>
        </DialogActions>
      }
    </Dialog>);

};

export default FeedbackDetail;
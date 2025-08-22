import React from 'react';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Typography,
  Grid,
  Paper,
  Divider,
  Chip,
  Button,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  LinearProgress,
  Tooltip,
  Alert,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow } from
'@mui/material';
import {
  VerifiedUser as VerifiedUserIcon,
  Warning as WarningIcon,
  Event as EventIcon,
  Check as CheckIcon,
  TimerOff as TimerOffIcon,
  HourglassEmpty as PendingIcon,
  Assignment as AssignmentIcon,
  Schedule as ScheduleIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Business as BusinessIcon,
  WorkHistory as WorkHistoryIcon } from
'@mui/icons-material';
import { format, parseISO, isAfter, addMonths, differenceInMonths } from 'date-fns';
import useSupplierQualification, { QualificationData } from '../hooks/useSupplierQualification';
import { StatusBadge } from '../../../components/common';

interface SupplierQualificationProps {
  supplierId: string;
}

const SupplierQualification: React.FC<SupplierQualificationProps> = ({ supplierId }) => {
  const { qualificationData, loading, error, refresh } = useSupplierQualification(supplierId);

  // Helper function to determine certification status color
  const getCertificationStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'expired':
        return 'error';
      case 'pending':
        return 'warning';
      default:
        return 'default';
    }
  };

  // Helper function to determine requirement status icon
  const GetRequirementStatusIcon = (status: string) => {
    switch (status) {
      case 'Completed':
        return <CheckIcon color="success" />;
      case 'Overdue':
        return <TimerOffIcon color="error" />;
      case 'In Progress':
        return <WorkHistoryIcon color="info" />;
      case 'Pending':
        return <PendingIcon color="warning" />;
      default:
        return <AssignmentIcon />;
    }
  };

  // Helper function to calculate expiration urgency
  const getExpirationUrgency = (expiryDate: string): 'critical' | 'warning' | 'normal' => {
    const now = new Date();
    const expiry = parseISO(expiryDate);
    const monthsLeft = differenceInMonths(expiry, now);

    if (isAfter(now, expiry)) return 'critical';
    if (monthsLeft <= 3) return 'critical';
    if (monthsLeft <= 6) return 'warning';
    return 'normal';
  };

  // Loading state
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>);

  }

  // Error state
  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 3 }}>
        {error}
      </Alert>);

  }

  // Empty state
  if (!qualificationData) {
    return (
      <Alert severity="info" sx={{ mb: 3 }}>
        No qualification data available for this supplier. 
        <Button color="primary" size="small" sx={{ ml: 2 }} onClick={() => {}}>
          Set Up Qualification
        </Button>
      </Alert>);

  }

  return (
    <Box>
      
      <Card sx={{ mb: 3 }}>
        <CardHeader
          title="Qualification Status"
          action={
          <Button
            startIcon={<EditIcon />}
            size="small"
            onClick={() => {}}>

              Update
            </Button>
          } />

        <CardContent>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <VerifiedUserIcon
                  sx={{
                    fontSize: 40,
                    mr: 2,
                    color: 'primary.main'
                  }} />

                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Qualification Level
                  </Typography>
                  <Typography variant="h5">
                    {qualificationData.qualificationLevel}
                  </Typography>
                </Box>
              </Box>
              
              <Divider sx={{ my: 2 }} />
              
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Certified Since
                  </Typography>
                  <Typography variant="body1">
                    {format(parseISO(qualificationData.certifiedSince), 'MMM d, yyyy')}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Expiry Date
                  </Typography>
                  <Typography
                    variant="body1"
                    color={
                    getExpirationUrgency(qualificationData.expiryDate) === 'critical' ?
                    'error.main' :
                    getExpirationUrgency(qualificationData.expiryDate) === 'warning' ?
                    'warning.main' :
                    'text.primary'
                    }>

                    {format(parseISO(qualificationData.expiryDate), 'MMM d, yyyy')}
                    {getExpirationUrgency(qualificationData.expiryDate) === 'critical' &&
                    <Tooltip title="Expiring soon or expired">
                        <WarningIcon fontSize="small" color="error" sx={{ ml: 1, verticalAlign: 'middle' }} />
                      </Tooltip>
                    }
                  </Typography>
                </Grid>
              </Grid>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 1, p: 2 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Active Certifications
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                  {qualificationData.certifications.
                  filter((cert) => cert.status === 'active').
                  map((cert, index) =>
                  <Chip
                    key={index}
                    label={cert.name}
                    color="primary"
                    variant="outlined"
                    size="small" />

                  )}
                  {qualificationData.certifications.filter((cert: any) => cert.status === 'active').length === 0 &&
                  <Typography variant="body2" fontStyle="italic">
                      No active certifications
                    </Typography>
                  }
                </Box>
              </Box>
              
              <Box sx={{ mt: 2 }}>
                <Button
                  variant="outlined"
                  startIcon={<AddIcon />}
                  size="small"
                  onClick={() => {}}>

                  Add Certification
                </Button>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      
      <Grid container spacing={3}>
        
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardHeader
              title="Requirements"
              action={
              <Button
                startIcon={<AddIcon />}
                size="small"
                onClick={() => {}}>

                  Add
                </Button>
              } />

            <CardContent>
              <List>
                {qualificationData.requirements.map((req, index: any) =>
                <ListItem
                  key={index}
                  divider={index < qualificationData.requirements.length - 1}
                  secondaryAction={
                  <Chip
                    label={req.status}
                    color={
                    req.status === 'Completed' ?
                    'success' :
                    req.status === 'Overdue' ?
                    'error' :
                    req.status === 'In Progress' ?
                    'info' :
                    'warning'
                    }
                    size="small" />

                  }>

                    <ListItemIcon>
                      {GetRequirementStatusIcon(req.status)}
                    </ListItemIcon>
                    <ListItemText
                    primary={req.name}
                    secondary={
                    <>
                          Due: {format(parseISO(req.dueDate), 'MMM d, yyyy')}
                          {req.nextDueDate &&
                      <>
                              {' • '}
                              Next: {format(parseISO(req.nextDueDate), 'MMM d, yyyy')}
                            </>
                      }
                        </>
                    } />

                  </ListItem>
                )}
              </List>
              {qualificationData.requirements.length === 0 &&
              <Typography variant="body2" color="text.secondary" fontStyle="italic">
                  No requirements defined
                </Typography>
              }
            </CardContent>
          </Card>
        </Grid>

        
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardHeader title="Certification Details" />
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Certificate</TableCell>
                    <TableCell>Issued</TableCell>
                    <TableCell>Expires</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {qualificationData.certifications.map((cert, index: any) =>
                  <TableRow key={index}>
                      <TableCell>{cert.name}</TableCell>
                      <TableCell>{format(parseISO(cert.issuedDate), 'MMM d, yyyy')}</TableCell>
                      <TableCell>
                        {cert.expiryDate ?
                      format(parseISO(cert.expiryDate), 'MMM d, yyyy') :
                      'N/A'}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={cert.status} />
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            {qualificationData.certifications.length === 0 &&
            <CardContent>
                <Typography variant="body2" color="text.secondary" fontStyle="italic">
                  No certifications recorded
                </Typography>
              </CardContent>
            }
          </Card>
        </Grid>
      </Grid>

      
      <Card sx={{ mt: 3 }}>
        <CardHeader
          title="Audit History"
          action={
          <Button
            startIcon={<AddIcon />}
            size="small"
            onClick={() => {}}>

              Record Audit
            </Button>
          } />

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Auditor</TableCell>
                <TableCell>Result</TableCell>
                <TableCell>Findings</TableCell>
                <TableCell>Critical</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {qualificationData.auditHistory.map((audit, index: any) =>
              <TableRow key={index}>
                  <TableCell>{format(parseISO(audit.date), 'MMM d, yyyy')}</TableCell>
                  <TableCell>{audit.type}</TableCell>
                  <TableCell>{audit.auditor}</TableCell>
                  <TableCell>
                    <Chip
                    label={audit.result}
                    color={audit.result === 'Passed' ? 'success' : 'error'}
                    size="small" />

                  </TableCell>
                  <TableCell>{audit.findings}</TableCell>
                  <TableCell>{audit.criticalFindings}</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        {qualificationData.auditHistory.length === 0 &&
        <CardContent>
            <Typography variant="body2" color="text.secondary" fontStyle="italic">
              No audit history recorded
            </Typography>
          </CardContent>
        }
      </Card>
    </Box>);

};

export default SupplierQualification;
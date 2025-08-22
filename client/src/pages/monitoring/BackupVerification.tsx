import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem } from
'@mui/material';
import {
  Refresh as RefreshIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  History as HistoryIcon } from
'@mui/icons-material';
import { format } from 'date-fns';
import backupVerificationService, {
  BackupVerificationStats,
  BackupLog,
  VerificationResults } from
'../../services/backup-verification.service';

/**
 * Component for displaying backup verification status and logs
 */
const BackupVerification: React.FC = () => {
  // State
  const [stats, setStats] = useState<any>(null);
  const [logs, setLogs] = useState<any>([]);
  const [failures, setFailures] = useState<any>([]);
  const [loading, setLoading] = useState<any>(true);
  const [error, setError] = useState<any>(null);
  const [verifying, setVerifying] = useState<any>(false);
  const [timeRange, setTimeRange] = useState<any>(30);
  const [detailsOpen, setDetailsOpen] = useState<any>(false);
  const [selectedLog, setSelectedLog] = useState<any>(null);

  // Load data
  useEffect(() => {
    loadData();
  }, [timeRange]);

  const loadData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Load stats
      const statsData = await backupVerificationService.getVerificationStatus(timeRange);
      setStats(statsData);

      // Load logs
      const logsData = await backupVerificationService.getVerificationLogs(10);
      setLogs(logsData);

      // Load failures
      const failuresData = await backupVerificationService.getVerificationFailures(5);
      setFailures(failuresData);
    } catch (_err) {
      console.error("Error:", error);
      setError('Failed to load backup verification data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Trigger verification
  const handleTriggerVerification = async () => {
    setVerifying(true);

    try {
      await backupVerificationService.triggerVerification();
      // Show success message
      setError('Verification process initiated. Results will be available shortly.');

      // Reload data after a delay to give the verification process time to complete
      setTimeout(() => {
        loadData();
      }, 5000);
    } catch (_err) {
      console.error("Error:", error);
      setError('Failed to trigger verification. Please try again.');
    } finally {
      setVerifying(false);
    }
  };

  // View details
  const handleViewDetails = (log: BackupLog) => {
    setSelectedLog(log);
    setDetailsOpen(true);
  };

  // Get status icon
  const GetStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircleIcon sx={{ color: 'success.main' }} />;
      case 'warning':
        return <WarningIcon sx={{ color: 'warning.main' }} />;
      case 'critical':
        return <ErrorIcon sx={{ color: 'error.main' }} />;
      default:
        return <InfoIcon sx={{ color: 'info.main' }} />;
    }
  };

  // Get status chip
  const getStatusChip = (success: boolean) => {
    return success ?
    <Chip
      icon={<CheckCircleIcon />}
      label="Success"
      color="success"
      size="small" /> :


    <Chip
      icon={<ErrorIcon />}
      label="Failed"
      color="error"
      size="small" />;


  };

  // Format date
  const formatDate = (date: Date | string) => {
    if (!date) return 'N/A';
    return format(new Date(date), 'MMM d, yyyy HH:mm:ss');
  };

  // Format duration
  const formatDuration = (seconds: number) => {
    if (seconds < 60) {
      return `${seconds.toFixed(1)} seconds`;
    } else {
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = seconds % 60;
      return `${minutes}m ${remainingSeconds.toFixed(0)}s`;
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Backup Verification System</Typography>
        <Box>
          <FormControl variant="outlined" size="small" sx={{ mr: 2, minWidth: 120 }}>
            <InputLabel>Time Range</InputLabel>
            <Select
              value={timeRange}
              onChange={(e) => setTimeRange(Number(e.target.value))}
              label="Time Range">

              <MenuItem value={7}>Last 7 days</MenuItem>
              <MenuItem value={30}>Last 30 days</MenuItem>
              <MenuItem value={90}>Last 90 days</MenuItem>
            </Select>
          </FormControl>
          <Button
            variant="contained"
            startIcon={<RefreshIcon />}
            onClick={loadData}
            disabled={loading}>

            Refresh
          </Button>
        </Box>
      </Box>

      {error &&
      <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      }

      {loading ?
      <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box> :

      <>
          
          {stats &&
        <Grid container spacing={3} sx={{ mb: 4 }}>
              <Grid item xs={12} md={4}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      {GetStatusIcon(stats.status)}
                      <Typography variant="h6" sx={{ ml: 1 }}>
                        System Status: {stats.status.charAt(0).toUpperCase() + stats.status.slice(1)}
                      </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      {stats.status === 'healthy' && 'All backup verifications are passing.'}
                      {stats.status === 'warning' && 'Some backup verifications are failing or outdated.'}
                      {stats.status === 'critical' && 'Critical backup verification failures detected!'}
                    </Typography>
                    {stats.mostRecentVerification &&
                <Typography variant="body2" sx={{ mt: 1 }}>
                        Last verified: {formatDate(stats.mostRecentVerification.verificationDate)}
                      </Typography>
                }
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={4}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" sx={{ mb: 2 }}>Verification Statistics</Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2" color="text.secondary">Total Verifications:</Typography>
                      <Typography variant="body1">{stats.totalVerifications}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2" color="text.secondary">Success Rate:</Typography>
                      <Typography variant="body1">{stats.successRate}%</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2" color="text.secondary">Average Duration:</Typography>
                      <Typography variant="body1">{formatDuration(parseFloat(stats.averageDuration))}</Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={4}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" sx={{ mb: 2 }}>Actions</Typography>
                    <Button
                  variant="contained"
                  color="primary"
                  fullWidth
                  onClick={handleTriggerVerification}
                  disabled={verifying}
                  sx={{ mb: 2 }}>

                      {verifying ? 'Verifying...' : 'Trigger Verification'}
                    </Button>
                    <Typography variant="body2" color="text.secondary">
                      Manually trigger a verification of the most recent backups.
                      This process runs in the background and may take several minutes.
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
        }

          
          <Typography variant="h5" sx={{ mb: 2 }}>Recent Verification Logs</Typography>
          <TableContainer component={Paper} sx={{ mb: 4 }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell>Backup Location</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Duration</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {logs.length > 0 ?
              logs.map((log: any) =>
              <TableRow key={log._id}>
                      <TableCell>{formatDate(log.verificationDate)}</TableCell>
                      <TableCell>{log.backupLocation}</TableCell>
                      <TableCell>{getStatusChip(log.success)}</TableCell>
                      <TableCell>{formatDuration(log.duration)}</TableCell>
                      <TableCell>
                        <Tooltip title="View Details">
                          <IconButton size="small" onClick={() => handleViewDetails(log)}>
                            <InfoIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
              ) :

              <TableRow>
                    <TableCell colSpan={5} align="center">
                      No verification logs found
                    </TableCell>
                  </TableRow>
              }
              </TableBody>
            </Table>
          </TableContainer>

          
          {failures.length > 0 &&
        <>
              <Typography variant="h5" sx={{ mb: 2 }}>Recent Failures</Typography>
              <TableContainer component={Paper} sx={{ mb: 4 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Date</TableCell>
                      <TableCell>Backup Location</TableCell>
                      <TableCell>Error</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {failures.map((failure: any) =>
                <TableRow key={failure._id}>
                        <TableCell>{formatDate(failure.verificationDate)}</TableCell>
                        <TableCell>{failure.backupLocation}</TableCell>
                        <TableCell>{failure.error || 'Unknown error'}</TableCell>
                        <TableCell>
                          <Tooltip title="View Details">
                            <IconButton size="small" onClick={() => handleViewDetails(failure)}>
                              <InfoIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                )}
                  </TableBody>
                </Table>
              </TableContainer>
            </>
        }
        </>
      }

      
      <Dialog open={detailsOpen} onClose={() => setDetailsOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Verification Details</DialogTitle>
        <DialogContent>
          {selectedLog &&
          <Box>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2">Backup Location</Typography>
                  <Typography variant="body2" gutterBottom>{selectedLog.backupLocation}</Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2">Verification Date</Typography>
                  <Typography variant="body2" gutterBottom>{formatDate(selectedLog.verificationDate)}</Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2">Status</Typography>
                  <Typography variant="body2" gutterBottom>{selectedLog.success ? 'Success' : 'Failed'}</Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2">Duration</Typography>
                  <Typography variant="body2" gutterBottom>{formatDuration(selectedLog.duration)}</Typography>
                </Grid>
                {selectedLog.details &&
              <Grid item xs={12}>
                    <Typography variant="subtitle2">Details</Typography>
                    <Typography variant="body2" gutterBottom>{selectedLog.details}</Typography>
                  </Grid>
              }
                {selectedLog.error &&
              <Grid item xs={12}>
                    <Typography variant="subtitle2">Error</Typography>
                    <Alert severity="error" sx={{ mt: 1 }}>{selectedLog.error}</Alert>
                  </Grid>
              }
                {selectedLog.metadata &&
              <Grid item xs={12}>
                    <Typography variant="subtitle2">Metadata</Typography>
                    <Box sx={{ mt: 1, p: 1, backgroundColor: 'grey.100', borderRadius: 1, overflow: 'auto' }}>
                      <pre>{JSON.stringify(selectedLog.metadata, null, 2)}</pre>
                    </Box>
                  </Grid>
              }
              </Grid>
            </Box>
          }
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>);

};

export default BackupVerification;
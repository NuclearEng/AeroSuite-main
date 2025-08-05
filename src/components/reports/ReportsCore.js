// Task: TS033 - Reports Core Framework
import React, { useState, useEffect, useCallback, useMemo, createContext, useContext } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  Box, 
  Paper, 
  Typography, 
  Button, 
  IconButton,
  Menu,
  MenuItem,
  Chip,
  Stack,
  Grid,
  Card,
  CardContent,
  CardActions,
  Divider,
  TextField,
  Select,
  FormControl,
  InputLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tabs,
  Tab,
  Alert,
  CircularProgress,
  LinearProgress,
  Tooltip,
  Badge,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Radio,
  RadioGroup,
  DatePicker,
  TimePicker,
  Autocomplete,
  Fab
} from '@mui/material';
import {
  Description as ReportIcon,
  Schedule as ScheduleIcon,
  Download as DownloadIcon,
  Email as EmailIcon,
  Print as PrintIcon,
  Share as ShareIcon,
  FilterList as FilterIcon,
  Settings as SettingsIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  Send as SendIcon,
  PlayArrow as RunIcon,
  Stop as StopIcon,
  History as HistoryIcon,
  PictureAsPdf as PdfIcon,
  TableChart as CsvIcon,
  Image as ImageIcon,
  Code as JsonIcon,
  BarChart as ChartIcon,
  Timeline as TimelineIcon,
  TrendingUp as TrendingIcon,
  Dashboard as DashboardIcon,
  CloudDownload as CloudDownloadIcon,
  Archive as ArchiveIcon
} from '@mui/icons-material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import styled from 'styled-components';
import { useTheme } from '@mui/material/styles';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import * as XLSX from 'xlsx';
import { Parser } from 'json2csv';
import { reportService } from '../../services/report.service';
import { useNotification } from '../../hooks/useNotification';
import { useDebounce } from '../../hooks/useDebounce';
import { ReportBuilder } from './ReportBuilder';
import { ReportViewer } from './ReportViewer';
import { ReportScheduler } from './ReportScheduler';
import { ReportHistory } from './ReportHistory';
import { ReportTemplates } from './ReportTemplates';

// Report Context
const ReportContext = createContext();

export const useReport = () => {
  const context = useContext(ReportContext);
  if (!context) {
    throw new Error('useReport must be used within ReportProvider');
  }
  return context;
};

// Styled Components
const ReportsContainer = styled(Box)`
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: ${({ theme }) => theme.palette.background.default};
`;

const ReportsHeader = styled(Box)`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: ${({ theme }) => theme.spacing(3)};
  background-color: ${({ theme }) => theme.palette.background.paper};
  border-bottom: 1px solid ${({ theme }) => theme.palette.divider};
`;

const ReportsContent = styled(Box)`
  flex: 1;
  overflow: auto;
  padding: ${({ theme }) => theme.spacing(3)};
`;

const ReportCard = styled(Card)`
  height: 100%;
  transition: all 0.3s ease;
  cursor: pointer;
  
  &:hover {
    transform: translateY(-4px);
    box-shadow: ${({ theme }) => theme.shadows[8]};
  }
`;

const ReportStatus = styled(Chip)`
  position: absolute;
  top: 8px;
  right: 8px;
`;

const FloatingActionButton = styled(Fab)`
  position: fixed;
  bottom: ${({ theme }) => theme.spacing(3)};
  right: ${({ theme }) => theme.spacing(3)};
`;

// Report Types
const REPORT_TYPES = {
  SUMMARY: { label: 'Summary Report', icon: <ReportIcon /> },
  DETAILED: { label: 'Detailed Report', icon: <DashboardIcon /> },
  ANALYTICS: { label: 'Analytics Report', icon: <ChartIcon /> },
  COMPLIANCE: { label: 'Compliance Report', icon: <ArchiveIcon /> },
  FINANCIAL: { label: 'Financial Report', icon: <TrendingIcon /> },
  OPERATIONAL: { label: 'Operational Report', icon: <TimelineIcon /> }
};

// Export Formats
const EXPORT_FORMATS = {
  PDF: { label: 'PDF', icon: <PdfIcon />, extension: 'pdf' },
  CSV: { label: 'CSV', icon: <CsvIcon />, extension: 'csv' },
  EXCEL: { label: 'Excel', icon: <TableChart />, extension: 'xlsx' },
  JSON: { label: 'JSON', icon: <JsonIcon />, extension: 'json' },
  IMAGE: { label: 'Image', icon: <ImageIcon />, extension: 'png' }
};

// Reports Core Component
export const ReportsCore = () => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const notification = useNotification();

  // State
  const [reports, setReports] = useState([]);
  const [selectedReport, setSelectedReport] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [filters, setFilters] = useState({
    type: '',
    status: '',
    dateRange: { start: null, end: null }
  });
  const [selectedReports, setSelectedReports] = useState([]);
  const [bulkActionMenu, setBulkActionMenu] = useState(null);
  const [reportData, setReportData] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // Load reports
  useEffect(() => {
    loadReports();
  }, [filters]);

  // Load reports data
  const loadReports = async () => {
    try {
      setIsLoading(true);
      const data = await reportService.getReports(filters);
      setReports(data.reports);
    } catch (error) {
      notification.error('Failed to load reports');
      console.error('Reports load error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Create new report
  const createReport = async (reportData) => {
    try {
      const report = await reportService.createReport(reportData);
      setReports([report, ...reports]);
      notification.success('Report created successfully');
      return report;
    } catch (error) {
      notification.error('Failed to create report');
      console.error('Create report error:', error);
      throw error;
    }
  };

  // Generate report
  const generateReport = async (reportId, parameters = {}) => {
    try {
      setIsGenerating(true);
      const data = await reportService.generateReport(reportId, parameters);
      setReportData(data);
      notification.success('Report generated successfully');
      return data;
    } catch (error) {
      notification.error('Failed to generate report');
      console.error('Generate report error:', error);
      throw error;
    } finally {
      setIsGenerating(false);
    }
  };

  // Update report
  const updateReport = async (reportId, updates) => {
    try {
      const updatedReport = await reportService.updateReport(reportId, updates);
      setReports(reports.map(r => r.id === reportId ? updatedReport : r));
      notification.success('Report updated successfully');
      return updatedReport;
    } catch (error) {
      notification.error('Failed to update report');
      console.error('Update report error:', error);
      throw error;
    }
  };

  // Delete report
  const deleteReport = async (reportId) => {
    try {
      await reportService.deleteReport(reportId);
      setReports(reports.filter(r => r.id !== reportId));
      notification.success('Report deleted successfully');
    } catch (error) {
      notification.error('Failed to delete report');
      console.error('Delete report error:', error);
    }
  };

  // Schedule report
  const scheduleReport = async (reportId, schedule) => {
    try {
      await reportService.scheduleReport(reportId, schedule);
      await loadReports(); // Reload to get updated schedule status
      notification.success('Report scheduled successfully');
    } catch (error) {
      notification.error('Failed to schedule report');
      console.error('Schedule report error:', error);
      throw error;
    }
  };

  // Export report
  const exportReport = async (reportId, format, data = null) => {
    try {
      let exportData = data;
      if (!exportData) {
        exportData = await generateReport(reportId);
      }

      switch (format) {
        case 'PDF':
          await exportToPDF(exportData);
          break;
        case 'CSV':
          await exportToCSV(exportData);
          break;
        case 'EXCEL':
          await exportToExcel(exportData);
          break;
        case 'JSON':
          await exportToJSON(exportData);
          break;
        case 'IMAGE':
          await exportToImage(exportData);
          break;
        default:
          throw new Error('Unsupported export format');
      }

      notification.success(`Report exported as ${format}`);
    } catch (error) {
      notification.error(`Failed to export report as ${format}`);
      console.error('Export error:', error);
    }
  };

  // Export to PDF
  const exportToPDF = async (data) => {
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    // Add header
    pdf.setFontSize(20);
    pdf.text(data.title || 'Report', 20, 20);
    
    pdf.setFontSize(12);
    pdf.text(`Generated: ${new Date().toLocaleString()}`, 20, 30);
    
    // Add content
    let yPosition = 50;
    
    if (data.summary) {
      pdf.setFontSize(14);
      pdf.text('Summary', 20, yPosition);
      yPosition += 10;
      
      pdf.setFontSize(10);
      const summaryLines = pdf.splitTextToSize(data.summary, 170);
      pdf.text(summaryLines, 20, yPosition);
      yPosition += summaryLines.length * 5 + 10;
    }

    // Add tables if present
    if (data.tables) {
      data.tables.forEach(table => {
        if (yPosition > 250) {
          pdf.addPage();
          yPosition = 20;
        }
        
        pdf.setFontSize(12);
        pdf.text(table.title, 20, yPosition);
        yPosition += 10;
        
        // Simple table rendering (you can use jspdf-autotable for better tables)
        table.data.forEach(row => {
          const rowText = Object.values(row).join(' | ');
          pdf.text(rowText, 20, yPosition);
          yPosition += 7;
        });
        
        yPosition += 10;
      });
    }

    // Save the PDF
    pdf.save(`report-${Date.now()}.pdf`);
  };

  // Export to CSV
  const exportToCSV = async (data) => {
    if (!data.tables || data.tables.length === 0) {
      throw new Error('No tabular data to export');
    }

    // Export first table (or combine multiple tables)
    const table = data.tables[0];
    const parser = new Parser({
      fields: Object.keys(table.data[0] || {})
    });
    
    const csv = parser.parse(table.data);
    
    // Download CSV
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `report-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Export to Excel
  const exportToExcel = async (data) => {
    const wb = XLSX.utils.book_new();
    
    // Add summary sheet
    if (data.summary) {
      const summaryData = [
        ['Report Title', data.title || 'Report'],
        ['Generated', new Date().toLocaleString()],
        ['Summary', data.summary]
      ];
      const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(wb, summarySheet, 'Summary');
    }

    // Add data sheets
    if (data.tables) {
      data.tables.forEach((table, index) => {
        const sheet = XLSX.utils.json_to_sheet(table.data);
        XLSX.utils.book_append_sheet(wb, sheet, table.title || `Data ${index + 1}`);
      });
    }

    // Save the Excel file
    XLSX.writeFile(wb, `report-${Date.now()}.xlsx`);
  };

  // Export to JSON
  const exportToJSON = async (data) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `report-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Export to Image
  const exportToImage = async (data) => {
    // This would need a reference to the report viewer element
    notification.info('Image export requires a rendered report view');
  };

  // Email report
  const emailReport = async (reportId, recipients, options = {}) => {
    try {
      await reportService.emailReport(reportId, {
        recipients,
        subject: options.subject || 'Report',
        message: options.message || 'Please find the attached report.',
        format: options.format || 'PDF'
      });
      notification.success('Report sent successfully');
    } catch (error) {
      notification.error('Failed to send report');
      console.error('Email report error:', error);
    }
  };

  // Bulk actions
  const handleBulkAction = async (action) => {
    setBulkActionMenu(null);
    
    try {
      switch (action) {
        case 'delete':
          await Promise.all(selectedReports.map(id => deleteReport(id)));
          setSelectedReports([]);
          break;
        case 'export':
          // Export selected reports
          for (const reportId of selectedReports) {
            await exportReport(reportId, 'PDF');
          }
          break;
        case 'schedule':
          // Open bulk schedule dialog
          setScheduleDialogOpen(true);
          break;
        default:
          break;
      }
    } catch (error) {
      console.error('Bulk action error:', error);
    }
  };

  // Render report card
  const renderReportCard = (report) => {
    const isSelected = selectedReports.includes(report.id);
    
    return (
      <Grid item xs={12} sm={6} md={4} key={report.id}>
        <ReportCard 
          elevation={isSelected ? 8 : 2}
          onClick={() => setSelectedReport(report)}
        >
          <CardContent>
            <Box position="relative">
              <ReportStatus
                label={report.status}
                color={report.status === 'active' ? 'success' : 'default'}
                size="small"
              />
              
              <Typography variant="h6" gutterBottom>
                {report.name}
              </Typography>
              
              <Chip
                icon={REPORT_TYPES[report.type]?.icon}
                label={REPORT_TYPES[report.type]?.label}
                size="small"
                sx={{ mb: 1 }}
              />
              
              <Typography variant="body2" color="text.secondary" paragraph>
                {report.description}
              </Typography>
              
              <Stack direction="row" spacing={1} flexWrap="wrap">
                {report.schedule && (
                  <Chip
                    icon={<ScheduleIcon />}
                    label="Scheduled"
                    size="small"
                    variant="outlined"
                  />
                )}
                {report.lastRun && (
                  <Typography variant="caption" color="text.secondary">
                    Last run: {new Date(report.lastRun).toLocaleDateString()}
                  </Typography>
                )}
              </Stack>
            </Box>
          </CardContent>
          
          <CardActions>
            <Tooltip title="Generate Report">
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  generateReport(report.id);
                }}
              >
                <RunIcon />
              </IconButton>
            </Tooltip>
            
            <Tooltip title="Export">
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  exportReport(report.id, 'PDF');
                }}
              >
                <DownloadIcon />
              </IconButton>
            </Tooltip>
            
            <Tooltip title="Schedule">
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedReport(report);
                  setScheduleDialogOpen(true);
                }}
              >
                <ScheduleIcon />
              </IconButton>
            </Tooltip>
            
            <Tooltip title="More Options">
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  // Open report menu
                }}
              >
                <MoreVertIcon />
              </IconButton>
            </Tooltip>
            
            <Box sx={{ ml: 'auto' }}>
              <Checkbox
                checked={isSelected}
                onChange={(e) => {
                  e.stopPropagation();
                  if (e.target.checked) {
                    setSelectedReports([...selectedReports, report.id]);
                  } else {
                    setSelectedReports(selectedReports.filter(id => id !== report.id));
                  }
                }}
                onClick={(e) => e.stopPropagation()}
              />
            </Box>
          </CardActions>
        </ReportCard>
      </Grid>
    );
  };

  // Context value
  const contextValue = {
    reports,
    selectedReport,
    createReport,
    generateReport,
    updateReport,
    deleteReport,
    scheduleReport,
    exportReport,
    emailReport
  };

  return (
    <ReportContext.Provider value={contextValue}>
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <ReportsContainer>
          <ReportsHeader>
            <Box>
              <Typography variant="h4" gutterBottom>
                Reports
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Create, generate, and manage your reports
              </Typography>
            </Box>
            
            <Stack direction="row" spacing={2} alignItems="center">
              {selectedReports.length > 0 && (
                <>
                  <Chip
                    label={`${selectedReports.length} selected`}
                    onDelete={() => setSelectedReports([])}
                  />
                  <Button
                    variant="outlined"
                    startIcon={<MoreVertIcon />}
                    onClick={(e) => setBulkActionMenu(e.currentTarget)}
                  >
                    Bulk Actions
                  </Button>
                </>
              )}
              
              <Button
                variant="outlined"
                startIcon={<FilterIcon />}
                onClick={() => {}}
              >
                Filter
              </Button>
              
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setCreateDialogOpen(true)}
              >
                Create Report
              </Button>
            </Stack>
          </ReportsHeader>
          
          <Tabs
            value={activeTab}
            onChange={(e, newValue) => setActiveTab(newValue)}
            sx={{ px: 3, borderBottom: 1, borderColor: 'divider' }}
          >
            <Tab label="All Reports" />
            <Tab label="My Reports" />
            <Tab label="Scheduled" />
            <Tab label="Templates" />
          </Tabs>
          
          <ReportsContent>
            {isLoading ? (
              <Box display="flex" justifyContent="center" p={4}>
                <CircularProgress />
              </Box>
            ) : (
              <>
                {activeTab === 0 && (
                  <Grid container spacing={3}>
                    {reports.map(renderReportCard)}
                  </Grid>
                )}
                
                {activeTab === 1 && (
                  <Grid container spacing={3}>
                    {reports.filter(r => r.createdBy === 'current-user').map(renderReportCard)}
                  </Grid>
                )}
                
                {activeTab === 2 && (
                  <Grid container spacing={3}>
                    {reports.filter(r => r.schedule).map(renderReportCard)}
                  </Grid>
                )}
                
                {activeTab === 3 && (
                  <ReportTemplates onSelectTemplate={(template) => {
                    // Create report from template
                    setCreateDialogOpen(true);
                  }} />
                )}
              </>
            )}
          </ReportsContent>
          
          {/* Create Report Dialog */}
          <Dialog
            open={createDialogOpen}
            onClose={() => setCreateDialogOpen(false)}
            maxWidth="lg"
            fullWidth
          >
            <DialogTitle>Create New Report</DialogTitle>
            <DialogContent>
              <ReportBuilder
                onSave={async (reportData) => {
                  await createReport(reportData);
                  setCreateDialogOpen(false);
                }}
                onCancel={() => setCreateDialogOpen(false)}
              />
            </DialogContent>
          </Dialog>
          
          {/* Schedule Report Dialog */}
          <Dialog
            open={scheduleDialogOpen}
            onClose={() => setScheduleDialogOpen(false)}
            maxWidth="md"
            fullWidth
          >
            <DialogTitle>Schedule Report</DialogTitle>
            <DialogContent>
              <ReportScheduler
                report={selectedReport}
                reports={selectedReports.length > 0 ? 
                  reports.filter(r => selectedReports.includes(r.id)) : 
                  [selectedReport].filter(Boolean)
                }
                onSave={async (schedule) => {
                  if (selectedReports.length > 0) {
                    await Promise.all(
                      selectedReports.map(id => scheduleReport(id, schedule))
                    );
                  } else if (selectedReport) {
                    await scheduleReport(selectedReport.id, schedule);
                  }
                  setScheduleDialogOpen(false);
                  setSelectedReports([]);
                }}
                onCancel={() => setScheduleDialogOpen(false)}
              />
            </DialogContent>
          </Dialog>
          
          {/* Report Viewer Dialog */}
          {reportData && (
            <Dialog
              open={Boolean(reportData)}
              onClose={() => setReportData(null)}
              maxWidth="lg"
              fullWidth
            >
              <DialogTitle>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Typography variant="h6">Report Preview</Typography>
                  <Stack direction="row" spacing={1}>
                    {Object.entries(EXPORT_FORMATS).map(([key, format]) => (
                      <Tooltip key={key} title={`Export as ${format.label}`}>
                        <IconButton
                          onClick={() => exportReport(selectedReport?.id, key, reportData)}
                        >
                          {format.icon}
                        </IconButton>
                      </Tooltip>
                    ))}
                  </Stack>
                </Box>
              </DialogTitle>
              <DialogContent>
                <ReportViewer data={reportData} />
              </DialogContent>
            </Dialog>
          )}
          
          {/* Bulk Actions Menu */}
          <Menu
            anchorEl={bulkActionMenu}
            open={Boolean(bulkActionMenu)}
            onClose={() => setBulkActionMenu(null)}
          >
            <MenuItem onClick={() => handleBulkAction('export')}>
              <DownloadIcon sx={{ mr: 1 }} /> Export Selected
            </MenuItem>
            <MenuItem onClick={() => handleBulkAction('schedule')}>
              <ScheduleIcon sx={{ mr: 1 }} /> Schedule Selected
            </MenuItem>
            <Divider />
            <MenuItem onClick={() => handleBulkAction('delete')}>
              <DeleteIcon sx={{ mr: 1 }} /> Delete Selected
            </MenuItem>
          </Menu>
          
          {/* Generating Report Overlay */}
          {isGenerating && (
            <Box
              position="fixed"
              top={0}
              left={0}
              right={0}
              bottom={0}
              display="flex"
              alignItems="center"
              justifyContent="center"
              bgcolor="rgba(0, 0, 0, 0.5)"
              zIndex={9999}
            >
              <Paper sx={{ p: 4, textAlign: 'center' }}>
                <CircularProgress size={60} sx={{ mb: 2 }} />
                <Typography variant="h6">Generating Report...</Typography>
                <Typography variant="body2" color="text.secondary">
                  This may take a few moments
                </Typography>
              </Paper>
            </Box>
          )}
        </ReportsContainer>
      </LocalizationProvider>
    </ReportContext.Provider>
  );
}; 
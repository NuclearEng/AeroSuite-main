const ReportTemplate = require('../models/ReportTemplate');
const reportBuilderService = require('../services/reportBuilder.service');
const { NotFoundError, BadRequestError, ServerError } = require('../utils/errorHandler');

/**
 * Get all report templates
 * @route GET /api/reports/templates
 * @access Private
 */
exports.getAllReportTemplates = async (req, res, next) => {
  try {
    // Create filter based on user role and query parameters
    const filter = {};
    
    // If not admin, only show templates created by the user or public templates
    if (!req.user.roles.includes('admin')) {
      filter.$or = [
        { createdBy: req.user._id },
        { isPublic: true }
      ];
    }
    
    // Add category filter if provided
    if (req.query.category) {
      filter.category = req.query.category;
    }
    
    const templates = await reportBuilderService.getAllReportTemplates(filter);
    
    res.status(200).json({
      success: true,
      count: templates.length,
      data: templates
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Get a single report template
 * @route GET /api/reports/templates/:id
 * @access Private
 */
exports.getReportTemplate = async (req, res, next) => {
  try {
    const template = await ReportTemplate.findById(req.params.id);
    
    if (!template) {
      return next(new NotFoundError(`Report template not found with id ${req.params.id}`));
    }
    
    // Check if user has access to the template
    if (!template.isPublic && template.createdBy.toString() !== req.user._id.toString() && !req.user.roles.includes('admin')) {
      return next(new BadRequestError('You do not have permission to access this template'));
    }
    
    res.status(200).json({
      success: true,
      data: template
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Create a new report template
 * @route POST /api/reports/templates
 * @access Private
 */
exports.createReportTemplate = async (req, res, next) => {
  try {
    // Add user ID to the template
    req.body.createdBy = req.user._id;
    
    // Create the template
    const template = await ReportTemplate.create(req.body);
    
    res.status(201).json({
      success: true,
      data: template
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Update a report template
 * @route PUT /api/reports/templates/:id
 * @access Private
 */
exports.updateReportTemplate = async (req, res, next) => {
  try {
    let template = await ReportTemplate.findById(req.params.id);
    
    if (!template) {
      return next(new NotFoundError(`Report template not found with id ${req.params.id}`));
    }
    
    // Check if user has permission to update
    if (template.createdBy.toString() !== req.user._id.toString() && !req.user.roles.includes('admin')) {
      return next(new BadRequestError('You do not have permission to update this template'));
    }
    
    // Update the template
    template = await ReportTemplate.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    
    res.status(200).json({
      success: true,
      data: template
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Delete a report template
 * @route DELETE /api/reports/templates/:id
 * @access Private
 */
exports.deleteReportTemplate = async (req, res, next) => {
  try {
    const template = await ReportTemplate.findById(req.params.id);
    
    if (!template) {
      return next(new NotFoundError(`Report template not found with id ${req.params.id}`));
    }
    
    // Check if user has permission to delete
    if (template.createdBy.toString() !== req.user._id.toString() && !req.user.roles.includes('admin')) {
      return next(new BadRequestError('You do not have permission to delete this template'));
    }
    
    await template.remove();
    
    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Generate a custom report
 * @route POST /api/reports/generate
 * @access Private
 */
exports.generateCustomReport = async (req, res, next) => {
  try {
    // Check if we have a valid template or report configuration
    if (!req.body.templateId && !req.body.reportConfig) {
      return next(new BadRequestError('Either a template ID or report configuration is required'));
    }
    
    let reportConfig;
    
    // If template ID is provided, get the template
    if (req.body.templateId) {
      const template = await ReportTemplate.findById(req.body.templateId);
      
      if (!template) {
        return next(new NotFoundError(`Report template not found with id ${req.body.templateId}`));
      }
      
      // Check if user has access to the template
      if (!template.isPublic && template.createdBy.toString() !== req.user._id.toString() && !req.user.roles.includes('admin')) {
        return next(new BadRequestError('You do not have permission to access this template'));
      }
      
      reportConfig = template.toObject();
    } else {
      // Use the provided report configuration
      reportConfig = req.body.reportConfig;
    }
    
    // Apply filters if provided
    if (req.body.filters) {
      reportConfig.filters = { ...reportConfig.filters, ...req.body.filters };
    }
    
    // Process data sources for each section
    for (const section of reportConfig.sections) {
      if (section.dataSource && section.dataSource.model) {
        try {
          // Apply custom filters to data source if provided
          if (req.body.filters && section.dataSource.query && section.dataSource.query.filter) {
            Object.assign(section.dataSource.query.filter, req.body.filters);
          }
          
          // Execute the data query
          const data = await reportBuilderService.executeDataQuery(section.dataSource);
          section.data = data;
        } catch (err) {
          console.error(`Error fetching data for section ${section.title}:`, err);
          section.data = [];
          section.error = `Error fetching data: ${err.message}`;
        }
      }
    }
    
    // Add report author
    reportConfig.author = req.user.firstName + ' ' + req.user.lastName;
    
    // Generate the PDF report
    const reportPath = await reportBuilderService.generateCustomReport(reportConfig, {
      download: req.body.download === true
    });
    
    // Check if we want to download the file directly or just get the path
    if (req.body.download === true) {
      res.download(reportPath, `${reportConfig.name.replace(/[^a-zA-Z0-9-_]/g, '-')}.pdf`, (err) => {
        if (err) {
          next(new ServerError('Error downloading report file'));
        }
      });
    } else {
      // Just return the file path (useful for previewing in client)
      const relativePath = reportPath.replace(process.cwd(), '');
      
      res.status(200).json({
        success: true,
        data: {
          reportPath: relativePath,
          reportUrl: `/api/reports${relativePath}`,
          reportName: reportConfig.name,
          generatedAt: new Date()
        },
        message: 'Report generated successfully'
      });
    }
  } catch (err) {
    next(err);
  }
};

/**
 * Preview a report template
 * @route POST /api/reports/preview
 * @access Private
 */
exports.previewReport = async (req, res, next) => {
  try {
    // Generate a preview version of the report
    req.body.download = false;
    
    // Call the generate function
    await exports.generateCustomReport(req, res, next);
  } catch (err) {
    next(err);
  }
};

/**
 * Get available data sources and fields for report builder
 * @route GET /api/reports/data-sources
 * @access Private
 */
exports.getDataSources = async (req, res, next) => {
  try {
    // Define available data sources with their fields
    const dataSources = [
      {
        model: 'Inspection',
        label: 'Inspections',
        fields: [
          { id: 'inspectionNumber', label: 'Inspection Number', type: 'string' },
          { id: 'title', label: 'Title', type: 'string' },
          { id: 'description', label: 'Description', type: 'string' },
          { id: 'inspectionType', label: 'Type', type: 'string' },
          { id: 'status', label: 'Status', type: 'string' },
          { id: 'result', label: 'Result', type: 'string' },
          { id: 'scheduledDate', label: 'Scheduled Date', type: 'date' },
          { id: 'completionDate', label: 'Completion Date', type: 'date' },
          { id: 'score', label: 'Score', type: 'number' },
          { id: 'customerId.name', label: 'Customer Name', type: 'string' },
          { id: 'supplierId.name', label: 'Supplier Name', type: 'string' },
          { id: 'inspectedBy.firstName', label: 'Inspector First Name', type: 'string' },
          { id: 'inspectedBy.lastName', label: 'Inspector Last Name', type: 'string' },
          { id: 'defects.length', label: 'Number of Defects', type: 'number' },
          { id: 'checklistItems.length', label: 'Number of Checklist Items', type: 'number' },
          { id: 'createdAt', label: 'Created At', type: 'date' },
          { id: 'updatedAt', label: 'Updated At', type: 'date' }
        ]
      },
      {
        model: 'Supplier',
        label: 'Suppliers',
        fields: [
          { id: 'name', label: 'Name', type: 'string' },
          { id: 'code', label: 'Code', type: 'string' },
          { id: 'industry', label: 'Industry', type: 'string' },
          { id: 'status', label: 'Status', type: 'string' },
          { id: 'primaryContactName', label: 'Primary Contact Name', type: 'string' },
          { id: 'primaryContactEmail', label: 'Primary Contact Email', type: 'string' },
          { id: 'phone', label: 'Phone', type: 'string' },
          { id: 'address.city', label: 'City', type: 'string' },
          { id: 'address.country', label: 'Country', type: 'string' },
          { id: 'website', label: 'Website', type: 'string' },
          { id: 'description', label: 'Description', type: 'string' },
          { id: 'overallRating', label: 'Overall Rating', type: 'number' },
          { id: 'certifications.length', label: 'Number of Certifications', type: 'number' },
          { id: 'createdAt', label: 'Created At', type: 'date' },
          { id: 'updatedAt', label: 'Updated At', type: 'date' }
        ]
      },
      {
        model: 'Customer',
        label: 'Customers',
        fields: [
          { id: 'name', label: 'Name', type: 'string' },
          { id: 'code', label: 'Code', type: 'string' },
          { id: 'industry', label: 'Industry', type: 'string' },
          { id: 'status', label: 'Status', type: 'string' },
          { id: 'primaryContactName', label: 'Primary Contact Name', type: 'string' },
          { id: 'primaryContactEmail', label: 'Primary Contact Email', type: 'string' },
          { id: 'phone', label: 'Phone', type: 'string' },
          { id: 'address.city', label: 'City', type: 'string' },
          { id: 'address.country', label: 'Country', type: 'string' },
          { id: 'website', label: 'Website', type: 'string' },
          { id: 'description', label: 'Description', type: 'string' },
          { id: 'createdAt', label: 'Created At', type: 'date' },
          { id: 'updatedAt', label: 'Updated At', type: 'date' }
        ]
      },
      {
        model: 'Component',
        label: 'Components',
        fields: [
          { id: 'name', label: 'Name', type: 'string' },
          { id: 'partNumber', label: 'Part Number', type: 'string' },
          { id: 'description', label: 'Description', type: 'string' },
          { id: 'category', label: 'Category', type: 'string' },
          { id: 'status', label: 'Status', type: 'string' },
          { id: 'revision', label: 'Revision', type: 'string' },
          { id: 'supplierId.name', label: 'Supplier Name', type: 'string' },
          { id: 'createdAt', label: 'Created At', type: 'date' },
          { id: 'updatedAt', label: 'Updated At', type: 'date' }
        ]
      }
    ];
    
    res.status(200).json({
      success: true,
      data: dataSources
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Export a report to Excel
 * @route POST /api/reports/export-excel
 * @access Private
 */
exports.exportToExcel = async (req, res, next) => {
  try {
    // Check if we have a valid template or report configuration
    if (!req.body.templateId && !req.body.reportConfig) {
      return next(new BadRequestError('Either a template ID or report configuration is required'));
    }
    
    let reportConfig;
    
    // If template ID is provided, get the template
    if (req.body.templateId) {
      const template = await ReportTemplate.findById(req.body.templateId);
      
      if (!template) {
        return next(new NotFoundError(`Report template not found with id ${req.body.templateId}`));
      }
      
      // Check if user has access to the template
      if (!template.isPublic && template.createdBy.toString() !== req.user._id.toString() && !req.user.roles.includes('admin')) {
        return next(new BadRequestError('You do not have permission to access this template'));
      }
      
      reportConfig = template.toObject();
    } else {
      // Use the provided report configuration
      reportConfig = req.body.reportConfig;
    }
    
    // Apply filters if provided
    if (req.body.filters) {
      reportConfig.filters = { ...reportConfig.filters, ...req.body.filters };
    }
    
    // Process data sources for each section
    for (const section of reportConfig.sections) {
      if (section.dataSource && section.dataSource.model) {
        try {
          // Apply custom filters to data source if provided
          if (req.body.filters && section.dataSource.query && section.dataSource.query.filter) {
            Object.assign(section.dataSource.query.filter, req.body.filters);
          }
          
          // Execute the data query
          const data = await reportBuilderService.executeDataQuery(section.dataSource);
          section.data = data;
        } catch (err) {
          console.error(`Error fetching data for section ${section.title}:`, err);
          section.data = [];
          section.error = `Error fetching data: ${err.message}`;
        }
      }
    }
    
    // Add report author
    reportConfig.author = req.user.firstName + ' ' + req.user.lastName;
    
    // Generate the Excel report
    const reportPath = await reportBuilderService.generateExcelReport(reportConfig, {
      download: req.body.download === true
    });
    
    // Check if we want to download the file directly or just get the path
    if (req.body.download === true) {
      res.download(reportPath, `${reportConfig.name.replace(/[^a-zA-Z0-9-_]/g, '-')}.xlsx`, (err) => {
        if (err) {
          next(new ServerError('Error downloading Excel file'));
        }
      });
    } else {
      // Just return the file path (useful for previewing in client)
      const relativePath = reportPath.replace(process.cwd(), '');
      
      res.status(200).json({
        success: true,
        data: {
          reportPath: relativePath,
          reportUrl: `/api/reports${relativePath}`,
          reportName: reportConfig.name,
          generatedAt: new Date(),
          format: 'excel'
        },
        message: 'Excel report generated successfully'
      });
    }
  } catch (err) {
    next(err);
  }
}; 
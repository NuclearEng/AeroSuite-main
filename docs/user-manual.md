# AeroSuite User Manual

> **Note**: The AeroSuite User Manual has been reorganized and expanded. Please visit the [new User Manual](./user-manual/index.md) for the most up-to-date and comprehensive documentation.

## Quick Links to New Documentation

- [Getting Started Guide](./user-manual/getting-started.md)
- [Role-Based Guides](./user-manual/roles/)
- [Feature Guides](./user-manual/features/)
- [Troubleshooting](./user-manual/support/troubleshooting.md)
- [Glossary](./user-manual/appendices/glossary.md)

---

This page will be maintained temporarily for reference but will be removed in a future update. Please update your bookmarks to the new documentation structure.

## Table of Contents

1. [Introduction](#introduction)
2. [Getting Started](#getting-started)
   - [System Requirements](#system-requirements)
   - [Account Creation](#account-creation)
   - [Logging In](#logging-in)
   - [Two-Factor Authentication](#two-factor-authentication)
   - [User Interface Overview](#user-interface-overview)
3. [Dashboard](#dashboard)
   - [Widgets and Customization](#widgets-and-customization)
   - [Performance Metrics](#performance-metrics)
   - [Notifications](#notifications)
4. [Supplier Management](#supplier-management)
   - [Adding Suppliers](#adding-suppliers)
   - [Supplier Details](#supplier-details)
   - [Supplier Performance Tracking](#supplier-performance-tracking)
   - [Risk Assessment](#risk-assessment)
   - [Supplier Audits](#supplier-audits)
5. [Customer Management](#customer-management)
   - [Adding Customers](#adding-customers)
   - [Customer Details](#customer-details)
   - [Activity History](#activity-history)
6. [Inspection Management](#inspection-management)
   - [Scheduling Inspections](#scheduling-inspections)
   - [Conducting Inspections](#conducting-inspections)
   - [Inspection Reports](#inspection-reports)
   - [Defect Tracking](#defect-tracking)
   - [Photo Upload](#photo-upload)
7. [Component Management](#component-management)
   - [Component Details](#component-details)
   - [Revision Tracking](#revision-tracking)
   - [Documentation Management](#documentation-management)
8. [Reporting](#reporting)
   - [Standard Reports](#standard-reports)
   - [Custom Reports](#custom-reports)
   - [Exporting Data](#exporting-data)
9. [User Settings](#user-settings)
   - [Profile Management](#profile-management)
   - [Notification Preferences](#notification-preferences)
   - [Theme Settings](#theme-settings)
10. [Mobile Access](#mobile-access)
    - [Responsive Design](#responsive-design)
    - [Offline Mode](#offline-mode)
11. [Administrator Functions](#administrator-functions)
    - [User Management](#user-management)
    - [Role-Based Access Control](#role-based-access-control)
    - [System Settings](#system-settings)
12. [Integration with ERP Systems](#integration-with-erp-systems)
    - [Supported Systems](#supported-systems)
    - [Data Synchronization](#data-synchronization)
13. [Troubleshooting](#troubleshooting)
    - [Common Issues](#common-issues)
    - [Support Contact](#support-contact)
14. [Appendices](#appendices)
    - [Keyboard Shortcuts](#keyboard-shortcuts)
    - [Glossary](#glossary)
    - [Release Notes](#release-notes)
15. [Payments](#payments)

## Introduction

AeroSuite is a comprehensive Quality Management System designed specifically for the aerospace industry. It helps aerospace companies manage suppliers, conduct inspections, track quality metrics, and ensure compliance with industry standards.

This manual provides detailed instructions on how to use all features of the AeroSuite platform. Whether you're a quality manager, inspector, supplier liaison, or administrator, this guide will help you navigate the system efficiently.

## Getting Started

### System Requirements

AeroSuite is a web-based application that works on modern web browsers. For optimal performance, we recommend:

- **Web Browsers**: Chrome (version 90+), Firefox (version 88+), Edge (version 90+), Safari (version 14+)
- **Screen Resolution**: Minimum 1366 x 768, recommended 1920 x 1080 or higher
- **Internet Connection**: Broadband connection (1 Mbps or faster)
- **Mobile Devices**: iOS 14+ or Android 10+

### Account Creation

New users can be added to AeroSuite only by system administrators. Once an administrator has created your account, you will receive an email with instructions to set up your password.

1. Check your email for an invitation from AeroSuite
2. Click the "Set Password" link in the email
3. Create a strong password following the displayed requirements
4. After setting your password, you will be redirected to the login page

### Logging In

1. Navigate to your organization's AeroSuite URL
2. Enter your email address and password
3. Click "Log In"

If your organization has enabled two-factor authentication, you'll be prompted to complete this step after entering your credentials.

### Two-Factor Authentication

AeroSuite supports multiple methods of two-factor authentication (2FA):

- **SMS Authentication**: Receive a verification code via text message
- **Authentication App**: Use an app like Google Authenticator or Microsoft Authenticator
- **Email Authentication**: Receive a verification code via email

To set up 2FA:
1. Go to User Settings > Security
2. Select your preferred authentication method
3. Follow the on-screen instructions to complete setup

### User Interface Overview

The AeroSuite interface consists of several key elements:

- **Top Navigation Bar**: Contains the search function, notifications, and user profile menu
- **Side Navigation**: Provides access to all main modules of the application
- **Main Content Area**: Displays the active module's content
- **Action Buttons**: Usually located at the top-right of the content area for primary actions
- **Breadcrumb Navigation**: Shows your current location in the application hierarchy

## Dashboard

The dashboard is your central hub for monitoring key metrics, viewing recent activities, and accessing commonly used functions.

### Widgets and Customization

The dashboard consists of widgets that display different types of information. You can customize your dashboard by:

1. Click the "Customize" button at the top-right of the dashboard
2. Drag and drop widgets to rearrange them
3. Click the "+" button to add new widgets
4. Click the "gear" icon on any widget to configure it or remove it
5. Use the size controls to resize widgets as needed
6. Click "Save Layout" when you're satisfied with your changes

### Performance Metrics

Performance metrics widgets provide at-a-glance information about:

- Inspection pass/fail rates
- Supplier performance trends
- Open defects by severity
- Upcoming inspections
- Recently completed activities

Each metric can be clicked to navigate to more detailed information.

### Notifications

The notifications center keeps you informed about important events in the system:

1. Click the bell icon in the top navigation bar to open the notifications panel
2. New notifications are highlighted and marked with a dot
3. Click any notification to go directly to the relevant item
4. Use the "Mark All as Read" option to clear all notifications
5. Configure notification preferences in User Settings

### Dashboard Calendar Widget

AeroSuite now includes a calendar widget on the dashboard. This widget displays scheduled inspections and key events in a familiar monthly calendar view.

- **View upcoming inspections**: See all scheduled inspections and audits at a glance.
- **Navigate by month**: Use the calendar controls to browse events by month.
- **Event details**: Click on an event to view more information (future enhancement).

The calendar widget helps users stay organized and aware of important dates directly from the dashboard.

## Supplier Management

The Supplier Management module allows you to track and manage all information related to your suppliers.

### Adding Suppliers

To add a new supplier:

1. Navigate to Suppliers > All Suppliers
2. Click the "Add Supplier" button
3. Fill in the required information:
   - Supplier name
   - Contact information
   - Address
   - Industry classification
   - Quality certifications
4. Click "Save" to create the supplier record

### Supplier Details

The supplier detail page provides comprehensive information about each supplier:

- **Overview Tab**: Basic information and key performance indicators
- **Contacts Tab**: Contact persons and their details
- **Qualifications Tab**: Certifications and capabilities
- **Performance Tab**: Historical performance metrics
- **Risk Tab**: Risk assessment scores and history
- **Audits Tab**: Audit history and findings
- **Documents Tab**: Related documentation

### Supplier Performance Tracking

AeroSuite automatically tracks supplier performance based on inspection results:

1. Navigate to the supplier's Performance tab
2. View metrics for:
   - On-time delivery
   - Quality conformance
   - Documentation accuracy
   - Responsiveness
   - Overall performance score
3. Use the date range selector to view performance over different periods
4. Export performance data using the "Export" button

### Risk Assessment

The risk assessment feature helps identify and monitor risks associated with suppliers:

1. Navigate to the supplier's Risk tab
2. View the current risk score and category (Low, Medium, High)
3. See individual risk factors and their scores
4. Track risk trend over time using the risk history chart
5. Click "Conduct Risk Assessment" to perform a new assessment

### Supplier Audits

Plan, conduct, and track supplier audits:

1. Navigate to the supplier's Audits tab
2. View upcoming and past audits
3. Click "Schedule Audit" to plan a new audit
4. For scheduled audits, click "Conduct Audit" to complete the audit checklist
5. Review audit findings and create corrective actions
6. Generate and download audit reports

## Customer Management

The Customer Management module helps you track customer information and activities.

### Adding Customers

To add a new customer:

1. Navigate to Customers > All Customers
2. Click the "Add Customer" button
3. Fill in the required information:
   - Customer name
   - Contact information
   - Address
   - Industry
   - Quality requirements
4. Click "Save" to create the customer record

### Customer Details

The customer detail page provides comprehensive information about each customer:

- **Overview Tab**: Basic information and relationship summary
- **Contacts Tab**: Contact persons and their details
- **Requirements Tab**: Customer-specific quality requirements
- **Products Tab**: Products supplied to this customer
- **Inspections Tab**: Inspection history related to this customer
- **Documents Tab**: Related documentation

### Activity History

Track all activities related to a customer:

1. Navigate to the customer's Activity tab
2. View a chronological list of all interactions and events
3. Filter activities by type, date, or user
4. Click on any activity to see more details

## Inspection Management

The Inspection Management module is used to plan, conduct, and report on quality inspections.

### Scheduling Inspections

To schedule a new inspection:

1. Navigate to Inspections > All Inspections
2. Click the "Schedule Inspection" button
3. Fill in the required information:
   - Supplier
   - Customer (if applicable)
   - Product/component
   - Inspection type
   - Date and time
   - Location
   - Inspector assignment
4. Click "Save" to create the inspection

### Conducting Inspections

To conduct an inspection:

1. Navigate to Inspections > Scheduled Inspections
2. Find your assigned inspection and click "Conduct"
3. The inspection interface will display:
   - Inspection details
   - Checklist of items to inspect
   - Defect recording section
   - Photo upload capability
4. Complete each item on the checklist
5. Record any defects found
6. Upload supporting photos
7. Complete the inspection by clicking "Submit Results"

### Inspection Reports

After an inspection is completed:

1. Navigate to the inspection details page
2. Click the "Generate Report" button
3. Review the automatically generated report
4. Add any additional comments or observations
5. Click "Finalize Report" to complete
6. Use the "Download PDF" or "Share" options to distribute the report

### Defect Tracking

Track and manage defects found during inspections:

1. Navigate to Inspections > Defects
2. View all defects or filter by:
   - Supplier
   - Customer
   - Product/component
   - Severity
   - Status
3. Click on any defect to view details
4. Update defect status as it progresses through resolution
5. Link corrective actions to defects

### Photo Upload

Add visual evidence to inspections:

1. During an inspection, click the "Upload Photos" button
2. Select photos from your device or take new ones
3. Add captions to explain each photo
4. Annotate photos if needed using the built-in tools
5. Photos are automatically included in inspection reports

## Component Management

The Component Management module helps track components and their revisions.

### Component Details

Each component record contains:

- Basic information (name, part number, description)
- Specifications and requirements
- Associated suppliers and customers
- Revision history
- Inspection history
- Related documentation

### Revision Tracking

Track changes to components over time:

1. Navigate to the component's Revisions tab
2. View the history of revisions with change details
3. Click "Add Revision" to record a new version
4. Compare revisions to see changes between versions

### Documentation Management

Manage documents related to components:

1. Navigate to the component's Documentation tab
2. View all associated documents
3. Upload new documents using the "Add Document" button
4. Set document categories and metadata
5. Control document access permissions

## Reporting

AeroSuite offers powerful reporting capabilities to analyze quality data.

### Standard Reports

Access pre-built reports:

1. Navigate to Reports > Standard Reports
2. Choose from available report templates:
   - Supplier Performance Summary
   - Inspection Results Analysis
   - Defect Trend Analysis
   - Audit Findings Summary
   - Quality Metrics Dashboard
3. Set parameters like date range and filters
4. Click "Generate" to create the report

### Custom Reports

Create your own custom reports:

1. Navigate to Reports > Custom Reports
2. Click "Create New Report"
3. Select data sources for your report
4. Choose display columns and metrics
5. Set filters and parameters
6. Define grouping and sorting
7. Select visualization options (tables, charts, etc.)
8. Save your report for future use

### Exporting Data

Export report data for further analysis:

1. Generate the desired report
2. Click the "Export" button
3. Choose your preferred format:
   - Excel (.xlsx)
   - CSV
   - PDF
   - HTML
4. Configure export options if available
5. Click "Download" to save the file

## User Settings

Personalize your AeroSuite experience through User Settings.

### Profile Management

Update your user profile:

1. Click your user avatar in the top-right corner
2. Select "Profile"
3. Update your information:
   - Name
   - Email
   - Phone number
   - Profile picture
   - Time zone
4. Click "Save Changes"

### Notification Preferences

Control which notifications you receive:

1. Go to User Settings > Notifications
2. Toggle notifications on/off for different event types
3. Choose notification delivery methods:
   - In-app notifications
   - Email notifications
   - SMS notifications (if enabled)
4. Set the frequency of digest notifications
5. Click "Save Preferences"

### Theme Settings

Customize the application appearance:

1. Go to User Settings > Appearance
2. Choose between light and dark mode
3. Select accent color scheme
4. Adjust font size if needed
5. Click "Apply" to save your preferences

## Mobile Access

AeroSuite is fully accessible on mobile devices.

### Responsive Design

The interface automatically adapts to different screen sizes:

- Desktop computers and laptops: Full interface
- Tablets: Optimized layout with all features
- Smartphones: Streamlined interface focused on essential functions

### Offline Mode

Work without an internet connection:

1. Enable offline mode in User Settings > General
2. Sync data before going offline by clicking "Sync Now"
3. Use the application normally while offline
4. Changes are stored locally and synchronized when you reconnect
5. Limitations in offline mode are indicated in the interface

## Administrator Functions

These features are available only to users with administrator privileges.

### User Management

Manage system users:

1. Navigate to Admin > Users
2. View all users and their status
3. Click "Add User" to create new accounts
4. Edit existing users by clicking their name
5. Deactivate users when needed
6. Reset passwords for users who need assistance

### Role-Based Access Control

Configure user permissions:

1. Navigate to Admin > Roles
2. View existing roles and their permissions
3. Click "Add Role" to create custom roles
4. Assign permissions by module and function
5. Apply roles to users in User Management

### System Settings

Configure global system settings:

1. Navigate to Admin > System Settings
2. Configure settings for:
   - Email notifications
   - Authentication policies
   - Data retention
   - Integration endpoints
   - Custom fields
   - Terminology customization

## Integration with ERP Systems

AeroSuite can integrate with various ERP systems to synchronize data.

### Supported Systems

The following ERP systems are supported:

- SAP
- Oracle
- Microsoft Dynamics
- NetSuite
- Custom integrations through API

### Data Synchronization

Configure data synchronization:

1. Navigate to Admin > Integrations
2. Select your ERP system
3. Configure connection parameters
4. Set up data mapping
5. Choose synchronization frequency
6. Enable/disable specific data types for sync

## Troubleshooting

### Common Issues

**Issue: Login Problems**
- Verify your username and password
- Check if Caps Lock is enabled
- Try resetting your password
- Contact your administrator if problems persist

**Issue: Slow Performance**
- Check your internet connection
- Clear your browser cache
- Try using a different browser
- Check if the issue is limited to a specific module

**Issue: Data Not Appearing**
- Refresh the page
- Check your filters and search criteria
- Verify you have permissions to view the data
- Contact your administrator for assistance

### Support Contact

For additional help:
- Email: support@aerosuite.com
- Phone: +1-555-123-4567
- In-app help: Click the "?" icon in the top navigation bar
- Knowledge Base: https://help.aerosuite.com

## Appendices

### Keyboard Shortcuts

Use keyboard shortcuts to navigate the application more efficiently:

- **Global Shortcuts**
  - `?`: Show keyboard shortcuts reference
  - `/`: Focus search bar
  - `Esc`: Close dialogs or cancel current action
  - `Ctrl+S`: Save current form or data

- **Navigation Shortcuts**
  - `g d`: Go to Dashboard
  - `g s`: Go to Suppliers
  - `g c`: Go to Customers
  - `g i`: Go to Inspections
  - `g r`: Go to Reports

- **Actions Shortcuts**
  - `n s`: New Supplier
  - `n c`: New Customer
  - `n i`: New Inspection
  - `n r`: New Report

### Glossary

**Audit**: A systematic examination of a supplier's quality management system.

**CAPA**: Corrective Action/Preventive Action, a process for addressing and resolving non-conformances.

**Defect**: A non-conformance or deviation from specified requirements.

**ERP**: Enterprise Resource Planning, a business process management software.

**Inspection**: A formal evaluation of product or process conformance to specified requirements.

**NCR**: Non-Conformance Report, a document describing a defect or issue.

**RBAC**: Role-Based Access Control, a method of regulating access based on user roles.

**Supplier**: An organization that provides products or services to your company.

### Release Notes

**Version 2.5.0 (Current)**
- Added custom dashboard widget builder
- Improved ERP integration capabilities
- Enhanced real-time notification system
- Added advanced user permissions management

**Version 2.4.0**
- Added offline mode capabilities
- Improved mobile responsiveness
- Enhanced reporting capabilities
- Added supplier risk assessment module

**Version 2.3.0**
- Added component revision tracking
- Improved inspection photo annotations
- Enhanced user interface
- Added support for bulk operations 

## Payments

AeroSuite now supports secure online payments via Stripe. Users can pay for services, subscriptions, or invoices directly from the application.

- **How to pay:** Click the payment button where available, enter the amount, and follow the Stripe Checkout process.
- **Security:** All payments are processed securely via Stripe. No sensitive card data is stored by AeroSuite.
- **Receipts:** After a successful payment, you will be redirected to a confirmation page and receive a receipt via email. 

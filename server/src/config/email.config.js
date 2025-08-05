/**
 * Email Service Configuration
 * 
 * This file contains configuration settings for email services used in the application.
 */

module.exports = {
  // Default email templates and settings
  defaultSender: process.env.EMAIL_FROM || 'AeroSuite <no-reply@aerosuite.com>',
  
  // Template settings
  templates: {
    // Color scheme
    colors: {
      primary: '#0a2f5c',
      secondary: '#4a90e2',
      success: '#28a745',
      warning: '#ffc107',
      danger: '#dc3545',
      light: '#f5f5f5',
      dark: '#333333'
    },
    
    // Common elements
    header: `
      <div style="background-color: #0a2f5c; padding: 20px; text-align: center;">
        <h1 style="color: white; margin: 0;">AeroSuite</h1>
      </div>
    `,
    footer: `
      <div style="background-color: #f5f5f5; padding: 15px; text-align: center; font-size: 12px; color: #666;">
        <p>© ${new Date().getFullYear()} AeroSuite. All rights reserved.</p>
      </div>
    `,
    button: (text, url) => `
      <div style="text-align: center; margin: 30px 0;">
        <a href="${url}" style="background-color: #0a2f5c; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">${text}</a>
      </div>
    `
  },
  
  // Notification settings
  notifications: {
    // Whether to send email notifications
    enabled: process.env.EMAIL_NOTIFICATIONS_ENABLED === 'true',
    
    // Types of notifications to send
    types: {
      inspectionScheduled: true,
      inspectionRescheduled: true,
      inspectionCompleted: true,
      inspectionCancelled: true,
      inspectionAssigned: true,
      inspectionReminder: true  // 24h before scheduled date
    },
    
    // Default recipients for system notifications
    systemAdmins: (process.env.ADMIN_EMAILS || '').split(',')
  }
}; 
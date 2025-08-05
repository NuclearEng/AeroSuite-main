#!/usr/bin/env node

/**
 * Database Migration Monitor
 * 
 * This script monitors the status of database migrations and sends notifications
 * if there are pending migrations that need to be applied.
 */

const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');
const { migrate } = require('mongoose-migrate-2');
const config = require('../migrations/config');
const nodemailer = require('nodemailer');

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

// Configure logging
const logger = {
  info: (message) => console.log(`[INFO] ${message}`),
  error: (message, err) => console.error(`[ERROR] ${message}`, err || ''),
  success: (message) => console.log(`[SUCCESS] ${message}`),
  warn: (message) => console.warn(`[WARNING] ${message}`)
};

/**
 * Check migration status
 * @returns {Promise<{completed: Array, pending: Array}>} Lists of completed and pending migrations
 */
async function checkMigrationStatus() {
  try {
    logger.info('Checking migration status...');
    
    const migrator = await migrate.create(config);
    
    const completed = await migrator.getCompletedMigrations();
    const pending = await migrator.getPendingMigrations();
    
    logger.info(`Found ${completed.length} completed and ${pending.length} pending migrations`);
    
    return {
      completed,
      pending
    };
  } catch (error) {
    logger.error('Failed to check migration status:', error);
    throw error;
  }
}

/**
 * Send notification email about pending migrations
 * @param {Array} pendingMigrations - List of pending migrations
 * @returns {Promise<void>}
 */
async function sendNotification(pendingMigrations) {
  try {
    if (!process.env.NOTIFICATION_EMAIL || !process.env.SMTP_HOST) {
      logger.warn('Email notification settings not configured, skipping notification');
      return;
    }
    
    logger.info('Sending notification email...');
    
    // Create email transporter
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD
      }
    });
    
    // Format migration list for email
    const migrationList = pendingMigrations.map(migration => {
      return `- ${migration.name} (created: ${new Date(migration.createdAt).toLocaleString()})`;
    }).join('\n');
    
    // Prepare email content
    const mailOptions = {
      from: process.env.SMTP_FROM || 'aerosuite@example.com',
      to: process.env.NOTIFICATION_EMAIL,
      subject: `[AeroSuite] ${pendingMigrations.length} Database Migrations Pending`,
      text: `
AeroSuite Database Migration Alert
=================================

There are ${pendingMigrations.length} pending database migrations that need to be applied:

${migrationList}

Please review these migrations and apply them using one of the following methods:

1. Run the deployment script:
   npm run deploy:with-migrations

2. Run migrations manually:
   npm run migrate:up

Environment: ${process.env.NODE_ENV || 'development'}
Server: ${process.env.SERVER_NAME || 'Unknown'}
Timestamp: ${new Date().toISOString()}

This is an automated message from the AeroSuite Database Migration Monitor.
`,
      html: `
<h2>AeroSuite Database Migration Alert</h2>

<p>There are <strong>${pendingMigrations.length} pending database migrations</strong> that need to be applied:</p>

<ul>
${pendingMigrations.map(migration => {
  return `<li><strong>${migration.name}</strong> (created: ${new Date(migration.createdAt).toLocaleString()})</li>`;
}).join('\n')}
</ul>

<p>Please review these migrations and apply them using one of the following methods:</p>

<ol>
  <li>Run the deployment script:<br><code>npm run deploy:with-migrations</code></li>
  <li>Run migrations manually:<br><code>npm run migrate:up</code></li>
</ol>

<p>
<strong>Environment:</strong> ${process.env.NODE_ENV || 'development'}<br>
<strong>Server:</strong> ${process.env.SERVER_NAME || 'Unknown'}<br>
<strong>Timestamp:</strong> ${new Date().toISOString()}
</p>

<p><em>This is an automated message from the AeroSuite Database Migration Monitor.</em></p>
`
    };
    
    // Send email
    const info = await transporter.sendMail(mailOptions);
    logger.success(`Notification email sent: ${info.messageId}`);
  } catch (error) {
    logger.error('Failed to send notification email:', error);
    // Don't throw the error, just log it
  }
}

/**
 * Log migration status to monitoring system
 * @param {Object} status - Migration status object
 * @returns {Promise<void>}
 */
async function logToMonitoring(status) {
  try {
    // If monitoring system integration is available
    if (process.env.ENABLE_MONITORING === 'true') {
      logger.info('Logging migration status to monitoring system...');
      
      // This is a placeholder for actual monitoring system integration
      // In a real implementation, this would send data to Prometheus, CloudWatch, etc.
      
      // Example: Record metrics
      const metrics = {
        timestamp: new Date().getTime(),
        completed_migrations: status.completed.length,
        pending_migrations: status.pending.length,
        environment: process.env.NODE_ENV || 'development',
        server: process.env.SERVER_NAME || 'Unknown'
      };
      
      // Log metrics for demonstration
      logger.info(`Migration metrics: ${JSON.stringify(metrics)}`);
      
      // In a real implementation, you would send these metrics to your monitoring system
      // Example: await sendToPrometheus(metrics);
    }
  } catch (error) {
    logger.error('Failed to log to monitoring system:', error);
    // Don't throw the error, just log it
  }
}

/**
 * Main execution function
 */
async function main() {
  try {
    // Connect to database
    logger.info('Connecting to database...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/aerosuite', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    logger.success('Connected to database');
    
    // Check migration status
    const status = await checkMigrationStatus();
    
    // Log to monitoring system
    await logToMonitoring(status);
    
    // Send notification if there are pending migrations
    if (status.pending.length > 0) {
      await sendNotification(status.pending);
    } else {
      logger.success('No pending migrations, no notification needed');
    }
    
    // Close database connection
    await mongoose.connection.close();
    logger.info('Database connection closed');
    
    process.exit(0);
  } catch (error) {
    logger.error('Unexpected error:', error);
    
    // Close database connection if open
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
      logger.info('Database connection closed');
    }
    
    process.exit(1);
  }
}

// Run the main function
main(); 
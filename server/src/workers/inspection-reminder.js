/**
 * Inspection Reminder Worker
 * 
 * This script checks for inspections scheduled for the next day and sends
 * reminder notifications to customers, suppliers, and inspectors.
 * 
 * It should be run daily via a cron job or similar scheduler.
 */

const mongoose = require('mongoose');
const Inspection = require('../models/inspection.model');
const Customer = require('../models/customer.model');
const Supplier = require('../models/supplier.model');
const User = require('../models/user.model');
const { sendInspectionReminderNotification } = require('../services/email.service');
const emailConfig = require('../config/email.config');
const logger = require('../utils/logger');

// Connect to database
require('../config/db.config');

/**
 * Send reminder notifications for inspections scheduled for tomorrow
 */
async function sendInspectionReminders() {
  try {
    logger.info('Starting inspection reminder job');
    
    // Check if notifications are enabled
    if (!emailConfig.notifications.enabled || !emailConfig.notifications.types.inspectionReminder) {
      logger.info('Inspection reminder notifications are disabled in configuration');
      return;
    }
    
    // Calculate tomorrow's date range (start of day to end of day)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    
    const endOfTomorrow = new Date(tomorrow);
    endOfTomorrow.setHours(23, 59, 59, 999);
    
    // Find inspections scheduled for tomorrow
    const inspections = await Inspection.find({
      scheduledDate: { $gte: tomorrow, $lte: endOfTomorrow },
      status: 'scheduled', // Only send reminders for inspections that are still scheduled
    }).populate('customerId')
      .populate('supplierId')
      .populate('inspectedBy');
    
    logger.info(`Found ${inspections.length} inspections scheduled for tomorrow`);
    
    // Send reminder notifications
    let remindersSent = 0;
    for (const inspection of inspections) {
      // Only proceed if we have all the necessary data
      if (!inspection.customerId || !inspection.supplierId || !inspection.inspectedBy) {
        logger.warn(`Skipping reminder for inspection ${inspection._id} due to missing data`);
        continue;
      }
      
      const customer = inspection.customerId;
      const supplier = inspection.supplierId;
      const inspector = inspection.inspectedBy;
      
      // Format inspection details
      const inspectionNumber = inspection.inspectionNumber || `INS-${inspection._id.toString().substring(0, 8).toUpperCase()}`;
      const inspectorName = `${inspector.firstName} ${inspector.lastName}`;
      
      // Location information
      const location = inspection.location || (inspection.isRemote ? 'Remote' : 'On-site');
      
      // Send to customer primary contact
      if (customer.primaryContactEmail) {
        try {
          await sendInspectionReminderNotification(
            customer.primaryContactEmail,
            inspectionNumber,
            customer.name,
            supplier.name,
            inspection.inspectionType,
            inspection.scheduledDate,
            inspectorName,
            location
          );
          remindersSent++;
        } catch (error) {
          logger.error(`Failed to send reminder to customer ${customer.name}: ${error.message}`);
        }
      }
      
      // Send to supplier primary contact
      if (supplier.primaryContactEmail) {
        try {
          await sendInspectionReminderNotification(
            supplier.primaryContactEmail,
            inspectionNumber,
            customer.name,
            supplier.name,
            inspection.inspectionType,
            inspection.scheduledDate,
            inspectorName,
            location
          );
          remindersSent++;
        } catch (error) {
          logger.error(`Failed to send reminder to supplier ${supplier.name}: ${error.message}`);
        }
      }
      
      // Send to inspector
      if (inspector.email) {
        try {
          await sendInspectionReminderNotification(
            inspector.email,
            inspectionNumber,
            customer.name,
            supplier.name,
            inspection.inspectionType,
            inspection.scheduledDate,
            inspectorName,
            location
          );
          remindersSent++;
        } catch (error) {
          logger.error(`Failed to send reminder to inspector ${inspectorName}: ${error.message}`);
        }
      }
    }
    
    logger.info(`Successfully sent ${remindersSent} reminder notifications`);
  } catch (error) {
    logger.error(`Error in inspection reminder job: ${error.message}`, error);
  } finally {
    // Close database connection
    mongoose.connection.close();
  }
}

// Execute the function if this script is run directly
if (require.main === module) {
  sendInspectionReminders()
    .then(() => {
      logger.info('Inspection reminder job completed');
      process.exit(0);
    })
    .catch(error => {
      logger.error(`Inspection reminder job failed: ${error.message}`, error);
      process.exit(1);
    });
}

module.exports = sendInspectionReminders; 
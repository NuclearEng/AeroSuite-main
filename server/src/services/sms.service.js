const { Twilio } = require('twilio');
const config = require('../config');
const logger = require('../infrastructure/logger');

/**
 * SMS Service for sending text messages
 * Uses Twilio as the underlying provider
 */
class SMSService {
  constructor() {
    this.initialized = false;
    this.twilioClient = null;
    this.fromNumber = null;
    this.initialize();
  }

  /**
   * Initialize the SMS service with configuration
   */
  initialize() {
    try {
      // Check if required configuration is available
      if (
        !config.sms.accountSid ||
        !config.sms.authToken ||
        !config.sms.fromNumber
      ) {
        logger.warn('SMS service not configured. SMS functionality will be disabled.');
        return;
      }

      // Create Twilio client
      this.twilioClient = new Twilio(
        config.sms.accountSid,
        config.sms.authToken
      );
      this.fromNumber = config.sms.fromNumber;
      this.initialized = true;
      logger.info('SMS service initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize SMS service:', error);
    }
  }

  /**
   * Send an SMS message
   * @param {string} to - Recipient phone number
   * @param {string} body - Message content
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} - Delivery status
   */
  async sendSMS(to, body, options = {}) {
    if (!this.initialized) {
      logger.warn('SMS service not initialized. Message not sent.');
      return { success: false, error: 'SMS service not initialized' };
    }

    try {
      // Validate phone number
      if (!this.isValidPhoneNumber(to)) {
        return { 
          success: false, 
          error: 'Invalid phone number format. Use E.164 format (+1234567890)' 
        };
      }

      // Validate message body
      if (!body || body.length === 0) {
        return { success: false, error: 'Message body cannot be empty' };
      }

      // Truncate message if it's too long
      const messageBody = body.length > 1600 ? `${body.substring(0, 1597)}...` : body;

      // Send the message
      const message = await this.twilioClient.messages.create({
        body: messageBody,
        from: options.from || this.fromNumber,
        to,
        ...options
      });

      logger.info(`SMS sent to ${to}, SID: ${message.sid}`);
      return {
        success: true,
        messageId: message.sid,
        status: message.status
      };
    } catch (error) {
      logger.error(`Failed to send SMS to ${to}:`, error);
      return {
        success: false,
        error: error.message || 'Failed to send SMS'
      };
    }
  }

  /**
   * Send a batch of SMS messages
   * @param {Array<Object>} messages - Array of message objects with to, body, and optional options
   * @returns {Promise<Array<Object>>} - Array of delivery statuses
   */
  async sendBatchSMS(messages) {
    if (!this.initialized) {
      logger.warn('SMS service not initialized. Batch not sent.');
      return messages.map(() => ({ 
        success: false, 
        error: 'SMS service not initialized' 
      }));
    }

    try {
      const results = [];
      
      // Process messages in batches to prevent rate limiting
      const batchSize = 10;
      for (let i = 0; i < messages.length; i += batchSize) {
        const batch = messages.slice(i, i + batchSize);
        
        // Send messages in parallel
        const batchResults = await Promise.all(
          batch.map(({ to, body, options = {} }) => 
            this.sendSMS(to, body, options)
          )
        );
        
        results.push(...batchResults);
        
        // Add delay between batches if needed to avoid rate limits
        if (i + batchSize < messages.length) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
      
      return results;
    } catch (error) {
      logger.error('Failed to send batch SMS:', error);
      return messages.map(() => ({ 
        success: false, 
        error: error.message || 'Failed to send batch SMS' 
      }));
    }
  }

  /**
   * Schedule an SMS to be sent at a future time
   * @param {string} to - Recipient phone number
   * @param {string} body - Message content
   * @param {Date} sendAt - When to send the message
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} - Scheduling status
   */
  async scheduleSMS(to, body, sendAt, options = {}) {
    if (!this.initialized) {
      logger.warn('SMS service not initialized. Schedule not created.');
      return { success: false, error: 'SMS service not initialized' };
    }

    try {
      // Validate sendAt date
      if (!(sendAt instanceof Date) || sendAt <= new Date()) {
        return { 
          success: false, 
          error: 'Schedule time must be a future date' 
        };
      }

      // Format the send time in ISO format
      const sendTime = sendAt.toISOString();

      const message = await this.twilioClient.messages.create({
        body,
        from: options.from || this.fromNumber,
        to,
        sendAt: sendTime,
        scheduleType: 'fixed',
        ...options
      });

      logger.info(`SMS scheduled for ${to} at ${sendTime}, SID: ${message.sid}`);
      return {
        success: true,
        messageId: message.sid,
        status: message.status,
        scheduledFor: sendTime
      };
    } catch (error) {
      logger.error(`Failed to schedule SMS to ${to}:`, error);
      return {
        success: false,
        error: error.message || 'Failed to schedule SMS'
      };
    }
  }

  /**
   * Cancel a scheduled SMS
   * @param {string} messageId - Message SID to cancel
   * @returns {Promise<Object>} - Cancellation status
   */
  async cancelScheduledSMS(messageId) {
    if (!this.initialized) {
      logger.warn('SMS service not initialized. Cannot cancel message.');
      return { success: false, error: 'SMS service not initialized' };
    }

    try {
      // Find and update the message to cancel it
      const message = await this.twilioClient.messages(messageId).update({ 
        status: 'canceled' 
      });

      logger.info(`Scheduled SMS ${messageId} cancelled`);
      return {
        success: true,
        messageId: message.sid,
        status: message.status
      };
    } catch (error) {
      logger.error(`Failed to cancel scheduled SMS ${messageId}:`, error);
      return {
        success: false,
        error: error.message || 'Failed to cancel scheduled SMS'
      };
    }
  }

  /**
   * Verify a phone number via SMS verification code
   * @param {string} phoneNumber - Phone number to verify
   * @returns {Promise<Object>} - Verification start status
   */
  async startPhoneVerification(phoneNumber) {
    if (!this.initialized) {
      logger.warn('SMS service not initialized. Verification not started.');
      return { success: false, error: 'SMS service not initialized' };
    }

    try {
      // Check if verification service is available
      if (!config.sms.verifyServiceSid) {
        return { 
          success: false, 
          error: 'Verification service not configured' 
        };
      }

      const verification = await this.twilioClient.verify.v2
        .services(config.sms.verifyServiceSid)
        .verifications.create({ to: phoneNumber, channel: 'sms' });

      logger.info(`Verification started for ${phoneNumber}, SID: ${verification.sid}`);
      return {
        success: true,
        verificationSid: verification.sid,
        status: verification.status
      };
    } catch (error) {
      logger.error(`Failed to start verification for ${phoneNumber}:`, error);
      return {
        success: false,
        error: error.message || 'Failed to start verification'
      };
    }
  }

  /**
   * Check a verification code
   * @param {string} phoneNumber - Phone number being verified
   * @param {string} code - Verification code to check
   * @returns {Promise<Object>} - Verification check status
   */
  async checkVerificationCode(phoneNumber, code) {
    if (!this.initialized) {
      logger.warn('SMS service not initialized. Verification not checked.');
      return { success: false, error: 'SMS service not initialized' };
    }

    try {
      // Check if verification service is available
      if (!config.sms.verifyServiceSid) {
        return { 
          success: false, 
          error: 'Verification service not configured' 
        };
      }

      const verification = await this.twilioClient.verify.v2
        .services(config.sms.verifyServiceSid)
        .verificationChecks.create({ to: phoneNumber, code });

      const isValid = verification.status === 'approved';
      
      logger.info(`Verification check for ${phoneNumber}: ${isValid ? 'approved' : 'rejected'}`);
      return {
        success: true,
        valid: isValid,
        status: verification.status
      };
    } catch (error) {
      logger.error(`Failed to check verification code for ${phoneNumber}:`, error);
      return {
        success: false,
        error: error.message || 'Failed to check verification code'
      };
    }
  }

  /**
   * Get the delivery status of a sent message
   * @param {string} messageId - Message SID to check
   * @returns {Promise<Object>} - Message status
   */
  async getMessageStatus(messageId) {
    if (!this.initialized) {
      logger.warn('SMS service not initialized. Cannot get message status.');
      return { success: false, error: 'SMS service not initialized' };
    }

    try {
      const message = await this.twilioClient.messages(messageId).fetch();
      
      return {
        success: true,
        messageId: message.sid,
        status: message.status,
        error: message.errorMessage,
        errorCode: message.errorCode,
        dateCreated: message.dateCreated,
        dateSent: message.dateSent,
        dateUpdated: message.dateUpdated
      };
    } catch (error) {
      logger.error(`Failed to get message status for ${messageId}:`, error);
      return {
        success: false,
        error: error.message || 'Failed to get message status'
      };
    }
  }

  /**
   * Validate phone number format
   * @param {string} phoneNumber - Phone number to validate
   * @returns {boolean} - Whether the phone number is valid
   */
  isValidPhoneNumber(phoneNumber) {
    // Basic E.164 format validation (+1234567890)
    const e164Regex = /^\+[1-9]\d{1,14}$/;
    return e164Regex.test(phoneNumber);
  }
}

// Create a singleton instance
const smsService = new SMSService();

module.exports = smsService; 
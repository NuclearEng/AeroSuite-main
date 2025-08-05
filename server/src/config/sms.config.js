/**
 * SMS Service Configuration
 * 
 * This file contains configuration for the SMS service using Twilio
 * 
 * Environment Variables:
 * - TWILIO_ACCOUNT_SID: Your Twilio account SID
 * - TWILIO_AUTH_TOKEN: Your Twilio auth token
 * - TWILIO_PHONE_NUMBER: Your Twilio phone number in E.164 format (+1234567890)
 * - TWILIO_VERIFY_SERVICE_SID: Your Twilio Verify service SID (optional)
 */

module.exports = {
  // Twilio account credentials
  accountSid: process.env.TWILIO_ACCOUNT_SID || '',
  authToken: process.env.TWILIO_AUTH_TOKEN || '',
  
  // Phone number to send from (must be a valid Twilio number)
  fromNumber: process.env.TWILIO_PHONE_NUMBER || '',
  
  // Twilio Verify service SID for phone verification
  verifyServiceSid: process.env.TWILIO_VERIFY_SERVICE_SID || '',
  
  // Rate limiting settings
  rateLimit: {
    // Maximum messages per day to a single number
    maxPerDayPerNumber: 10,
    
    // Maximum batch size for sending multiple messages at once
    maxBatchSize: 100,
    
    // Delay between batch chunks in milliseconds
    batchDelayMs: 1000
  },
  
  // Message templates
  templates: {
    verification: 'Your AeroSuite verification code is: {code}',
    inspectionReminder: 'Reminder: You have an inspection scheduled for {date} at {time} for {supplier}.',
    inspectionComplete: 'The inspection for {supplier} has been completed. View details in your AeroSuite dashboard.',
    alert: 'ALERT: {message}',
    userWelcome: 'Welcome to AeroSuite! Your account is now active.',
    passwordReset: 'Your AeroSuite password reset code is: {code}. Valid for 15 minutes.'
  },
  
  // Features
  features: {
    // Whether to enable scheduled SMS
    enableScheduled: true,
    
    // Whether to enable batch sending
    enableBatch: true,
    
    // Whether to enable phone verification
    enableVerification: true
  },
  
  // Default options
  defaults: {
    // Message status webhook URL
    statusCallback: process.env.SMS_STATUS_WEBHOOK_URL || '',
    
    // Whether to attempt to validate phone numbers before sending
    validateNumbers: true
  }
}; 
const nodemailer = require('nodemailer');

/**
 * Create a transporter for sending emails
 */
const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

/**
 * Send a password reset email
 * @param {string} to - Recipient email
 * @param {string} resetUrl - Password reset URL
 * @param {string} firstName - Recipient's first name
 */
exports.sendPasswordResetEmail = async (to, resetUrl, firstName) => {
  const mailOptions = {
    from: `AeroSuite <${process.env.EMAIL_USER}>`,
    to,
    subject: 'Password Reset Request',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #0a2f5c; padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">AeroSuite</h1>
        </div>
        <div style="padding: 20px; border: 1px solid #ddd; border-top: none;">
          <h2>Password Reset</h2>
          <p>Hello ${firstName},</p>
          <p>We received a request to reset your password. If you didn't make this request, you can ignore this email.</p>
          <p>To reset your password, click the button below:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" style="background-color: #0a2f5c; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">Reset Password</a>
          </div>
          <p>Or copy and paste this link into your browser:</p>
          <p><a href="${resetUrl}" style="color: #0a2f5c;">${resetUrl}</a></p>
          <p>This link will expire in 1 hour.</p>
          <p>Thank you,<br/>The AeroSuite Team</p>
        </div>
        <div style="background-color: #f5f5f5; padding: 15px; text-align: center; font-size: 12px; color: #666;">
          <p>© ${new Date().getFullYear()} AeroSuite. All rights reserved.</p>
        </div>
      </div>
    `
  };

  await transporter.sendMail(mailOptions);
};

/**
 * Send inspection notification email
 * @param {string} to - Recipient email
 * @param {string} inspectionNumber - Inspection number
 * @param {string} customerName - Customer name
 * @param {string} supplierName - Supplier name
 * @param {string} inspectionType - Type of inspection
 * @param {string} scheduledDate - Scheduled date of inspection
 * @param {string} inspectorName - Name of assigned inspector
 */
exports.sendInspectionNotification = async (to, inspectionNumber, customerName, supplierName, inspectionType, scheduledDate, inspectorName) => {
  const formattedDate = new Date(scheduledDate).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const mailOptions = {
    from: `AeroSuite <${process.env.EMAIL_USER}>`,
    to,
    subject: `New Inspection Scheduled: ${inspectionNumber}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #0a2f5c; padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">AeroSuite</h1>
        </div>
        <div style="padding: 20px; border: 1px solid #ddd; border-top: none;">
          <h2>New Inspection Scheduled</h2>
          <p>An inspection has been scheduled with the following details:</p>
          
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold;">Inspection Number:</td>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;">${inspectionNumber}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold;">Customer:</td>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;">${customerName}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold;">Supplier:</td>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;">${supplierName}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold;">Inspection Type:</td>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;">${inspectionType}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold;">Scheduled Date:</td>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;">${formattedDate}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold;">Inspector:</td>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;">${inspectorName}</td>
            </tr>
          </table>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.CLIENT_URL}/inspections/${inspectionNumber}" style="background-color: #0a2f5c; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">View Inspection Details</a>
          </div>
          
          <p>Thank you,<br/>The AeroSuite Team</p>
        </div>
        <div style="background-color: #f5f5f5; padding: 15px; text-align: center; font-size: 12px; color: #666;">
          <p>© ${new Date().getFullYear()} AeroSuite. All rights reserved.</p>
        </div>
      </div>
    `
  };

  await transporter.sendMail(mailOptions);
};

/**
 * Send inspection result notification email
 * @param {string} to - Recipient email
 * @param {string} inspectionNumber - Inspection number
 * @param {string} customerName - Customer name
 * @param {string} supplierName - Supplier name
 * @param {string} result - Inspection result (pass/fail/conditional)
 * @param {string} completionDate - Completion date of inspection
 * @param {string} inspectorName - Name of inspector
 * @param {number} defectCount - Number of defects found
 */
exports.sendInspectionResultNotification = async (to, inspectionNumber, customerName, supplierName, result, completionDate, inspectorName, defectCount) => {
  const formattedDate = new Date(completionDate).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  // Set color based on result
  let resultColor = '#28a745'; // Green for pass
  if (result === 'fail') {
    resultColor = '#dc3545'; // Red for fail
  } else if (result === 'conditional') {
    resultColor = '#ffc107'; // Yellow for conditional
  }

  const mailOptions = {
    from: `AeroSuite <${process.env.EMAIL_USER}>`,
    to,
    subject: `Inspection Results: ${inspectionNumber} - ${result.toUpperCase()}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #0a2f5c; padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">AeroSuite</h1>
        </div>
        <div style="padding: 20px; border: 1px solid #ddd; border-top: none;">
          <h2>Inspection Results</h2>
          <p>An inspection has been completed with the following results:</p>
          
          <div style="text-align: center; margin: 20px 0;">
            <span style="display: inline-block; background-color: ${resultColor}; color: white; padding: 10px 20px; border-radius: 4px; font-size: 18px; font-weight: bold;">
              ${result.toUpperCase()}
            </span>
          </div>
          
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold;">Inspection Number:</td>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;">${inspectionNumber}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold;">Customer:</td>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;">${customerName}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold;">Supplier:</td>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;">${supplierName}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold;">Completion Date:</td>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;">${formattedDate}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold;">Inspector:</td>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;">${inspectorName}</td>
            </tr>
            ${defectCount > 0 ? `
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold;">Defects Found:</td>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;">${defectCount}</td>
            </tr>
            ` : ''}
          </table>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.CLIENT_URL}/inspections/${inspectionNumber}" style="background-color: #0a2f5c; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">View Full Report</a>
          </div>
          
          <p>Thank you,<br/>The AeroSuite Team</p>
        </div>
        <div style="background-color: #f5f5f5; padding: 15px; text-align: center; font-size: 12px; color: #666;">
          <p>© ${new Date().getFullYear()} AeroSuite. All rights reserved.</p>
        </div>
      </div>
    `
  };

  await transporter.sendMail(mailOptions);
};

/**
 * Send two-factor authentication code via email
 * @param {string} to - Recipient email
 * @param {string} code - The 2FA verification code
 * @param {string} firstName - Recipient's first name
 */
exports.sendTwoFactorCode = async (to, code, firstName) => {
  const mailOptions = {
    from: `AeroSuite <${process.env.EMAIL_USER}>`,
    to,
    subject: 'Your Two-Factor Authentication Code',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #0a2f5c; padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">AeroSuite</h1>
        </div>
        <div style="padding: 20px; border: 1px solid #ddd; border-top: none;">
          <h2>Two-Factor Authentication</h2>
          <p>Hello ${firstName},</p>
          <p>Your verification code for AeroSuite is:</p>
          <div style="text-align: center; margin: 30px 0;">
            <div style="font-size: 28px; letter-spacing: 5px; font-weight: bold; padding: 15px; background-color: #f5f5f5; border-radius: 4px; display: inline-block;">
              ${code}
            </div>
          </div>
          <p>This code will expire in 10 minutes.</p>
          <p>If you didn't request this code, please secure your account by changing your password immediately.</p>
          <p>Thank you,<br/>The AeroSuite Team</p>
        </div>
        <div style="background-color: #f5f5f5; padding: 15px; text-align: center; font-size: 12px; color: #666;">
          <p>© ${new Date().getFullYear()} AeroSuite. All rights reserved.</p>
        </div>
      </div>
    `
  };

  await transporter.sendMail(mailOptions);
};

/**
 * Send email notification about new 2FA setup
 * @param {string} to - Recipient email
 * @param {string} firstName - Recipient's first name
 */
exports.sendTwoFactorEnabledNotification = async (to, firstName) => {
  const mailOptions = {
    from: `AeroSuite <${process.env.EMAIL_USER}>`,
    to,
    subject: 'Two-Factor Authentication Enabled',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #0a2f5c; padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">AeroSuite</h1>
        </div>
        <div style="padding: 20px; border: 1px solid #ddd; border-top: none;">
          <h2>Security Update</h2>
          <p>Hello ${firstName},</p>
          <p>Two-factor authentication has been successfully enabled on your AeroSuite account.</p>
          <p>Your account is now better protected. From now on, you'll need to provide a verification code when signing in.</p>
          <p>If you did not make this change, please contact support immediately.</p>
          <p>Thank you,<br/>The AeroSuite Team</p>
        </div>
        <div style="background-color: #f5f5f5; padding: 15px; text-align: center; font-size: 12px; color: #666;">
          <p>© ${new Date().getFullYear()} AeroSuite. All rights reserved.</p>
        </div>
      </div>
    `
  };

  await transporter.sendMail(mailOptions);
};

/**
 * Send email verification email
 * @param {string} to - Recipient email
 * @param {string} verificationUrl - Email verification URL
 * @param {string} firstName - Recipient's first name
 */
exports.sendEmailVerificationEmail = async (to, verificationUrl, firstName) => {
  const mailOptions = {
    from: `AeroSuite <${process.env.EMAIL_USER}>`,
    to,
    subject: 'Verify Your Email Address',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #0a2f5c; padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">AeroSuite</h1>
        </div>
        <div style="padding: 20px; border: 1px solid #ddd; border-top: none;">
          <h2>Email Verification</h2>
          <p>Hello ${firstName},</p>
          <p>Thank you for creating an account with AeroSuite. To complete your registration, please verify your email address.</p>
          <p>This verification link will expire in 24 hours.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationUrl}" style="background-color: #0a2f5c; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">Verify Email Address</a>
          </div>
          <p>Or copy and paste this link into your browser:</p>
          <p><a href="${verificationUrl}" style="color: #0a2f5c;">${verificationUrl}</a></p>
          <p>If you did not create an account, please ignore this email.</p>
          <p>Thank you,<br/>The AeroSuite Team</p>
        </div>
        <div style="background-color: #f5f5f5; padding: 15px; text-align: center; font-size: 12px; color: #666;">
          <p>© ${new Date().getFullYear()} AeroSuite. All rights reserved.</p>
        </div>
      </div>
    `
  };

  await transporter.sendMail(mailOptions);
};

/**
 * Send email verification success notification
 * @param {string} to - Recipient email
 * @param {string} firstName - Recipient's first name
 */
exports.sendEmailVerificationSuccessEmail = async (to, firstName) => {
  const mailOptions = {
    from: `AeroSuite <${process.env.EMAIL_USER}>`,
    to,
    subject: 'Email Verification Successful',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #0a2f5c; padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">AeroSuite</h1>
        </div>
        <div style="padding: 20px; border: 1px solid #ddd; border-top: none;">
          <h2>Email Verified Successfully</h2>
          <p>Hello ${firstName},</p>
          <p>Your email address has been successfully verified. Thank you for completing your registration.</p>
          <p>You can now access all features of the AeroSuite platform.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.CLIENT_URL}/login" style="background-color: #0a2f5c; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">Go to Login</a>
          </div>
          <p>Thank you,<br/>The AeroSuite Team</p>
        </div>
        <div style="background-color: #f5f5f5; padding: 15px; text-align: center; font-size: 12px; color: #666;">
          <p>© ${new Date().getFullYear()} AeroSuite. All rights reserved.</p>
        </div>
      </div>
    `
  };

  await transporter.sendMail(mailOptions);
};

/**
 * Send inspection reminder notification
 * @param {string} to - Recipient email
 * @param {string} inspectionNumber - Inspection number
 * @param {string} customerName - Customer name
 * @param {string} supplierName - Supplier name
 * @param {string} inspectionType - Type of inspection
 * @param {string} scheduledDate - Scheduled date of inspection
 * @param {string} inspectorName - Name of assigned inspector
 * @param {string} location - Location of the inspection
 */
exports.sendInspectionReminderNotification = async (to, inspectionNumber, customerName, supplierName, inspectionType, scheduledDate, inspectorName, location = 'On-site') => {
  const formattedDate = new Date(scheduledDate).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const mailOptions = {
    from: `AeroSuite <${process.env.EMAIL_USER}>`,
    to,
    subject: `REMINDER: Inspection Tomorrow - ${inspectionNumber}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #0a2f5c; padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">AeroSuite</h1>
        </div>
        <div style="padding: 20px; border: 1px solid #ddd; border-top: none;">
          <h2>Inspection Reminder</h2>
          <p>This is a friendly reminder that you have an inspection scheduled for tomorrow.</p>
          
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold;">Inspection Number:</td>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;">${inspectionNumber}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold;">Customer:</td>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;">${customerName}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold;">Supplier:</td>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;">${supplierName}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold;">Inspection Type:</td>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;">${inspectionType}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold;">Scheduled Date:</td>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;">${formattedDate}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold;">Inspector:</td>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;">${inspectorName}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold;">Location:</td>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;">${location}</td>
            </tr>
          </table>
          
          <div style="background-color: #fff3cd; border: 1px solid #ffeeba; color: #856404; padding: 15px; border-radius: 4px; margin: 20px 0;">
            <p style="margin: 0;"><strong>Important:</strong> Please ensure all necessary preparations are completed before the inspection.</p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.CLIENT_URL}/inspections/${inspectionNumber}" style="background-color: #0a2f5c; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">View Inspection Details</a>
          </div>
          
          <p>Thank you,<br/>The AeroSuite Team</p>
        </div>
        <div style="background-color: #f5f5f5; padding: 15px; text-align: center; font-size: 12px; color: #666;">
          <p>© ${new Date().getFullYear()} AeroSuite. All rights reserved.</p>
        </div>
      </div>
    `
  };

  await transporter.sendMail(mailOptions);
};

module.exports = exports; 
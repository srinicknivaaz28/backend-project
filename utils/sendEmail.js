const nodemailer = require('nodemailer');

// Email templates
const emailTemplates = {
  verification: (verificationUrl, userName) => ({
    subject: 'Verify Your Email Address',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Email Verification</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; }
            .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #666; border-radius: 0 0 8px 8px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Welcome ${userName ? ', ' + userName : ''}!</h1>
              <p>Please verify your email address</p>
            </div>
            <div class="content">
              <p>Thank you for registering with our platform. To complete your registration and secure your account, please verify your email address by clicking the button below:</p>
              
              <div style="text-align: center;">
                <a href="${verificationUrl}" class="button">Verify Email Address</a>
              </div>
              
              <p>If the button doesn't work, you can also copy and paste this link into your browser:</p>
              <p style="word-break: break-all; color: #667eea;">${verificationUrl}</p>
              
              <p><strong>Important:</strong> This link will expire in 24 hours for security reasons.</p>
              
              <p>If you didn't create an account with us, please ignore this email.</p>
            </div>
            <div class="footer">
              <p>This is an automated message, please do not reply to this email.</p>
              <p>&copy; ${new Date().getFullYear()} Your Company Name. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `
      Welcome ${userName ? userName : ''}!
      
      Please verify your email address by visiting this link:
      ${verificationUrl}
      
      This link will expire in 24 hours.
      
      If you didn't create an account with us, please ignore this email.
    `
  }),

  passwordReset: (resetUrl, userName) => ({
    subject: 'Reset Your Password',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Password Reset</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; }
            .button { display: inline-block; padding: 12px 30px; background: #ff6b6b; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #666; border-radius: 0 0 8px 8px; }
            .warning { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 4px; margin: 15px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Password Reset Request</h1>
              <p>Reset your account password</p>
            </div>
            <div class="content">
              <p>Hello ${userName ? userName : ''},</p>
              
              <p>We received a request to reset the password for your account. If you made this request, click the button below to reset your password:</p>
              
              <div style="text-align: center;">
                <a href="${resetUrl}" class="button">Reset Password</a>
              </div>
              
              <p>If the button doesn't work, you can also copy and paste this link into your browser:</p>
              <p style="word-break: break-all; color: #ff6b6b;">${resetUrl}</p>
              
              <div class="warning">
                <p><strong>⚠️ Security Notice:</strong></p>
                <ul>
                  <li>This link will expire in 1 hour for security reasons</li>
                  <li>If you didn't request this password reset, please ignore this email</li>
                  <li>Your password will remain unchanged until you create a new one</li>
                </ul>
              </div>
              
              <p>If you continue to have problems, please contact our support team.</p>
            </div>
            <div class="footer">
              <p>This is an automated message, please do not reply to this email.</p>
              <p>&copy; ${new Date().getFullYear()} Your Company Name. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `
      Password Reset Request
      
      Hello ${userName ? userName : ''},
      
      We received a request to reset your password. Click this link to reset it:
      ${resetUrl}
      
      This link will expire in 1 hour.
      
      If you didn't request this reset, please ignore this email.
    `
  }),

  welcome: (userName) => ({
    subject: 'Welcome to Our Platform!',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Welcome</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #4ecdc4 0%, #44a08d 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; }
            .button { display: inline-block; padding: 12px 30px; background: #4ecdc4; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #666; border-radius: 0 0 8px 8px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 Welcome ${userName}!</h1>
              <p>Your account has been successfully verified</p>
            </div>
            <div class="content">
              <p>Congratulations! Your email has been verified and your account is now active.</p>
              
              <p>You can now:</p>
              <ul>
                <li>Browse and enroll in courses</li>
                <li>Track your learning progress</li>
                <li>Earn certificates</li>
                <li>Access exclusive content</li>
              </ul>
              
              <div style="text-align: center;">
                <a href="${process.env.CLIENT_URL}/dashboard" class="button">Go to Dashboard</a>
              </div>
              
              <p>If you have any questions, our support team is here to help!</p>
            </div>
            <div class="footer">
              <p>Happy learning!</p>
              <p>&copy; ${new Date().getFullYear()} Your Company Name. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `
      Welcome ${userName}!
      
      Your account has been successfully verified and is now active.
      
      Visit your dashboard: ${process.env.CLIENT_URL}/dashboard
      
      Happy learning!
    `
  })
};

// Create transporter based on environment
const createTransporter = () => {
  // For production - use actual email service
  if (process.env.NODE_ENV === 'production') {
    // Gmail configuration
    if (process.env.EMAIL_SERVICE === 'gmail') {
      return nodemailer.createTransporter({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_FROM,
          pass: process.env.EMAIL_PASSWORD // App password for Gmail
        }
      });
    }
    
    // SendGrid configuration
    if (process.env.EMAIL_SERVICE === 'sendgrid') {
      return nodemailer.createTransporter({
        host: 'smtp.sendgrid.net',
        port: 587,
        secure: false,
        auth: {
          user: 'apikey',
          pass: process.env.SENDGRID_API_KEY
        }
      });
    }
    
    // Mailgun configuration
    if (process.env.EMAIL_SERVICE === 'mailgun') {
      return nodemailer.createTransporter({
        host: 'smtp.mailgun.org',
        port: 587,
        secure: false,
        auth: {
          user: process.env.MAILGUN_USERNAME,
          pass: process.env.MAILGUN_PASSWORD
        }
      });
    }
    
    // Generic SMTP configuration
    return nodemailer.createTransporter({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  }
  
  // For development - use Ethereal (fake SMTP)
  return nodemailer.createTransporter({
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false,
    auth: {
      user: process.env.ETHEREAL_USER || 'ethereal.user@ethereal.email',
      pass: process.env.ETHEREAL_PASS || 'ethereal.pass'
    }
  });
};

// Main send email function
const sendEmail = async (options) => {
  try {
    const transporter = createTransporter();
    
    // Verify connection (optional, for debugging)
    if (process.env.NODE_ENV === 'development') {
      await transporter.verify();
      console.log('Email server connection verified');
    }
    
    let emailContent = {};
    
    // Use template if specified
    if (options.template) {
      switch (options.template) {
        case 'verification':
          emailContent = emailTemplates.verification(options.verificationUrl, options.userName);
          break;
        case 'passwordReset':
          emailContent = emailTemplates.passwordReset(options.resetUrl, options.userName);
          break;
        case 'welcome':
          emailContent = emailTemplates.welcome(options.userName);
          break;
        default:
          throw new Error(`Unknown email template: ${options.template}`);
      }
    } else {
      // Use custom content
      emailContent = {
        subject: options.subject,
        html: options.html || `<p>${options.message}</p>`,
        text: options.text || options.message
      };
    }
    
    const mailOptions = {
      from: `${process.env.EMAIL_FROM_NAME || 'Your App'} <${process.env.EMAIL_FROM}>`,
      to: options.email,
      subject: emailContent.subject,
      text: emailContent.text,
      html: emailContent.html,
      // Optional: add attachments
      ...(options.attachments && { attachments: options.attachments }),
      // Optional: add reply-to
      ...(options.replyTo && { replyTo: options.replyTo })
    };
    
    const info = await transporter.sendMail(mailOptions);
    
    // Log success (in development)
    if (process.env.NODE_ENV === 'development') {
      console.log('Email sent successfully:', info.messageId);
      console.log('Preview URL:', nodemailer.getTestMessageUrl(info));
    }
    
    return {
      success: true,
      messageId: info.messageId,
      previewUrl: process.env.NODE_ENV === 'development' ? nodemailer.getTestMessageUrl(info) : null
    };
    
  } catch (error) {
    console.error('Email sending failed:', error);
    throw new Error(`Failed to send email: ${error.message}`);
  }
};

// Utility function to send verification email
const sendVerificationEmail = async (email, verificationToken, userName) => {
  const verificationUrl = `${process.env.CLIENT_URL}/verify-email/${verificationToken}`;
  
  return await sendEmail({
    email,
    template: 'verification',
    verificationUrl,
    userName
  });
};

// Utility function to send password reset email
const sendPasswordResetEmail = async (email, resetToken, userName) => {
  const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;
  
  return await sendEmail({
    email,
    template: 'passwordReset',
    resetUrl,
    userName
  });
};

// Utility function to send welcome email
const sendWelcomeEmail = async (email, userName) => {
  return await sendEmail({
    email,
    template: 'welcome',
    userName
  });
};

module.exports = {
  sendEmail,
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendWelcomeEmail
};
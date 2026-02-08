import express from 'express';
import AWS from 'aws-sdk';
import rateLimit from 'express-rate-limit';

const router = express.Router();

// Configure AWS SES
const ses = new AWS.SES({
  region: process.env.AWS_REGION || 'us-east-1',
  apiVersion: '2010-12-01'
});

// Rate limiting: 3 submissions per 15 minutes per IP
const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 3, // Limit each IP to 3 requests per windowMs
  message: {
    error: 'Too many contact form submissions. Please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Spam detection helpers
const spamKeywords = [
  'viagra', 'cialis', 'lottery', 'winner', 'casino', 'crypto',
  'bitcoin', 'investment opportunity', 'nigerian prince', 'click here',
  'buy now', 'limited time', 'act now', 'congratulations'
];

function containsSpam(text) {
  const lowerText = text.toLowerCase();
  return spamKeywords.some(keyword => lowerText.includes(keyword));
}

function containsExcessiveLinks(text) {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const matches = text.match(urlRegex);
  return matches && matches.length > 2; // Allow max 2 URLs
}

function sanitizeInput(text) {
  // Remove HTML tags and limit length
  return text
    .replace(/<[^>]*>/g, '')
    .trim()
    .substring(0, 5000); // Max 5000 characters
}

// POST /api/contact - Send contact form email
router.post('/', contactLimiter, async (req, res) => {
  try {
    const { name, email, subject, message, honeypot } = req.body;

    // Honeypot check - if filled, it's a bot
    if (honeypot) {
      console.log('Honeypot triggered - likely bot submission');
      // Return success to not alert the bot
      return res.json({
        success: true,
        message: 'Message sent successfully'
      });
    }

    // Validation
    if (!name || !email || !subject || !message) {
      return res.status(400).json({
        error: 'All fields are required'
      });
    }

    // Length validation
    if (name.length > 100) {
      return res.status(400).json({
        error: 'Name is too long'
      });
    }

    if (subject.length > 200) {
      return res.status(400).json({
        error: 'Subject is too long'
      });
    }

    if (message.length < 10) {
      return res.status(400).json({
        error: 'Message is too short'
      });
    }

    if (message.length > 5000) {
      return res.status(400).json({
        error: 'Message is too long'
      });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        error: 'Invalid email address'
      });
    }

    // Sanitize inputs
    const sanitizedName = sanitizeInput(name);
    const sanitizedSubject = sanitizeInput(subject);
    const sanitizedMessage = sanitizeInput(message);

    // Spam detection
    if (containsSpam(sanitizedMessage) || containsSpam(sanitizedSubject)) {
      console.log('Spam keywords detected in submission');
      return res.status(400).json({
        error: 'Your message contains prohibited content'
      });
    }

    // Check for excessive links
    if (containsExcessiveLinks(sanitizedMessage)) {
      console.log('Excessive links detected in submission');
      return res.status(400).json({
        error: 'Your message contains too many links'
      });
    }

    // Get recipient email from environment variable
    const recipientEmail = process.env.CONTACT_EMAIL || 'louie@louie.cloud';

    // Create email parameters
    const params = {
      Source: recipientEmail, // Must be verified in SES
      Destination: {
        ToAddresses: [recipientEmail]
      },
      ReplyToAddresses: [email],
      Message: {
        Subject: {
          Data: `Portfolio Contact: ${sanitizedSubject}`,
          Charset: 'UTF-8'
        },
        Body: {
          Text: {
            Data: `
New contact form submission from your portfolio website:

Name: ${sanitizedName}
Email: ${email}
Subject: ${sanitizedSubject}

Message:
${sanitizedMessage}

---
This message was sent from the contact form on louie.cloud
IP: ${req.ip}
            `.trim(),
            Charset: 'UTF-8'
          },
          Html: {
            Data: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #000; color: #fff; padding: 20px; border-radius: 5px 5px 0 0; }
    .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 5px 5px; }
    .field { margin-bottom: 15px; }
    .label { font-weight: bold; color: #555; }
    .value { color: #333; margin-top: 5px; }
    .message-box { background: #fff; padding: 15px; border-left: 4px solid #000; margin-top: 10px; white-space: pre-wrap; }
    .footer { text-align: center; color: #888; font-size: 12px; margin-top: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>New Contact Form Submission</h2>
    </div>
    <div class="content">
      <div class="field">
        <div class="label">From:</div>
        <div class="value">${sanitizedName} &lt;${email}&gt;</div>
      </div>
      <div class="field">
        <div class="label">Subject:</div>
        <div class="value">${sanitizedSubject}</div>
      </div>
      <div class="field">
        <div class="label">Message:</div>
        <div class="message-box">${sanitizedMessage.replace(/\n/g, '<br>')}</div>
      </div>
      <div class="footer">
        This message was sent from the contact form on louie.cloud<br>
        IP: ${req.ip}
      </div>
    </div>
  </div>
</body>
</html>
            `.trim(),
            Charset: 'UTF-8'
          }
        }
      }
    };

    // Send email via SES
    await ses.sendEmail(params).promise();

    console.log(`Contact form submission from ${email} (${req.ip}) sent successfully`);

    res.json({
      success: true,
      message: 'Message sent successfully'
    });

  } catch (error) {
    console.error('Error sending contact form email:', error);

    // Handle specific SES errors
    if (error.code === 'MessageRejected') {
      return res.status(400).json({
        error: 'Email could not be sent. Please try again later.'
      });
    }

    if (error.code === 'InvalidParameterValue') {
      return res.status(400).json({
        error: 'Invalid email configuration. Please contact the site administrator.'
      });
    }

    if (error.code === 'Throttling') {
      return res.status(429).json({
        error: 'Too many requests. Please try again later.'
      });
    }

    res.status(500).json({
      error: 'Failed to send message. Please try again later.'
    });
  }
});

export default router;

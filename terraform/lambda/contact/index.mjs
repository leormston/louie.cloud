// Contact form handler for the static site.
// Runs behind CloudFront at POST /api/contact (Lambda function URL + OAC).
// Ported from the old Express backend's contact route. Uses the AWS SDK v3 bundled with the
// Lambda Node.js runtime, so there are no dependencies to package.
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';

const ses = new SESClient({ region: process.env.SES_REGION || process.env.AWS_REGION });
const CONTACT_EMAIL = process.env.CONTACT_EMAIL;

// Best-effort rate limit: 3 submissions per 15 minutes per IP, per warm
// Lambda instance. Reserved concurrency keeps the number of instances small.
const WINDOW_MS = 15 * 60 * 1000;
const MAX_PER_WINDOW = 3;
const recentByIp = new Map();

const SPAM_KEYWORDS = [
  'viagra', 'cialis', 'lottery', 'winner', 'casino', 'crypto',
  'bitcoin', 'investment opportunity', 'nigerian prince', 'click here',
  'buy now', 'limited time', 'act now', 'congratulations',
];

const json = (statusCode, body) => ({
  statusCode,
  headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
  body: JSON.stringify(body),
});

const containsSpam = (text) => {
  const lower = text.toLowerCase();
  return SPAM_KEYWORDS.some((k) => lower.includes(k));
};

const tooManyLinks = (text) => (text.match(/https?:\/\/[^\s]+/g) || []).length > 2;

const stripTags = (text) => text.replace(/<[^>]*>/g, '').trim().substring(0, 5000);

const escapeHtml = (text) => text
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;');

// CloudFront appends the viewer IP to X-Forwarded-For; the first entry is the client.
const clientIp = (event) => {
  const xff = event.headers?.['x-forwarded-for'];
  return (xff ? xff.split(',')[0].trim() : event.requestContext?.http?.sourceIp) || 'unknown';
};

const isRateLimited = (ip) => {
  const now = Date.now();
  const recent = (recentByIp.get(ip) || []).filter((t) => now - t < WINDOW_MS);
  if (recent.length >= MAX_PER_WINDOW) {
    recentByIp.set(ip, recent);
    return true;
  }
  recent.push(now);
  recentByIp.set(ip, recent);
  return false;
};

export const handler = async (event) => {
  const method = event.requestContext?.http?.method;
  const path = event.rawPath;

  // Note: avoid 403/404 here so responses are never confused with S3/OAC errors.
  if (path !== '/api/contact') return json(400, { error: 'Unknown endpoint' });
  if (method !== 'POST') return json(405, { error: 'Method not allowed' });

  let data;
  try {
    const raw = event.isBase64Encoded
      ? Buffer.from(event.body || '', 'base64').toString('utf8')
      : event.body || '';
    data = JSON.parse(raw);
  } catch {
    return json(400, { error: 'Invalid request body' });
  }

  const { name, email, subject, message, honeypot } = data || {};
  const ip = clientIp(event);

  // Honeypot filled in → almost certainly a bot. Pretend it worked.
  if (honeypot) {
    console.log('Honeypot triggered', { ip });
    return json(200, { success: true, message: 'Message sent successfully' });
  }

  if (![name, email, subject, message].every((v) => typeof v === 'string' && v.trim())) {
    return json(400, { error: 'All fields are required' });
  }
  if (name.length > 100) return json(400, { error: 'Name is too long' });
  if (subject.length > 200) return json(400, { error: 'Subject is too long' });
  if (message.length < 10) return json(400, { error: 'Message is too short' });
  if (message.length > 5000) return json(400, { error: 'Message is too long' });
  if (email.length > 254 || !/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(email)) {
    return json(400, { error: 'Invalid email address' });
  }

  const cleanName = stripTags(name);
  const cleanSubject = stripTags(subject);
  const cleanMessage = stripTags(message);

  if (containsSpam(cleanMessage) || containsSpam(cleanSubject)) {
    console.log('Spam keywords detected', { ip });
    return json(400, { error: 'Your message contains prohibited content' });
  }
  if (tooManyLinks(cleanMessage)) {
    console.log('Too many links', { ip });
    return json(400, { error: 'Your message contains too many links' });
  }

  if (isRateLimited(ip)) {
    return json(429, { error: 'Too many contact form submissions. Please try again later.' });
  }

  const text = [
    'New contact form submission from your portfolio website:',
    '',
    `Name: ${cleanName}`,
    `Email: ${email}`,
    `Subject: ${cleanSubject}`,
    '',
    'Message:',
    cleanMessage,
    '',
    '---',
    'This message was sent from the contact form on louie.cloud',
    `IP: ${ip}`,
  ].join('\n');

  const html = `<!DOCTYPE html>
<html><body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: #000; color: #fff; padding: 20px; border-radius: 5px 5px 0 0;">
      <h2 style="margin: 0;">New Contact Form Submission</h2>
    </div>
    <div style="background: #f9f9f9; padding: 20px; border-radius: 0 0 5px 5px;">
      <p><strong>From:</strong><br>${escapeHtml(cleanName)} &lt;${escapeHtml(email)}&gt;</p>
      <p><strong>Subject:</strong><br>${escapeHtml(cleanSubject)}</p>
      <p><strong>Message:</strong></p>
      <div style="background: #fff; padding: 15px; border-left: 4px solid #000; white-space: pre-wrap;">${escapeHtml(cleanMessage)}</div>
      <p style="text-align: center; color: #888; font-size: 12px; margin-top: 20px;">
        Sent from the contact form on louie.cloud<br>IP: ${escapeHtml(ip)}
      </p>
    </div>
  </div>
</body></html>`;

  try {
    await ses.send(new SendEmailCommand({
      Source: CONTACT_EMAIL, // must be a verified SES identity
      Destination: { ToAddresses: [CONTACT_EMAIL] },
      ReplyToAddresses: [email],
      Message: {
        Subject: { Data: `Portfolio Contact: ${cleanSubject}`, Charset: 'UTF-8' },
        Body: {
          Text: { Data: text, Charset: 'UTF-8' },
          Html: { Data: html, Charset: 'UTF-8' },
        },
      },
    }));
  } catch (error) {
    console.error('SES send failed', { ip, name: error.name, message: error.message });
    if (error.name === 'Throttling') {
      return json(429, { error: 'Too many requests. Please try again later.' });
    }
    return json(500, { error: 'Failed to send message. Please try again later.' });
  }

  console.log('Contact form sent', { ip });
  return json(200, { success: true, message: 'Message sent successfully' });
};

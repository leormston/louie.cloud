# Contact Form Spam Protection

## Overview
The contact form has multiple layers of spam protection to prevent abuse while maintaining a good user experience.

## Protection Layers

### 1. Rate Limiting ⏱️
**Location**: Backend (`backend/routes/contact.js`)

```javascript
// 3 submissions per 15 minutes per IP address
contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 3                      // 3 requests max
})
```

**What it does**:
- Limits each IP address to 3 submissions per 15 minutes
- Prevents rapid-fire spam attacks
- Returns 429 error after limit is exceeded

**Impact on legitimate users**: Minimal - most users only submit once

---

### 2. Honeypot Field 🍯
**Location**: Frontend + Backend

**Frontend** (`src/components/jsx/contact.jsx`):
```jsx
<input
  type="text"
  name="honeypot"
  style={{ display: 'none' }}
  tabIndex="-1"
  autoComplete="off"
/>
```

**Backend** (`backend/routes/contact.js`):
```javascript
if (honeypot) {
  // Return fake success to not alert bot
  return res.json({ success: true });
}
```

**What it does**:
- Hidden field invisible to humans
- Bots auto-fill all fields including this one
- If filled, request is silently discarded

**Impact on legitimate users**: None - field is completely hidden

---

### 3. Spam Keyword Detection 🚫
**Location**: Backend (`backend/routes/contact.js`)

```javascript
const spamKeywords = [
  'viagra', 'cialis', 'lottery', 'winner', 'casino',
  'crypto', 'bitcoin', 'investment opportunity',
  'nigerian prince', 'click here', 'buy now',
  'limited time', 'act now', 'congratulations'
];
```

**What it does**:
- Checks message and subject for common spam keywords
- Rejects messages containing prohibited words
- Returns 400 error with "prohibited content" message

**Impact on legitimate users**: Very low - legitimate business inquiries rarely use these terms

---

### 4. Link Spam Detection 🔗
**Location**: Backend (`backend/routes/contact.js`)

```javascript
function containsExcessiveLinks(text) {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const matches = text.match(urlRegex);
  return matches && matches.length > 2; // Max 2 URLs
}
```

**What it does**:
- Counts URLs in the message
- Rejects messages with more than 2 links
- Common spam tactic is to include many links

**Impact on legitimate users**: Very low - most inquiries don't need multiple links

---

### 5. Input Validation & Sanitization 🧹
**Location**: Backend (`backend/routes/contact.js`)

**Length Limits**:
- Name: max 100 characters
- Subject: max 200 characters
- Message: min 10 characters, max 5000 characters

**Sanitization**:
```javascript
function sanitizeInput(text) {
  return text
    .replace(/<[^>]*>/g, '')  // Remove HTML tags
    .trim()
    .substring(0, 5000);       // Enforce max length
}
```

**What it does**:
- Validates all input lengths
- Strips HTML tags to prevent XSS attacks
- Validates email format with regex
- Prevents injection attacks

**Impact on legitimate users**: None - reasonable limits for contact forms

---

### 6. IP Logging 📝
**Location**: Backend (`backend/routes/contact.js`)

```javascript
IP: ${req.ip}
```

**What it does**:
- Logs IP address with each submission
- Included in email notification to you
- Helps identify patterns if abuse occurs
- Can manually block IPs in Nginx if needed

**Impact on legitimate users**: None - transparent

---

## AWS SES Additional Protections

### 7. Email Verification ✅
- Only verified email addresses can send via SES
- Prevents unauthorized use of your SES account

### 8. SES Rate Limits 📊
**Sandbox Mode** (default):
- 1 email per second
- 200 emails per day

**Production Mode** (after request approval):
- Starts at 14 emails per second
- 50,000 emails per day
- Gradually increases based on usage

### 9. SES Cost Protection 💰
**Free Tier** (when sending from EC2):
- 62,000 emails per month free
- After that: $0.10 per 1,000 emails

**Even if spammed heavily**:
- 1,000 spam emails = $0.10 cost
- Rate limiting prevents this volume anyway

---

## Manual Protection Options

### Block Specific IPs in Nginx
If a specific IP is causing problems:

```bash
# SSH to EC2
ssh -i your-key.pem ubuntu@your-ec2-ip

# Edit Nginx config
sudo nano /etc/nginx/sites-available/louie.cloud

# Add to server block:
deny 123.456.789.0;  # Replace with spam IP

# Reload Nginx
sudo systemctl reload nginx
```

### Adjust Rate Limits
Edit `backend/routes/contact.js`:

```javascript
// Make stricter
max: 2,                    // Only 2 per window
windowMs: 60 * 60 * 1000  // 1 hour window

// Or more lenient
max: 5,                    // 5 per window
windowMs: 10 * 60 * 1000  // 10 minutes
```

### Add More Spam Keywords
Edit `backend/routes/contact.js`:

```javascript
const spamKeywords = [
  // Add your own keywords here
  'forex', 'pills', 'weight loss', etc.
];
```

---

## Monitoring for Spam

### Check Backend Logs
```bash
# SSH to EC2
ssh -i your-key.pem ubuntu@your-ec2-ip

# View PM2 logs
pm2 logs portfolio-api

# Look for:
# - "Honeypot triggered"
# - "Spam keywords detected"
# - "Excessive links detected"
# - Rate limit errors
```

### Check Email Volume
- Monitor your inbox for unusual volume
- Check AWS SES dashboard for sending statistics
- Set up CloudWatch alerts for high email counts

---

## User Experience Impact

✅ **Good for legitimate users**:
- No visible CAPTCHA to solve
- Fast submission (no delays)
- Clear error messages
- 3 attempts per 15 minutes is plenty

❌ **Bad for spammers**:
- Honeypot catches bots
- Rate limiting prevents mass spam
- Keyword detection blocks common spam
- Link detection blocks link farms
- IP logging allows manual blocking

---

## Future Enhancements (Optional)

### 1. Google reCAPTCHA v3
- Invisible to users
- Scores requests 0-1 (bot to human)
- Costs: Free for up to 1M assessments/month

### 2. Email Verification
- Send confirmation email before actual submission
- Verify sender's email is real
- Extra friction but very effective

### 3. Cloudflare Protection
- Put site behind Cloudflare
- Bot detection and mitigation
- DDoS protection
- Free tier available

### 4. More Advanced AI Filtering
- Use AWS Comprehend for sentiment analysis
- Detect spam patterns with ML
- Overkill for a portfolio site

---

## Testing Spam Protection

### Test Rate Limiting:
```bash
# Send 4 requests quickly
for i in {1..4}; do
  curl -X POST https://louie.cloud/api/contact \
    -H "Content-Type: application/json" \
    -d '{"name":"Test","email":"test@example.com","subject":"Test","message":"Test message"}'
done

# 4th request should return 429 error
```

### Test Honeypot:
```bash
curl -X POST https://louie.cloud/api/contact \
  -H "Content-Type: application/json" \
  -d '{"name":"Bot","email":"bot@spam.com","subject":"Spam","message":"Spam message","honeypot":"I am a bot"}'

# Should return 200 but not send email
```

### Test Spam Keywords:
```bash
curl -X POST https://louie.cloud/api/contact \
  -H "Content-Type: application/json" \
  -d '{"name":"Spammer","email":"spam@example.com","subject":"Winner!","message":"You won the lottery! Click here to claim your bitcoin prize!"}'

# Should return 400 "prohibited content"
```

---

## Summary

Your contact form is well-protected against:
- ✅ Automated bots (honeypot)
- ✅ Rapid spam attacks (rate limiting)
- ✅ Common spam content (keyword detection)
- ✅ Link spam (link detection)
- ✅ XSS attacks (input sanitization)
- ✅ Cost abuse (rate limiting + SES limits)

The protections are **balanced** - strong enough to stop spam but not so strict that legitimate users are affected.

# AWS SES Setup for Contact Form

## Overview
The contact form uses AWS Simple Email Service (SES) to send emails. You need to verify your email address in SES before it can send emails.

## Step 1: Verify Your Email Address

1. Go to AWS Console → Simple Email Service (SES)
2. Click "Verified identities" in the left sidebar
3. Click "Create identity"
4. Select "Email address"
5. Enter your email: `louie@louie.cloud`
6. Click "Create identity"
7. Check your inbox for verification email from AWS
8. Click the verification link in the email

## Step 2: Check SES Sandbox Status

By default, SES accounts are in "sandbox mode" which restricts:
- You can only send TO verified email addresses
- You can only send FROM verified email addresses
- Limited to 200 emails per day

### For Testing (Sandbox Mode - Default)
This is fine if you're just testing. The contact form will send emails to your verified email address.

### For Production (Request Production Access)
If you want anyone to be able to use your contact form:

1. Go to AWS Console → SES
2. Click "Account dashboard" in the left sidebar
3. Click "Request production access"
4. Fill out the form:
   - **Mail Type**: Transactional
   - **Website URL**: https://louie.cloud
   - **Use Case Description**:
     ```
     Contact form for my portfolio website. Visitors will send me messages
     through a contact form, which will be delivered to my email address.
     Expected volume: < 100 emails per month.
     ```
5. Submit the request
6. AWS typically approves within 24 hours

## Step 3: Update Backend Environment Variables

SSH to your EC2 instance and update the backend `.env` file:

```bash
ssh -i your-key.pem ubuntu@your-ec2-ip
sudo nano /var/www/portfolio/backend/.env
```

Add/update:
```bash
AWS_REGION=us-east-1
CONTACT_EMAIL=louie@louie.cloud
```

Restart the backend:
```bash
pm2 restart portfolio-api
```

## Step 4: Test the Contact Form

1. Visit https://louie.cloud/#contact
2. Fill out the contact form
3. Submit
4. Check your email inbox for the message

## Troubleshooting

### Email Not Received
- Check your spam folder
- Verify your email is verified in SES
- Check CloudWatch logs for errors
- Check backend logs: `pm2 logs portfolio-api`

### "Email not verified" Error
- Verify your email address in SES (Step 1)
- Make sure `CONTACT_EMAIL` in `.env` matches the verified email

### Rate Limiting
- In sandbox mode, you're limited to 1 email per second
- Request production access to increase limits

## Cost
- **Free Tier**: 62,000 emails/month (when sending from EC2)
- After free tier: $0.10 per 1,000 emails
- For a portfolio contact form, you'll likely stay within free tier

## Security Notes
- EC2 instance IAM role needs `ses:SendEmail` permission (already configured in Terraform)
- Emails are sent FROM your verified email address
- Reply-To is set to the sender's email from the form
- Input is validated and sanitized on the backend

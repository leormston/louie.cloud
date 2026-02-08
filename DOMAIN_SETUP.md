# Domain Setup Guide for louie.cloud

This guide will help you configure your domain `louie.cloud` to point to your EC2 instance and set up HTTPS with SSL.

## Prerequisites

- EC2 instance is running and deployed
- You have access to your domain registrar/DNS provider
- SSH access to your EC2 instance

## Step 1: Configure DNS

### Add A Records

Log into your domain registrar or DNS provider (e.g., Namecheap, GoDaddy, Cloudflare, Route53) and add these DNS records:

| Type | Name | Value | TTL |
|------|------|-------|-----|
| A | @ | `<your-ec2-public-ip>` | 300 |
| A | www | `<your-ec2-public-ip>` | 300 |

**Example with your EC2 IP (replace with actual IP):**
```
A    @    54.123.45.67    300
A    www  54.123.45.67    300
```

### Wait for DNS Propagation

DNS changes can take 5 minutes to 48 hours to propagate. Check with:

```bash
# Check if domain resolves to your IP
dig louie.cloud +short
dig www.louie.cloud +short

# Or use nslookup
nslookup louie.cloud
```

## Step 2: Deploy Updated Nginx Configuration

### Option A: Automated (Recommended)

The updated Nginx configuration will be deployed automatically on your next push to main. Just make sure to update your GitHub secrets:

```
VITE_API_URL = https://louie.cloud/api
```

Then push to trigger deployment:
```bash
git add .
git commit -m "Update domain configuration"
git push origin main
```

### Option B: Manual Setup

SSH into your EC2 instance:

```bash
ssh -i your-key.pem ubuntu@<your-ec2-ip>
```

#### 1. Create Nginx Configuration

```bash
# Remove default configuration
sudo rm /etc/nginx/sites-enabled/default

# Create new configuration
sudo nano /etc/nginx/sites-available/louie.cloud
```

Paste this configuration:

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name louie.cloud www.louie.cloud;

    root /var/www/portfolio/frontend;
    index index.html;

    location /api/ {
        proxy_pass http://localhost:3000/api/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /health {
        proxy_pass http://localhost:3000/health;
        access_log off;
    }

    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    location / {
        try_files $uri $uri/ /index.html;
    }

    access_log /var/log/nginx/louie.cloud_access.log;
    error_log /var/log/nginx/louie.cloud_error.log;
}
```

#### 2. Enable the Site

```bash
# Create symbolic link
sudo ln -s /etc/nginx/sites-available/louie.cloud /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

## Step 3: Install SSL Certificate (HTTPS)

### Install Certbot

```bash
# Update package list
sudo apt update

# Install Certbot for Nginx
sudo apt install -y certbot python3-certbot-nginx
```

### Obtain SSL Certificate

```bash
# Get certificate for both domains
sudo certbot --nginx -d louie.cloud -d www.louie.cloud
```

You'll be prompted for:
1. **Email address** - for renewal notifications
2. **Terms of Service** - agree by pressing `Y`
3. **Share email with EFF** - optional, press `N`
4. **Redirect HTTP to HTTPS** - press `2` for yes (recommended)

Certbot will:
- Obtain the certificate
- Automatically configure Nginx for HTTPS
- Set up HTTP → HTTPS redirect
- Configure auto-renewal

### Verify SSL is Working

```bash
# Check certificate
sudo certbot certificates

# Test your site
curl -I https://louie.cloud
```

Visit `https://louie.cloud` in your browser - you should see a secure padlock icon.

## Step 4: Configure Auto-Renewal

Certbot installs a systemd timer for auto-renewal. Verify it's active:

```bash
# Check renewal timer
sudo systemctl status certbot.timer

# Test renewal (dry run)
sudo certbot renew --dry-run
```

If successful, your certificates will auto-renew before they expire.

## Step 5: Update GitHub Secrets

Update your GitHub repository secrets (Settings → Secrets and variables → Actions):

```
VITE_API_URL = https://louie.cloud/api
```

Then redeploy:

```bash
git add .
git commit -m "Update API URL to use domain"
git push origin main
```

## Step 6: Update Backend Environment

SSH to your EC2 instance and update the backend environment:

```bash
sudo nano /var/www/portfolio/backend/.env
```

Update `ALLOWED_ORIGINS`:

```bash
ALLOWED_ORIGINS=https://louie.cloud,https://www.louie.cloud,http://localhost:5173
```

Restart backend:

```bash
pm2 restart portfolio-api
```

## Verification Checklist

- [ ] DNS records point to EC2 IP (`dig louie.cloud +short`)
- [ ] HTTP works: `http://louie.cloud`
- [ ] HTTPS works: `https://louie.cloud`
- [ ] HTTP redirects to HTTPS
- [ ] API endpoints work: `https://louie.cloud/api/health`
- [ ] SSL certificate is valid (check browser padlock)
- [ ] Both `louie.cloud` and `www.louie.cloud` work

## Troubleshooting

### DNS Not Resolving

**Problem:** `dig louie.cloud` doesn't return your EC2 IP

**Solution:**
- Wait for DNS propagation (can take up to 48 hours)
- Verify A records are correct in your DNS provider
- Check your domain isn't expired
- Try flushing local DNS cache: `sudo systemd-resolve --flush-caches`

### SSL Certificate Failed

**Problem:** Certbot fails to obtain certificate

**Solution:**
- Ensure DNS is fully propagated first
- Check ports 80 and 443 are open in EC2 security group
- Temporarily stop Nginx: `sudo systemctl stop nginx`
- Run certbot in standalone mode: `sudo certbot certonly --standalone -d louie.cloud -d www.louie.cloud`
- Start Nginx: `sudo systemctl start nginx`

### 502 Bad Gateway

**Problem:** Nginx shows 502 error

**Solution:**
- Check backend is running: `pm2 status`
- View backend logs: `pm2 logs portfolio-api`
- Restart backend: `pm2 restart portfolio-api`

### CORS Errors

**Problem:** Browser shows CORS errors

**Solution:**
- Update backend `.env` with correct `ALLOWED_ORIGINS`
- Restart backend: `pm2 restart portfolio-api`

## Nginx Configuration with SSL (After Certbot)

After running Certbot, your Nginx config will look like this:

```nginx
# HTTP - redirect to HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name louie.cloud www.louie.cloud;

    location / {
        return 301 https://$host$request_uri;
    }
}

# HTTPS
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name louie.cloud www.louie.cloud;

    # SSL managed by Certbot
    ssl_certificate /etc/letsencrypt/live/louie.cloud/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/louie.cloud/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    # Your application configuration...
    root /var/www/portfolio/frontend;
    # ... rest of config
}
```

## Maintenance

### Renew Certificate Manually

Certificates auto-renew, but you can manually renew:

```bash
sudo certbot renew
sudo systemctl reload nginx
```

### Check Certificate Expiry

```bash
sudo certbot certificates
```

### View Nginx Logs

```bash
# Access logs
sudo tail -f /var/log/nginx/louie.cloud_access.log

# Error logs
sudo tail -f /var/log/nginx/louie.cloud_error.log
```

## Next Steps

After your domain is set up:

1. **Update Cognito redirect URLs** in AWS Console:
   - Add `https://louie.cloud/callback`
   - Add `https://louie.cloud/` as logout URL

2. **Test authentication flow** to ensure Cognito works with your domain

3. **Set up monitoring** (optional):
   - CloudWatch alarms
   - Uptime monitoring (UptimeRobot, Pingdom)

4. **Configure CDN** (optional):
   - CloudFront for faster global delivery
   - Caching for static assets

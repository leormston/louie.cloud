#!/bin/bash
set -e

# Update system
apt-get update
apt-get upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
apt-get install -y nodejs

# Install Nginx
apt-get install -y nginx

# Install PM2 globally
npm install -g pm2

# Install certbot for SSL
apt-get install -y certbot python3-certbot-nginx

# Create application directories
mkdir -p /var/www/portfolio/frontend
mkdir -p /var/www/portfolio/backend

# Set permissions
chown -R www-data:www-data /var/www/portfolio

# Enable Nginx
systemctl enable nginx
systemctl start nginx

# Create Nginx configuration with API proxy
cat > /etc/nginx/sites-available/portfolio << 'NGINX'
server {
    listen 80 default_server;
    listen [::]:80 default_server;

    root /var/www/portfolio/frontend;
    index index.html index.htm;

    server_name _;

    # API reverse proxy to backend
    location /api/ {
        proxy_pass http://localhost:3000/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Frontend - serve React app
    location / {
        try_files $uri /index.html;
    }
}
NGINX

# Enable the site
ln -sf /etc/nginx/sites-available/portfolio /etc/nginx/sites-enabled/portfolio
rm -f /etc/nginx/sites-enabled/default

# Test and reload Nginx
nginx -t
systemctl reload nginx

# CloudWatch Logs Agent (optional)
# wget https://s3.amazonaws.com/amazoncloudwatch-agent/ubuntu/amd64/latest/amazon-cloudwatch-agent.deb
# dpkg -i -E ./amazon-cloudwatch-agent.deb

echo "Server setup complete!"

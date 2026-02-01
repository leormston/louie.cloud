# GitHub Actions Deployment Guide

## Overview

This repository contains GitHub Actions workflows for automated infrastructure setup and application deployment to AWS EC2.

## Workflows

### 1. Deploy Infrastructure (`infrastructure.yml`)

**Trigger:** Manual trigger via `workflow_dispatch`

**Actions:**
- Plan: Preview infrastructure changes
- Apply: Create infrastructure (EC2, DynamoDB, security groups, IAM)
- Destroy: Remove all infrastructure

**Steps:**
1. Checkout code
2. Initialize Terraform
3. Plan changes
4. (Optional) Apply changes
5. Output infrastructure details

**Usage:**
1. Go to Actions → Deploy Infrastructure
2. Click "Run workflow"
3. Select action (plan/apply/destroy)
4. Click "Run workflow"

**First Time Setup:**
```
Actions → Deploy Infrastructure → Run workflow
Select: "apply"
```

Wait for completion, then copy outputs and add as GitHub secrets.

### 2. Deploy to EC2 (`deploy.yml`)

**Trigger:** 
- Automatic on push to `main` branch
- Manual trigger via `workflow_dispatch`

**Steps:**
1. **Build Phase**
   - Checkout code
   - Setup Node.js 18.x
   - Install and lint frontend dependencies
   - Build React frontend with environment variables
   - Install backend dependencies
   - Upload artifacts

2. **Deploy Phase** (depends on build success)
   - Download build artifacts
   - Configure SSH
   - Test SSH connectivity
   - Deploy frontend via rsync
   - Deploy backend via rsync
   - Install backend dependencies on EC2
   - Restart PM2 process
   - Perform health checks
   - Reload Nginx

## Required Secrets

### Infrastructure Deployment Secrets

For the `infrastructure.yml` workflow:

- `AWS_ACCESS_KEY_ID` - AWS access key
- `AWS_SECRET_ACCESS_KEY` - AWS secret key
- `EC2_KEY_PAIR_NAME` - Name of your EC2 key pair (e.g., `portfolio-key`)

### Application Deployment Secrets
- `AWS_ACCESS_KEY_ID` - From Terraform output
- `AWS_SECRET_ACCESS_KEY` - From Terraform output

### EC2 Connection
- `EC2_HOST` - Public IP or domain (from Terraform output)
- `EC2_USER` - SSH user (default: `ubuntu`)
- `EC2_SSH_PRIVATE_KEY` - Content of your EC2 key pair PEM file

### Application Configuration
- `VITE_COGNITO_REGION` - AWS region (e.g., `us-east-1`)
- `VITE_COGNITO_USER_POOL_ID` - Cognito User Pool ID
- `VITE_COGNITO_CLIENT_ID` - Cognito Client ID
- `VITE_API_URL` - Backend API URL (e.g., `https://yourdomain.com/api`)

## Complete Setup Process

### 1. Create EC2 Key Pair

```bash
aws ec2 create-key-pair --key-name portfolio-key --region us-east-1 \
  --query 'KeyMaterial' --output text > ~/portfolio-key.pem
chmod 600 ~/portfolio-key.pem
```

### 2. Create AWS IAM User for GitHub Actions

```bash
aws iam create-user --user-name github-actions-portfolio
aws iam create-access-key --user-name github-actions-portfolio
```

Save the Access Key ID and Secret Access Key.

### 3. Add GitHub Secrets

Go to GitHub repo → Settings → Secrets and variables → Actions

Add these secrets:

**Infrastructure Secrets (for setup):**
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `EC2_KEY_PAIR_NAME` - value: `portfolio-key`

### 4. Deploy Infrastructure via GitHub Actions

1. Go to Actions tab
2. Select "Deploy Infrastructure"
3. Click "Run workflow"
4. Select action: **apply**
5. Click "Run workflow"
6. Wait for completion
7. Copy the outputs from the workflow summary

### 5. Add Application Deployment Secrets

After infrastructure is created, add these secrets:

- `EC2_HOST` - Public IP from workflow outputs
- `EC2_USER` - `ubuntu`
- `EC2_SSH_PRIVATE_KEY` - Content of `portfolio-key.pem` file
- `VITE_COGNITO_REGION` - `us-east-1`
- `VITE_COGNITO_USER_POOL_ID` - Your Cognito pool ID
- `VITE_COGNITO_CLIENT_ID` - Your Cognito client ID
- `VITE_API_URL` - `http://<EC2_IP>/api`

### 6. Deploy Application

Push to main branch:
```bash
git add .
git commit -m "Initial deployment setup"
git push origin main
```

Monitor the workflow in Actions tab.

## Troubleshooting

### SSH Connection Failed
- Verify `EC2_HOST` is correct
- Check EC2 instance is running
- Verify security group allows port 22
- Ensure `EC2_SSH_PRIVATE_KEY` is the complete PEM file

### Build Failed
- Check frontend environment variables are set
- Verify Node.js dependencies are compatible
- Check for linting errors

### Deployment Failed
- SSH to instance and check logs:
  ```bash
  ssh -i portfolio-key.pem ubuntu@<instance-ip>
  pm2 logs
  sudo journalctl -u nginx -n 50
  ```
- Verify paths exist: `/var/www/portfolio/frontend` and `/var/www/portfolio/backend`

### Health Check Failed
- Ensure backend health endpoint exists at `/health`
- Check backend is listening on port 3000
- Verify Nginx is configured correctly

## Monitoring Deployments

### View Workflow Runs
- Go to Actions tab in GitHub
- Click on "Deploy to EC2" workflow
- View job logs for detailed output

### Check EC2 Application Status

```bash
ssh -i portfolio-key.pem ubuntu@<instance-ip>

# Check PM2
pm2 status
pm2 logs portfolio-api

# Check Nginx
sudo systemctl status nginx
sudo tail -f /var/log/nginx/access.log

# Check application
curl http://localhost:3000/health
```

## Manual Deployment

If needed, you can deploy manually:

```bash
# SSH to instance
ssh -i portfolio-key.pem ubuntu@<instance-ip>

# Update frontend
rsync -avz dist/ ubuntu@<instance-ip>:/var/www/portfolio/frontend/

# Update backend
rsync -avz --exclude 'node_modules' backend/ ubuntu@<instance-ip>:/var/www/portfolio/backend/

# On EC2 instance
cd /var/www/portfolio/backend
npm ci --production
pm2 restart portfolio-api
sudo systemctl reload nginx
```

## Best Practices

1. **Always test locally** before pushing to main
2. **Use feature branches** for development
3. **Monitor deployments** in GitHub Actions
4. **Keep SSH key secure** - never commit to repository
5. **Rotate access keys** periodically
6. **Monitor logs** for errors
7. **Set up alerts** for failed deployments

## Advanced Configuration

### Custom Domain with SSL

Update Nginx on EC2:
```bash
sudo certbot certonly --nginx -d yourdomain.com
```

Then update `/etc/nginx/sites-available/portfolio` with SSL config.

### Environment-Specific Deployments

Create separate workflows for staging/production:
```yaml
on:
  push:
    branches:
      - main          # Production
      - develop       # Staging
```

### Notifications

Add Slack or email notifications to workflow for deployment status.

# AWS EC2 Deployment Setup Guide

Complete guide to deploy your portfolio to AWS EC2 using Terraform and GitHub Actions.

## 📋 Prerequisites

- AWS Account with credentials configured locally
- Terraform installed (v1.0+)
- Git and GitHub account
- Node.js 18+ installed locally
- SSH client

## 🚀 Quick Start

### Step 1: Create EC2 Key Pair

```bash
# In AWS Console or via CLI
aws ec2 create-key-pair --key-name portfolio-key --region eu-west-2 \
  --query 'KeyMaterial' --output text > ~/portfolio-key.pem
chmod 600 ~/portfolio-key.pem
```

Store this file securely - you'll need it for SSH access.

### Step 2: Configure Terraform

```bash
cd terraform

# Copy and edit variables
cp terraform.tfvars.example terraform.tfvars
nano terraform.tfvars
```

Update these values in `terraform.tfvars`:
```hcl
key_pair_name = "portfolio-key"
aws_region    = "us-east-1"
instance_type = "t3.micro"  # Free tier
```

### Step 3: Deploy Infrastructure

```bash
# Initialize Terraform
terraform init

# Review plan
terraform plan -out=tfplan

# Deploy
terraform apply tfplan
```

Save the outputs - you'll need them for GitHub secrets:
```bash
terraform output instance_details
terraform output github_actions_access_key_id
terraform output github_actions_secret_access_key
```

### Step 4: Configure GitHub Secrets

In your GitHub repository:
1. Go to Settings → Secrets and variables → Actions
2. Add these secrets:

**AWS Credentials:**
- `AWS_ACCESS_KEY_ID` - From terraform output
- `AWS_SECRET_ACCESS_KEY` - From terraform output

**EC2 Connection:**
- `EC2_HOST` - Public IP from terraform output
- `EC2_USER` - `ubuntu`
- `EC2_SSH_PRIVATE_KEY` - Full content of `portfolio-key.pem`

**Application:**
- `VITE_COGNITO_REGION` - e.g., `us-east-1`
- `VITE_COGNITO_USER_POOL_ID` - From AWS Cognito
- `VITE_COGNITO_CLIENT_ID` - From AWS Cognito
- `VITE_API_URL` - e.g., `https://yourdomain.com/api`

### Step 5: Deploy

Push to main branch:
```bash
git add .
git commit -m "Add infrastructure and deployment"
git push origin main
```

Monitor in GitHub Actions → Deploy to EC2 workflow.

## 📁 Project Structure

```
.
├── terraform/                    # Infrastructure as Code
│   ├── main.tf                  # Provider config
│   ├── variables.tf             # Input variables
│   ├── ec2.tf                   # EC2 instance & security
│   ├── iam.tf                   # IAM roles & permissions
│   ├── outputs.tf               # Output values
│   ├── user_data.sh             # Server initialization
│   ├── terraform.tfvars.example # Variable template
│   └── README.md                # Terraform guide
│
├── backend/                      # Express.js API
│   ├── server.js                # Main server
│   ├── package.json             # Dependencies
│   ├── middleware/
│   ├── routes/                  # API routes
│   ├── models/                  # DynamoDB models
│   └── utils/                   # Helpers
│
├── src/                          # React frontend
│
├── .github/
│   └── workflows/
│       ├── deploy.yml           # Main deployment workflow
│       └── README.md            # Workflow guide
│
└── vite.config.js               # Frontend config
```

## 🔧 Infrastructure Details

### EC2 Instance
- **Type**: t3.micro (Free tier eligible)
- **OS**: Ubuntu 22.04 LTS
- **Storage**: 30GB encrypted gp3 volume
- **Network**: Public IP + Elastic IP

### Security Group
Allows:
- SSH (22) - for deployments
- HTTP (80) - for web traffic
- HTTPS (443) - for secure traffic
- Application port (3000) - Node.js backend

### IAM Roles
- **EC2 Role**: Access to Cognito, DynamoDB, CloudWatch
- **GitHub Role**: EC2 management, deployments

### Automatic Setup
The `user_data.sh` script installs:
- Node.js 18
- Nginx (reverse proxy)
- PM2 (process manager)
- Certbot (SSL certificates)

## 📝 Environment Variables

### Frontend (`.env` or secrets)
```
VITE_COGNITO_REGION=us-east-1
VITE_COGNITO_USER_POOL_ID=us-east-1_xxxxx
VITE_COGNITO_CLIENT_ID=xxxxx
VITE_API_URL=https://yourdomain.com/api
```

### Backend (`.env` on EC2)
```
NODE_ENV=production
PORT=3000
AWS_REGION=us-east-1
COGNITO_REGION=us-east-1
COGNITO_USER_POOL_ID=us-east-1_xxxxx
COGNITO_CLIENT_ID=xxxxx
```

## 🌐 Access Your Application

### After Deployment

1. **Get IP Address**:
   ```bash
   terraform output eip_address
   # or
   terraform output instance_details
   ```

2. **SSH Access**:
   ```bash
   ssh -i ~/portfolio-key.pem ubuntu@<instance-ip>
   ```

3. **Web Access**:
   - Frontend: `http://<instance-ip>`
   - API: `http://<instance-ip>:3000`
   - Health: `http://<instance-ip>:3000/health`

4. **With Domain**:
   Update your domain DNS to point to the Elastic IP, then configure SSL:
   ```bash
   ssh -i ~/portfolio-key.pem ubuntu@<instance-ip>
   sudo certbot certonly --nginx -d yourdomain.com
   ```

## 📊 Monitoring

### Check Application Status
```bash
ssh -i ~/portfolio-key.pem ubuntu@<instance-ip>

# PM2 process status
pm2 status
pm2 logs portfolio-api

# Nginx status
sudo systemctl status nginx

# Health check
curl http://localhost:3000/health
```

### CloudWatch Logs
View logs in AWS Console → CloudWatch

## 🔄 Deployment Workflow

### Automatic Deployments
1. Push to `main` branch
2. GitHub Actions builds frontend and backend
3. Runs tests/linting
4. Deploys to EC2 via rsync
5. Restarts PM2 process
6. Reloads Nginx

### Manual Deployments
```bash
# SSH to instance
ssh -i ~/portfolio-key.pem ubuntu@<instance-ip>

# Update backend
rsync -avz --exclude 'node_modules' \
  backend/ ubuntu@<instance-ip>:/var/www/portfolio/backend/

# Restart
pm2 restart portfolio-api
```

## 💰 Cost Estimation

**Free Tier (First 12 months):**
- EC2 t3.micro instance
- Elastic IP (free while attached)
- 1GB data transfer/month

**After Free Tier:**
- t3.micro: ~$10/month
- Elastic IP: ~$3-4/month if not in use
- DynamoDB: ~$1-5/month (on-demand)
- Cognito: Free for up to 50k users

## 🛡️ Security Best Practices

1. **SSH Key Management**
   - Never commit portfolio-key.pem to git
   - Store securely (GitHub Actions secret)
   - Rotate periodically

2. **Environment Variables**
   - Use GitHub secrets for sensitive data
   - Don't commit .env files
   - Rotate credentials regularly

3. **Security Groups**
   - Restrict SSH access in production
   - Use WAF for web traffic
   - Enable VPC Flow Logs

4. **IAM Permissions**
   - Use least privilege principle
   - Regular access audits
   - Enable MFA on AWS account

## 🐛 Troubleshooting

### Connection Issues
```bash
# Test SSH
ssh -i ~/portfolio-key.pem -v ubuntu@<instance-ip>

# Check security group
aws ec2 describe-security-groups --region us-east-1

# Check instance status
aws ec2 describe-instance-status --region us-east-1
```

### Application Issues
```bash
# SSH to instance
ssh -i ~/portfolio-key.pem ubuntu@<instance-ip>

# Check PM2
pm2 status
pm2 logs --lines 50

# Check Nginx
sudo nginx -t
sudo systemctl restart nginx

# Check ports
sudo netstat -tlpn | grep LISTEN
```

### Deployment Issues
Check GitHub Actions logs for detailed error messages.

## 📚 Resources

- [Terraform AWS Provider](https://registry.terraform.io/providers/hashicorp/aws/latest/docs)
- [AWS EC2 Documentation](https://docs.aws.amazon.com/ec2/)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Nginx Documentation](https://nginx.org/en/docs/)
- [PM2 Documentation](https://pm2.keymetrics.io/)

## 🔄 Updating Infrastructure

### Scale Up Instance
```bash
terraform apply -var="instance_type=t3.small"
```

### Update Security Group
Edit `ec2.tf` and apply:
```bash
terraform apply
```

### Destroy All Resources
⚠️ This will delete everything:
```bash
terraform destroy
```

## 📞 Support

For issues:
1. Check GitHub Actions logs
2. SSH to instance and check logs
3. Review Terraform state
4. Consult AWS documentation

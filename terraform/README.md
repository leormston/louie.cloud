# Terraform Configuration for Portfolio

This directory contains Terraform Infrastructure as Code (IaC) for deploying the portfolio application to AWS.

## Prerequisites

1. **AWS Account** - You need an active AWS account
2. **Terraform** - Install Terraform (v1.0+)
3. **AWS CLI** - Install and configure AWS CLI with credentials
4. **EC2 Key Pair** - Create an EC2 key pair in AWS console
5. **Git** - For cloning the repository

## Setup Instructions

### 1. Create EC2 Key Pair

```bash
# In AWS Console or via CLI:
aws ec2 create-key-pair --key-name portfolio-key --region us-east-1 --query 'KeyMaterial' --output text > portfolio-key.pem
chmod 600 portfolio-key.pem
```

### 2. Configure Variables

```bash
# Copy the example variables file
cp terraform.tfvars.example terraform.tfvars

# Edit terraform.tfvars with your values
nano terraform.tfvars
```

**Important variables to set:**
- `key_pair_name` - Name of your EC2 key pair
- `aws_region` - AWS region (default: us-east-1)
- `instance_type` - EC2 instance type (default: t3.micro - free tier eligible)
- `domain_name` - Optional: Your domain name

### 3. Initialize Terraform

```bash
terraform init
```

### 4. Plan Deployment

```bash
terraform plan -out=tfplan
```

Review the plan to ensure everything looks correct.

### 5. Apply Configuration

```bash
terraform apply tfplan
```

This will:
- Create an EC2 instance
- Configure security groups
- Set up IAM roles and policies
- Allocate an Elastic IP
- Install and configure Nginx, Node.js, and PM2

### 6. Get Instance Details

```bash
terraform output instance_details
terraform output connect_to_instance
```

Use the SSH command to connect to your instance:
```bash
ssh -i portfolio-key.pem ubuntu@<your-instance-ip>
```

## GitHub Actions Setup

After Terraform creates the infrastructure:

1. **Get GitHub Actions Credentials:**
```bash
terraform output github_actions_access_key_id
terraform output github_actions_secret_access_key
```

2. **Add GitHub Secrets:**
Go to your GitHub repository → Settings → Secrets and variables → Actions

Add these secrets:
- `AWS_ACCESS_KEY_ID` - From terraform output
- `AWS_SECRET_ACCESS_KEY` - From terraform output (kept secret)
- `EC2_HOST` - Public IP from `terraform output instance_details`
- `EC2_USER` - ubuntu
- `EC2_SSH_PRIVATE_KEY` - Content of your portfolio-key.pem file

Also add your Cognito and app configuration secrets:
- `VITE_COGNITO_REGION`
- `VITE_COGNITO_USER_POOL_ID`
- `VITE_COGNITO_CLIENT_ID`
- `VITE_API_URL`

## Maintenance

### Update Instance

```bash
terraform apply -var="instance_type=t3.small" -out=tfplan
terraform apply tfplan
```

### Destroy Infrastructure

```bash
terraform destroy
```

⚠️ **Warning:** This will delete all resources including the EC2 instance.

## Terraform State Management

For production environments, configure remote state:

1. Create S3 bucket and DynamoDB table for state locking
2. Uncomment the backend configuration in `main.tf`
3. Update with your bucket name and region

```hcl
backend "s3" {
  bucket         = "your-terraform-state-bucket"
  key            = "portfolio/terraform.tfstate"
  region         = "us-east-1"
  encrypt        = true
  dynamodb_table = "terraform-state-lock"
}
```

## Useful Terraform Commands

```bash
# Show current state
terraform show

# List resources
terraform state list

# Show specific resource
terraform state show aws_instance.portfolio

# Refresh state
terraform refresh

# Format code
terraform fmt

# Validate configuration
terraform validate

# Destroy specific resource
terraform destroy -target=aws_eip.portfolio
```

## Troubleshooting

### Instance not reachable

1. Check security group allows SSH (port 22)
2. Verify EC2 instance is running
3. Ensure SSH key pair matches

### Nginx not working

SSH into instance and check:
```bash
sudo systemctl status nginx
sudo nginx -t
sudo journalctl -u nginx -n 50
```

### PM2 issues

```bash
pm2 status
pm2 logs
pm2 restart all
```

## Cost Estimation

- **t3.micro** - Free tier eligible (first 12 months)
- **Elastic IP** - Free while attached to running instance
- **Data transfer** - First 1GB/month free

For pricing beyond free tier, check AWS pricing calculator.

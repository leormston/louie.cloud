# Terraform Configuration for Portfolio

This directory contains Terraform Infrastructure as Code (IaC) for deploying the portfolio application to AWS.

## Architecture

```
Internet → CloudFront (HTTPS) → EC2/Nginx (HTTP:80) → Node.js (port 3000)
```

| Resource | Details |
|---|---|
| EC2 (t3.micro) | Ubuntu 22.04, Nginx + Node.js + PM2 |
| Elastic IP | Static public IP attached to EC2 |
| CloudFront | HTTPS termination, caches static assets, forwards `/api/*` uncached |
| ACM Certificate | Covers `louie.cloud` + `www.louie.cloud`, auto-renewed |
| DynamoDB | `portfolio-blog-posts` and `portfolio-testimonials` tables |
| Cognito | User Pool + Identity Pool for auth |
| IAM | EC2 instance role with access to DynamoDB, Cognito, S3, SES, CloudWatch |

Remote state is stored in S3 (`new.louie.cloud/portfolio/terraform.tfstate`, eu-west-2).

## Prerequisites

1. **AWS Account** with appropriate permissions
2. **Terraform** v1.10+
3. **AWS CLI** configured with credentials
4. **EC2 Key Pair** created in AWS console
5. **Route53 hosted zone** for your domain

## Setup Instructions

### 1. Create EC2 Key Pair

```bash
aws ec2 create-key-pair --key-name portfolio-key --region eu-west-2 \
  --query 'KeyMaterial' --output text > portfolio-key.pem
chmod 600 portfolio-key.pem
```

### 2. Configure Variables

```bash
cp terraform.tfvars.example terraform.tfvars
```

Required variables:
- `key_pair_name` — Name of your EC2 key pair
- `domain_name` — Your domain (e.g. `louie.cloud`) — required for CloudFront

### 3. Initialize Terraform

```bash
terraform init
```

### 4. Plan and Apply

```bash
terraform plan -out=tfplan
terraform apply tfplan
```

This creates: EC2 instance, Elastic IP, security group, IAM role, DynamoDB tables, Cognito pools, ACM certificate, and CloudFront distribution.

> The `aws_acm_certificate_validation` step will block for a few minutes while DNS validation completes. The CloudFront distribution then takes 5–15 minutes to deploy globally.

### 5. Update Route53 A Records (manual step)

After apply, get the CloudFront domain:

```bash
terraform output cloudfront_domain_name
# e.g. dxxxxxxxxxxxxxxx.cloudfront.net
```

Then in the AWS Route53 console, update both A records to alias to your CloudFront distribution:
- `louie.cloud` → Alias → CloudFront distribution
- `www.louie.cloud` → Alias → CloudFront distribution

### 6. Get Instance Details

```bash
terraform output instance_details
terraform output connect_to_instance
```

## GitHub Actions Setup

The infrastructure workflow requires these GitHub secrets:

| Secret | Value |
|---|---|
| `AWS_ACCESS_KEY_ID` | IAM user access key |
| `AWS_SECRET_ACCESS_KEY` | IAM user secret key |
| `EC2_KEY_PAIR_NAME` | Name of your EC2 key pair |
| `DOMAIN_NAME` | `louie.cloud` |

The GitHub Actions IAM user must have these permissions:
- `ec2:*`
- `dynamodb:*`
- `iam:*`
- `cloudfront:*`
- `acm:*`
- `route53:*`
- `cognito-idp:*`
- `cognito-identity:*`

## Useful Commands

```bash
# Show current state
terraform show

# List all resources
terraform state list

# Show specific resource
terraform state show aws_cloudfront_distribution.portfolio

# Format code
terraform fmt

# Validate configuration
terraform validate

# Destroy specific resource
terraform destroy -target=aws_cloudfront_distribution.portfolio
```

## Troubleshooting

### Site not loading after Route53 update
- CloudFront distributions take 5–15 minutes to fully deploy
- Verify the Route53 A records are aliased to CloudFront (not the raw EC2 IP)

### Instance not reachable via SSH
- Check security group allows port 22
- Verify EC2 instance is running
- Ensure SSH key pair name matches

### Nginx not working
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

### CloudFront returning stale content
```bash
# Invalidate the cache
aws cloudfront create-invalidation \
  --distribution-id <DISTRIBUTION_ID> \
  --paths "/*"
```

## Cost Estimate

| Resource | Cost |
|---|---|
| EC2 t3.micro | ~$8/month (free tier eligible year 1) |
| Elastic IP | Free while attached |
| CloudFront (PriceClass_100) | ~$0–1/month for low traffic |
| ACM Certificate | Free |
| DynamoDB (on-demand) | ~$0 for low traffic |
| Route53 hosted zone | ~$0.50/month |

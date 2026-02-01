# 🚀 Quick Start: Deploy with GitHub Actions

Complete deployment using **only GitHub Actions** (no local Terraform commands).

## ⚡ 5-Minute Setup

### Step 1: Create EC2 Key Pair (1 min)

```bash
# Run locally once
aws ec2 create-key-pair --key-name portfolio-key --region eu-west-2 \
  --query 'KeyMaterial' --output text > ~/portfolio-key.pem
chmod 600 ~/portfolio-key.pem
```

Save `portfolio-key.pem` securely - you'll need its content later.

### Step 2: Create IAM User (1 min)

```bash
# Run locally once
aws iam create-user --user-name github-actions-portfolio
aws iam create-access-key --user-name github-actions-portfolio
```

Save the **Access Key ID** and **Secret Access Key** - you'll use these for GitHub secrets.

### Step 3: Add GitHub Secrets (2 min)

Go to: GitHub Repo → Settings → Secrets and variables → Actions

Click "New repository secret" and add these **3 secrets**:

1. **AWS_ACCESS_KEY_ID**
   - Value: From IAM user access key

2. **AWS_SECRET_ACCESS_KEY**
   - Value: From IAM user secret key

3. **EC2_KEY_PAIR_NAME**
   - Value: `portfolio-key`

### Step 4: Deploy Infrastructure (1 min)

1. Go to GitHub: Actions tab
2. Click **"Deploy Infrastructure"** workflow
3. Click **"Run workflow"**
4. Select action: **apply**
5. Click **"Run workflow"**
6. Wait for completion (~2-3 minutes)

### Step 5: Copy Infrastructure Outputs

After workflow completes:
1. Open the workflow run
2. Scroll to "Outputs" section
3. Copy all the output values

### Step 6: Add Application Secrets (1 min)

Add these **7 more secrets** using outputs from Step 5:

1. **EC2_HOST**
   - Value: `instance_public_ip` from outputs

2. **EC2_USER**
   - Value: `ubuntu`

3. **EC2_SSH_PRIVATE_KEY**
   - Value: Full content of `~/portfolio-key.pem` file

4. **VITE_COGNITO_REGION**
   - Value: `eu-west-2`

5. **VITE_COGNITO_USER_POOL_ID**
   - Value: Your Cognito User Pool ID

6. **VITE_COGNITO_CLIENT_ID**
   - Value: Your Cognito Client ID

7. **VITE_API_URL**
   - Value: `http://<EC2_IP>/api` (use EC2_HOST IP)

### Step 7: Deploy Application (1 push!)

```bash
git add .
git commit -m "Deploy portfolio to AWS"
git push origin main
```

Done! 🎉

---

## 📊 What Happens Automatically

**Infrastructure Workflow (`infrastructure.yml`):**
- ✅ Creates EC2 instance
- ✅ Sets up security groups
- ✅ Creates DynamoDB tables
- ✅ Configures IAM roles
- ✅ Allocates Elastic IP

**Deployment Workflow (`deploy.yml`):**
- ✅ Builds React frontend
- ✅ Builds Node.js backend
- ✅ Deploys to EC2 via SSH
- ✅ Restarts services
- ✅ Health checks

---

## 🔄 Future Deployments

After initial setup, **just push code:**

```bash
# Make changes locally
git add .
git commit -m "Update feature"
git push origin main
# GitHub Actions automatically deploys! ✨
```

---

## 📲 Access Your Site

After deployment completes:

1. Get your EC2 IP from GitHub Actions output
2. Visit: `http://<EC2_IP>`
3. API at: `http://<EC2_IP>:3000/api`
4. Health check: `http://<EC2_IP>:3000/health`

---

## 🛑 Troubleshooting

**Infrastructure workflow fails:**
- Check AWS credentials in secrets
- Verify EC2 key pair name is correct
- Check AWS account has permissions

**Deployment workflow fails:**
- Check EC2_HOST is correct IP
- Verify EC2_SSH_PRIVATE_KEY is complete file
- Check other secrets are set

**Can't access site:**
- Wait 30 seconds for services to start
- Check EC2 instance is running in AWS
- Verify security group allows HTTP (80)

---

## 🔐 Security

- Never commit `portfolio-key.pem`
- Store in GitHub secrets securely
- Rotate AWS access keys periodically
- Use AWS IAM for least privilege access

---

## ✅ Checklist

- [ ] Created EC2 key pair
- [ ] Created IAM user with access keys
- [ ] Added 3 infrastructure secrets to GitHub
- [ ] Ran infrastructure workflow
- [ ] Copied outputs from workflow
- [ ] Added 7 application secrets to GitHub
- [ ] Pushed code to main
- [ ] Deployment workflow ran successfully
- [ ] Can access site at EC2 IP
- [ ] Health check returns success

**That's it! You're live!** 🚀

# louie.cloud

Personal portfolio website for Louie Ormston Demi — Software / DevOps / Cloud Engineer.

## Tech Stack

- **Frontend:** React 19, Vite, React Router
- **Backend:** Express.js, AWS SDK (DynamoDB, SES, Cognito)
- **Infrastructure:** Terraform, EC2 (Ubuntu), Nginx, PM2
- **CI/CD:** GitHub Actions → SSH/rsync deploy to EC2

## Getting Started

### Frontend

```bash
npm install
npm run dev
```

### Backend

```bash
cd backend
cp .env.example .env  # configure AWS credentials and settings
npm install
npm run dev
```

## Deployment

Pushes to `main` trigger the GitHub Actions pipeline which builds the frontend, then deploys both frontend and backend to EC2 via rsync.

See [DEPLOYMENT.md](DEPLOYMENT.md) for full details.

## Infrastructure

Terraform configs in `terraform/` manage the EC2 instance, DynamoDB tables, Cognito user pool, and IAM roles in `eu-west-2`.

See [terraform/README.md](terraform/README.md) for setup instructions.

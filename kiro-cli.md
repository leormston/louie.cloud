# Project Context: louie.cloud

## Overview
Personal portfolio website for **Louie Ormston Demi** — a Software / DevOps / Cloud Engineer with 4+ years of experience. Domain: `louie.cloud`.

## Tech Stack

### Frontend
- **React 19** with Vite 5 (ES modules)
- **react-router-dom v7** for routing
- **react-icons** for iconography
- Plain CSS (no CSS framework)
- Pages: Home (Banner, Experience, Testimonials, Blog, Contact), `/blog`, `/testimonials`, `/experience`

### Backend
- **Express.js** (ES modules) on port 3000
- **AWS SDK v2** for DynamoDB and SES
- **Cognito** for auth (admin-only routes use `authMiddleware` + `roleCheck`)
- **express-rate-limit** on contact form (3 per 15 min)
- Contact form sends email via **AWS SES** to `louie@louie.cloud`
- Honeypot + spam keyword detection on contact submissions
- API prefix: `/api/blog`, `/api/testimonials`, `/api/contact`

### Database
- **DynamoDB** (pay-per-request) with tables:
  - `portfolio-blog-posts` (hash: id, GSI on createdAt)
  - `portfolio-testimonials` (hash: id, GSI on approved + createdAt)

### Infrastructure (Terraform)
- **AWS Region:** eu-west-2
- **EC2:** t3.micro, Ubuntu 22.04, 30GB gp3, Elastic IP
- **Cognito:** User pool + identity pool for admin auth
- **IAM:** Instance profile for EC2 to access DynamoDB/SES
- **Terraform state:** S3 bucket `new.louie.cloud` in eu-west-2
- Process manager: **PM2** (portfolio-api)

### Deployment
- **GitHub Actions** → builds frontend + backend → deploys via SSH/rsync to EC2
- Triggers on push to `main` or `fe-deployment`
- Frontend served from `/var/www/portfolio/frontend`
- Backend at `/var/www/portfolio/backend`
- **Nginx** reverse proxy: serves static frontend, proxies `/api/` to localhost:3000
- SSL handled by Certbot/Let's Encrypt on the server (not in repo nginx config)

### CI Secrets Required
- `EC2_HOST`, `EC2_USER`, `EC2_SSH_PRIVATE_KEY`
- `VITE_COGNITO_REGION`, `VITE_COGNITO_USER_POOL_ID`, `VITE_COGNITO_CLIENT_ID`, `VITE_API_URL`

## File Structure Conventions
- Frontend components: `src/components/jsx/` and `src/components/css/`
- Page-level views: `src/pages/`
- Assets (images, CV PDF): `src/assets/`
- Backend routes: `backend/routes/`, models: `backend/models/`, middleware: `backend/middleware/`
- Infrastructure: `terraform/`
- Nginx config: `nginx/louie.cloud.conf`

## Key Notes
- The Navbar has Blog link commented without hash prefix (`#blog` vs `/#blog`)
- Portfolio section exists as a component (`portfolio.jsx`) but is commented out in Navbar
- Testimonials can be submitted publicly (no auth required for POST)
- Blog posts require admin role to create/update/delete
- Previous work experience includes Vodafone, Legal & General, and PhlashWeb (logos in assets)
- CV available as PDF in `src/assets/Louie Ormston Demi CV.pdf`

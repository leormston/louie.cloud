# Project Context: louie.cloud

## Overview
Personal portfolio website for **Louie Ormston Demi** — a Software / DevOps / Cloud Engineer with 4+ years of experience. Domain: `louie.cloud`.

## Tech Stack

### Frontend
- **React 19** with Vite 5 (ES modules)
- **react-router-dom v7** for routing
- **react-icons** for iconography
- **react-markdown** + **remark-gfm** for blog post rendering
- Plain CSS (no CSS framework)
- Pages: Home (Banner, Experience, Testimonials, Blog teaser, Contact), `/blog`, `/blog/:slug`, `/testimonials`, `/experience`

### Blog (Markdown-based)
- Blog posts are `.md` files in `content/blog/` with YAML frontmatter (title, slug, date, author, category, excerpt)
- `content/blog/index.json` is the manifest listing all posts metadata (sorted newest first)
- Vite bundles posts via `import.meta.glob('*.md', { query: '?raw' })` — each post becomes a lazy-loaded chunk
- Frontmatter parsed at runtime by `src/utils/parseFrontmatter.js` (lightweight, browser-compatible)
- No backend/database needed for blog reads
- **To add a post:** create `.md` file in `content/blog/`, add entry to `index.json`, commit and push

### Contact form (only backend)
- One **Lambda** (`terraform/lambda/contact/index.mjs`, Node 22, no dependencies) behind CloudFront at `POST /api/contact`
- Sends email via **SES** (eu-west-2) to `louie@louie.cloud`, Reply-To set to the sender
- Honeypot, spam keyword and link checks, plus a best-effort per-IP rate limit (3 per 15 min)
- Function URL uses IAM auth via CloudFront OAC, so the browser must send `x-amz-content-sha256` (SHA-256 of the body). See `contact.jsx`

### Infrastructure (Terraform)
- **AWS Region:** eu-west-2 (ACM cert in us-east-1 for CloudFront)
- **S3** bucket `louie-cloud-site` (private) → **CloudFront** (OAC, SPA rewrite function, security headers)
- **Route 53** alias A/AAAA records for `louie.cloud` + `www` → CloudFront
- **Terraform state:** S3 bucket `new.louie.cloud` in eu-west-2
- No servers. EC2, Cognito and DynamoDB were removed in Nov 2026 to save cost.

### Deployment
- **Deploy Static Site** workflow: on push to `main` → `npm run build` → `s3 sync` → CloudFront invalidation
- **Deploy Infrastructure** workflow: manual `plan` / `apply` (also deploys contact Lambda code changes)

### CI Secrets Required
- `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `DOMAIN_NAME`

## File Structure Conventions
- Frontend components: `src/components/jsx/` and `src/components/css/`
- Page-level views: `src/pages/`
- Assets (images, CV PDF): `src/assets/`
- Blog content: `content/blog/` (Markdown files + index.json)
- Utilities: `src/utils/`
- Contact form Lambda: `terraform/lambda/contact/`
- Infrastructure: `terraform/`

## Key Notes
- The Navbar Blog link uses `#blog` instead of `/#blog` (inconsistent with other nav links)
- Portfolio section exists as a component (`portfolio.jsx`) but is commented out in Navbar
- Testimonials are static data in `src/data/testimonials.js`
- Previous work experience includes Vodafone, Legal & General, and PhlashWeb (logos in assets)
- CV available as PDF in `src/assets/Louie Ormston Demi CV.pdf`
- Footer has a dark/light theme toggle but no CSS actually responds to `data-theme` attribute

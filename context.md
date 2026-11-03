# louie.cloud — Context Notes

Notes from a repo + AWS account review on 2026-11-03. Covers how the site is
built, deployed and hosted, and what was found to be true in the live account
(not just in the code). See `TODO.md` for the action list.

> `kiro-cli.md` holds an older, overlapping project summary. Consider merging
> the two and keeping just one.

## What this is

Personal portfolio site for Louie Ormston Demi at `louie.cloud` / `www.louie.cloud`.

- **Frontend:** React 19 + Vite 5, react-router v7, plain CSS. Pages: Home,
  `/blog`, `/blog/:slug`, `/testimonials`, `/experience`. Blog posts are
  markdown files in `content/blog/` (indexed by `content/blog/index.json`).
  Testimonials and experience data are **static** (`src/data/testimonials.js`,
  hardcoded in components).
- **Backend:** Express app in `backend/` (Node, ES modules, `aws-sdk` v2).
  Routes:
  - `POST /api/contact`: contact form → sends email via SES. **The only
    endpoint the frontend uses.**
  - `/api/testimonials`: CRUD on DynamoDB `portfolio-testimonials`. **Not used
    by the frontend, and broken in production** (see Known issues).
  - `/health`: health check.

## Hosting / request flow

```
browser → CloudFront (d2dnlsrg4ieqdn.cloudfront.net, TLS via ACM us-east-1)
        → EC2 portfolio-server (t3.micro, eu-west-2, EIP 3.8.69.74), HTTP :80
            nginx → static files in /var/www/portfolio/frontend
            nginx /api/ → Express on localhost:3000 (run by PM2 as "portfolio-api")
```

- CloudFront `/api/*` is uncached; everything else is cached (default TTL 1h,
  `index.html` is sent with `Cache-Control: no-cache` by nginx).
- DNS: Route 53 zone `louie.cloud`, A/alias records for apex + www → CloudFront.
  The zone itself is **not** managed by Terraform (looked up as a data source).

## Infrastructure (Terraform, `terraform/`)

- State: S3 bucket `new.louie.cloud`, key `portfolio/terraform.tfstate`,
  eu-west-2. No state locking configured.
- Manages: EC2 instance + security group + EIP, IAM role/instance profile,
  ACM cert + validation records, CloudFront distribution, DynamoDB
  `portfolio-testimonials` (on-demand), Cognito user pool/client/identity pool.
- Run via `.github/workflows/infrastructure.yml` (manual dispatch:
  plan / apply / destroy) using long-lived AWS access keys in GitHub secrets.
- `user_data.sh` bootstraps the server on first boot (Node 18, nginx, PM2,
  certbot) and writes its **own** nginx config. `user_data` and `ami` are in
  `ignore_changes`, so edits to the script never reach the running server.

## Deployment (`.github/workflows/deploy.yml`)

On push to `main` (or `fe-deployment`): build frontend with Vite → rsync
`dist/` to the server over SSH → rsync `backend/` → `npm ci` on the server →
restart PM2 → reload nginx. No CloudFront invalidation (fine, since assets are
hashed and `index.html` is no-cache).

The repo's `nginx/louie.cloud.conf` is **not** copied by the deploy, so
whatever is on the server is whatever was set up by hand / user_data.

## Things verified in the live account (2026-11-03)

- **Monthly cost ≈ $21 + tax.** EC2 compute ~$8.40, public IPv4 ~$3.70,
  30 GB gp3 disk ~$2.80, Route 53 ~$1, CloudWatch alarms ~$1.40 (after
  removing 24 orphaned regina-ps alarms today). The server + IP + disk
  (~$15) is most of the bill.
- **Server is ~idle:** 0.26% average CPU over 14 days.
- **`GET https://louie.cloud/api/testimonials` returns 500**
  (`{"error":"Failed to fetch testimonials"}`). The table exists in eu-west-2
  with 0 items.
- **`https://louie.cloud/health` returns `index.html`**, not JSON. This means
  the live nginx config is the user_data one (no `/health` block), not the
  repo's `nginx/louie.cloud.conf`.
- **The origin is reachable directly, bypassing CloudFront:**
  `http://3.8.69.74/` → 200 and `http://3.8.69.74:3000/health` → 200.
  The security group allows 22, 80, 443 and 3000 from `0.0.0.0/0`.
- SES: `louie@louie.cloud` is verified in eu-west-2 and us-east-1, and the
  `louie.cloud` domain is verified in us-east-1. Production access is enabled
  (not sandboxed). The contact form was not test-sent.
- Cognito pool exists, but nothing in the frontend uses it (the
  `VITE_COGNITO_*` build vars are unused).
- Other things in the account that are **not** this repo: `api.louie.cloud`
  (API Gateway + `api-louie-cloud` Lambda, eu-west-1), `email-me-lambda`,
  `louie-cloud-blogs` / `louie-cloud-projects` DynamoDB tables (eu-west-1,
  provisioned + autoscaling), the agon / brainrot / snake / sf-sqs-poc
  subdomains and lots of old S3 demo buckets. These look like earlier versions
  of the site or side projects.

## Known issues in the code (details + fixes in TODO.md)

- `models/testimonial.js` passes `ScanIndexForward` to `scan()`; aws-sdk v2
  rejects unknown params, so listing testimonials always fails.
- The default `AWS_REGION` in code is `us-east-1`, but the table lives in
  eu-west-2. It only works if the server's `.env` sets the region.
- `createTestimonial` writes `approved: false` (boolean), but `approved` is a
  string-typed GSI key → DynamoDB will reject the write.
- `GET /api/testimonials` would return unapproved testimonials too (no filter).
- `roleCheck` reads `GroupConfiguration.GroupsToOverride` from Cognito
  `getUser`, which never returns groups → admin routes always 403.
- No `trust proxy` → `req.ip` is nginx's (127.0.0.1), so the contact rate
  limit (3 per 15 min) is **shared by every visitor**.
- Node 18 (EOL Apr 2025) in CI and on the server; `aws-sdk` v2 is end-of-support.

# louie.cloud — Context Notes

How the site is built, hosted and deployed, plus notes about the AWS account.
See `TODO.md` for the action list. (`kiro-cli.md` has a similar summary for Kiro.)

## What this is

Personal portfolio site for Louie Ormston Demi at `louie.cloud` / `www.louie.cloud`.

- **Frontend:** React 19 + Vite 5, react-router v7, plain CSS. Pages: Home,
  `/blog`, `/blog/:slug`, `/testimonials`, `/experience`.
  - Blog posts: markdown in `content/blog/` + `content/blog/index.json`,
    bundled at build time.
  - Testimonials and experience: static data in the source.
- **Contact form:** the only dynamic feature. A Lambda behind CloudFront
  (`POST /api/contact`) emails `louie@louie.cloud` via SES.

## Hosting / request flow

```
browser → Route 53 (louie.cloud, www: alias A/AAAA)
        → CloudFront (ACM cert, managed security headers)
            /*      → S3 bucket louie-cloud-site (private, OAC)
                      CloudFront Function: paths without a file extension → /index.html
            /api/*  → Lambda function URL louie-cloud-contact (IAM auth via OAC)
```

- Caching: `assets/*` (hashed) is cached for 1 year, other files for 1 hour,
  and `index.html` is never cached. These are set as Cache-Control headers at
  upload time.
- Because CloudFront signs requests to the Lambda, **POSTs need an
  `x-amz-content-sha256` header** (the frontend adds it). Calling the
  function URL directly returns 403.
- The Lambda's rate limit is per instance and in memory, so it's best-effort.
  Reserved concurrency (2) keeps it meaningful and caps abuse.

## Infrastructure & deployment

- Terraform in `terraform/`. State: `s3://new.louie.cloud/portfolio/terraform.tfstate`
  (eu-west-2, no locking). The Route 53 zone is a data source, not managed.
- **Deploy Static Site** (`.github/workflows/deploy-static.yml`): on push to
  `main` → build → `s3 sync` → invalidate CloudFront. The distribution is
  found by its comment, `louie-cloud-static`.
- **Deploy Infrastructure** (`.github/workflows/infrastructure.yml`): manual
  plan / apply / destroy. Also deploys Lambda code changes.
- CI uses long-lived access keys for the `github-actions-portfolio` IAM user,
  which currently has full admin (`*:*`). See TODO.

## History

- Until Nov 2026 the site ran on an EC2 t3.micro with nginx, an Express
  backend (PM2), Cognito and a DynamoDB testimonials table, behind CloudFront.
  The server was ~idle (0.26% CPU), and the contact form was its only used
  feature, yet it cost ~$15 of a ~$21/month bill.
- Migrated to S3 + CloudFront + Lambda (PRs #13 and the `remove-ec2` PR).
  Expected bill afterwards: ~$3–5/month.
- Also done in Nov 2026:
  - deleted 24 orphaned CloudWatch alarms from the regina-ps DynamoDB tables
  - set 14-day retention on all log groups
  - raised the AWS budget to $10/month, with alerts to louie@louie.cloud and
    l.e.ormston@gmail.com

## AWS account notes (not managed by this repo)

- SES: `louie@louie.cloud` is verified in eu-west-2 (used by the Lambda) and
  us-east-1, and the `louie.cloud` domain is verified in us-east-1. The
  account has SES production access.
- Other projects in the account: `api.louie.cloud` (API Gateway +
  `api-louie-cloud` Lambda, eu-west-1), `email-me-lambda`, the
  `louie-cloud-blogs` / `louie-cloud-projects` DynamoDB tables (provisioned +
  autoscaling, 24 alarms ≈ $1.40/month), regina-ps (tables, Lambdas, API), the
  agon / brainrot / snake / sf-sqs-poc subdomains, many old S3 demo buckets,
  and a Cloud Map `local.` private zone ($0.50/month).
- DNS records that point nowhere: `pokerplanning.louie.cloud` → `13.134.236.62`
  (an IP this account doesn't own), and a literal `@.louie.cloud` record that
  pointed at the old EC2 Elastic IP.

# TODO

Background and evidence for most items: see `context.md` (review of 2026-11-03).

## High Priority: security

- [ ] **Lock down the security group** (`terraform/ec2.tf`). Currently 22, 80,
      443 and 3000 are open to the world, and `http://3.8.69.74:3000` serves
      the API directly, skipping CloudFront and nginx.
  - Remove the `3000` and `443` ingress rules (nothing needs them).
  - Restrict `80` to CloudFront using the managed prefix list
    `com.amazonaws.global.cloudfront.origin-facing`.
  - Restrict `22` to your IP, or drop it and use SSM Session Manager.
  - Also make Express listen on `127.0.0.1` only (`app.listen(PORT, '127.0.0.1')`).
- [ ] **Delete the dangling DNS record `pokerplanning.louie.cloud`.** It points
      at `13.134.236.62`, which this account no longer owns, so the subdomain
      could be taken over. Also delete the stray `@.louie.cloud` A record.
- [ ] **Switch GitHub Actions to OIDC** instead of long-lived access keys
      (`infrastructure.yml` already requests `id-token: write`). Create an IAM
      role scoped to what Terraform needs, and delete the old access key.
      The `ec2:* / dynamodb:* / iam:*` policy suggested in `iam.tf` is far too broad.
- [ ] **Protect `destroy`** in `infrastructure.yml`: put it behind a GitHub
      environment with required approval, or remove it from the dispatch options.
- [ ] **Scope the EC2 IAM policy** (`terraform/iam.tf`): `cognito-idp:*`,
      DynamoDB and S3 are all on `Resource = "*"`. Limit them to the
      testimonials table ARN and the SES identity, and drop S3 and Cognito
      if unused.
- [ ] Pin the SSH host key in a secret instead of `ssh-keyscan` at deploy
      time in `deploy.yml` (current setup trusts whatever host answers).

## High Priority: cost (~$15 of the ~$21/month bill)

- [ ] **Move off EC2.** The server is ~idle (0.26% CPU), and the only backend
      endpoint the site uses is `POST /api/contact`.
  - Frontend → S3 bucket + existing CloudFront distribution (Origin Access Control).
  - Contact form → a single Lambda (+ Lambda function URL or API Gateway
    HTTP API) behind CloudFront `/api/*`. `email-me-lambda` in eu-west-1 may
    already be most of this.
  - Then remove the EC2 instance, EIP, security group and disk from Terraform.
    Estimated cost after: well under $1/month (+ Route 53 $0.50/zone).
  - Deploy becomes `vite build` → `aws s3 sync` → CloudFront invalidation of
    `/index.html`. No SSH, PM2 or nginx.
- [ ] If keeping EC2 for now: drop `volume_size` to ~10 GB (needs a new
      volume), consider `t4g.micro` (ARM, cheaper), and remove the unused
      CloudWatch detailed monitoring (`monitoring = true` in `ec2.tf`).
- [ ] Add an AWS Budgets alert (free), e.g. email at $25/month.

## Medium Priority: bugs

- [ ] **`GET /api/testimonials` 500s in production.** `scan()` is passed
      `ScanIndexForward`, which aws-sdk v2 rejects. Remove it (or decide the
      testimonials API isn't needed, see below).
- [ ] `createTestimonial` writes `approved: false` (boolean), but the
      `approved-index` GSI key is type `S` → writes will fail. Use `"false"` /
      `"true"` strings, or change the attribute type.
- [ ] `GET /api/testimonials` returns unapproved items. Query `approved-index`
      with `approved = "true"` instead of scanning.
- [ ] `POST /api/testimonials` is public with no rate limit or length checks:
      anyone can fill the table. Add limits or require auth.
- [ ] `roleCheck` reads `GroupConfiguration.GroupsToOverride`, which Cognito
      `getUser` never returns, so admin routes always 403. Verify the JWT
      (e.g. `aws-jwt-verify`) and read `cognito:groups` instead.
- [ ] `updateTestimonial` builds `UpdateExpression` from raw `req.body` keys.
      Whitelist the editable fields and use `ExpressionAttributeNames`.
- [ ] Add `trust proxy` setting to Express (rate limiter fix for CloudFront).
      Traffic goes CloudFront → nginx → Express, so `app.set('trust proxy', 2)`.
      Today every visitor shares one rate-limit bucket (3 contact messages per
      15 min for the whole site).
- [ ] Code defaults `AWS_REGION` to `us-east-1`, but everything lives in
      `eu-west-2`. Change the default (or fail fast if unset).
- [ ] Escape `email` in the contact HTML email body (the regex allows `<` / `>`).
- [ ] CORS is `origin: '*'` with `credentials: true`, which browsers reject.
      Set `FRONTEND_URL=https://louie.cloud` or drop CORS (same origin via CloudFront).

## Medium Priority: drift & maintenance

- [ ] **nginx config drift.** `https://louie.cloud/health` returns `index.html`,
      so the server runs the `user_data.sh` config, not `nginx/louie.cloud.conf`.
      Either deploy the repo config in `deploy.yml` or delete it. (Moot if
      moving off EC2.)
- [ ] Upgrade Node 18 → 22 LTS (`deploy.yml`, `user_data.sh`, `engines`).
- [ ] Migrate `aws-sdk` v2 → v3 modular clients (`@aws-sdk/client-ses`,
      `@aws-sdk/lib-dynamodb`). v2 is end-of-support.
- [ ] Use `npm ci --omit=dev` instead of the deprecated `--production`.
- [ ] Add state locking to the Terraform S3 backend (`use_lockfile = true`,
      Terraform ≥ 1.10).
- [ ] CloudFront origin uses `aws_instance.portfolio.public_dns`. Use
      `aws_eip.portfolio[0].public_dns` so it can't drift if the instance
      is replaced.
- [ ] Move CloudFront from legacy `forwarded_values` to cache/origin-request policies.
- [ ] Remove the unused `certbot` install from `user_data.sh` (TLS is at CloudFront).
- [ ] Remove the `fe-deployment` branch trigger from `deploy.yml` if that branch
      is finished.

## Medium Priority: dead code / cleanup

- [ ] Extract shared experience data from `experience.jsx` and `ExperienceList.jsx` into one file
- [ ] Decide whether the testimonials API + Cognito are needed. The frontend uses
      static `src/data/testimonials.js` and never calls them. If not needed,
      remove `routes/testimonials.js`, `models/`, `middleware/`, `cognito.tf`,
      the `VITE_COGNITO_*` build vars and the DynamoDB table (its stream and
      TTL are unused too).
- [ ] Delete the duplicate `src/components/Navbar.jsx` (the app uses `components/jsx/Navbar.jsx`).
- [ ] Remove unused backend code: `utils/response.js`, duplicate `roleCheck` in
      `middleware/auth.js`, unused `__dirname`, unused `amazon-cognito-identity-js` dep.
- [ ] Move `ps_files/` (PSD/zip design sources) out of the repo or into Git LFS.
- [ ] Merge `kiro-cli.md` into `context.md` and consolidate the deployment docs
      (`DEPLOYMENT.md`, `DOMAIN_SETUP.md`, `GITHUB_ACTIONS_SETUP.md`, workflow README).

## Lower Priority

- [ ] Add tests (backend unit tests + frontend component tests)
- [ ] Verify responsive/mobile experience across all pages
- [ ] Compress `banner_photo.jpg` (216 KB) / serve WebP.
- [ ] Add an `og:image` for nicer link previews (meta tags have none).
- [ ] Prerender/SSG the pages (e.g. `vite-plugin-ssg`) so crawlers see content,
      not an empty `<div id="root">`.
- [ ] Clean up unrelated leftovers in the AWS account: old S3 demo buckets,
      `hello-world` Lambda, regina-ps Lambdas/API/tables, the Cloud Map `local.`
      zone ($0.50/mo), and unused `*-tfstate` buckets.

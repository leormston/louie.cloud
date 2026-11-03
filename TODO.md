# TODO

Background for most items: see `context.md`.

## High Priority

- [ ] **Delete dangling DNS records**: `pokerplanning.louie.cloud`
      (→ `13.134.236.62`, not owned by this account, so the subdomain could be
      taken over) and the stray `@.louie.cloud` A record (→ the released EC2 EIP).
- [ ] **Switch GitHub Actions to OIDC** instead of long-lived access keys
      (`infrastructure.yml` already requests `id-token: write`). Create a role
      scoped to this repo's resources (S3, CloudFront, Lambda, IAM for the
      Lambda role, ACM, Route 53 records). Then delete the access key and the
      `*:*` policy on `github-actions-portfolio`.
- [ ] **Protect `destroy`** in `infrastructure.yml`: put it behind a GitHub
      environment with required approval, or remove the option.
- [ ] Remove old GitHub secrets: `EC2_HOST`, `EC2_USER`,
      `EC2_SSH_PRIVATE_KEY`, `EC2_KEY_PAIR_NAME`, `VITE_COGNITO_*`, `VITE_API_URL`.
- [ ] Delete the unused EC2 key pair `portfolio-key` (eu-west-2).

## Medium Priority

- [ ] Add state locking to the Terraform S3 backend (`use_lockfile = true`).
- [ ] Redirect `www.louie.cloud` → `louie.cloud` (e.g. in the CloudFront
      Function) so there's one canonical host.
- [ ] Contact form rate limit is per Lambda instance. If spam becomes a
      problem, move it to DynamoDB (TTL) or add AWS WAF rate-based rules
      (WAF costs ~$6/month, so only if needed).
- [ ] Have the contact form say something nicer when a request is rejected
      (e.g. a missing `x-amz-content-sha256` header returns a raw 403 from CloudFront).
- [ ] Fix the existing lint error in `contact.jsx` (unused `error` in `catch`).
- [ ] Extract shared experience data from `experience.jsx` and `ExperienceList.jsx` into one file
- [ ] Delete the duplicate `src/components/Navbar.jsx` (the app uses `components/jsx/Navbar.jsx`).
- [ ] Move `ps_files/` (PSD/zip design sources) out of the repo or into Git LFS.

## Lower Priority

- [ ] Add tests (contact Lambda unit tests + frontend component tests)
- [ ] Verify responsive/mobile experience across all pages
- [ ] Compress `banner_photo.jpg` (216 KB) / serve WebP.
- [ ] Add an `og:image` for nicer link previews.
- [ ] Prerender/SSG the pages (e.g. `vite-plugin-ssg`) so crawlers see content,
      not an empty `<div id="root">`.
- [ ] Lower the AWS budget toward $5/month once the new bill settles.
- [ ] Clean up unrelated leftovers in the AWS account: old S3 demo buckets,
      `hello-world` Lambda, regina-ps Lambdas/API/tables, the Cloud Map `local.`
      zone ($0.50/month), unused `*-tfstate` buckets. Consider switching
      `louie-cloud-blogs` / `louie-cloud-projects` / `users` tables to
      on-demand (removes 24 alarms, ~$1.40/month) or deleting them if unused.

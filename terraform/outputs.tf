# --- Static site ---

output "static_site_url" {
  description = "Test URL for the static site (works before any DNS changes)"
  value       = "https://${aws_cloudfront_distribution.static_site.domain_name}"
}

output "static_site_distribution_id" {
  description = "CloudFront distribution ID for the static site"
  value       = aws_cloudfront_distribution.static_site.id
}

output "static_site_bucket" {
  description = "S3 bucket the frontend is deployed to"
  value       = aws_s3_bucket.static_site.bucket
}

output "contact_lambda_name" {
  description = "Contact form Lambda function name"
  value       = aws_lambda_function.contact.function_name
}

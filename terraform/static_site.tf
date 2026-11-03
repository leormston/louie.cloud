# Static hosting for louie.cloud: private S3 bucket + CloudFront.
#
#   /*         → S3 (built Vite app), SPA routes rewritten to /index.html
#   /api/*     → contact form Lambda (see contact_lambda.tf)
#
# Serves louie.cloud + www.louie.cloud (DNS records at the bottom of this file).

data "aws_caller_identity" "current" {}

locals {
  static_site_aliases = [var.domain_name, "www.${var.domain_name}"]
}

# --- S3 bucket (private, only CloudFront can read) ---

resource "aws_s3_bucket" "static_site" {
  bucket = var.static_site_bucket_name

  tags = {
    Name = var.static_site_bucket_name
  }
}

resource "aws_s3_bucket_public_access_block" "static_site" {
  bucket = aws_s3_bucket.static_site.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_ownership_controls" "static_site" {
  bucket = aws_s3_bucket.static_site.id

  rule {
    object_ownership = "BucketOwnerEnforced"
  }
}

resource "aws_s3_bucket_policy" "static_site" {
  bucket = aws_s3_bucket.static_site.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "AllowCloudFrontRead"
        Effect    = "Allow"
        Principal = { Service = "cloudfront.amazonaws.com" }
        Action    = "s3:GetObject"
        Resource  = "${aws_s3_bucket.static_site.arn}/*"
        Condition = {
          StringEquals = {
            "AWS:SourceArn" = aws_cloudfront_distribution.static_site.arn
          }
        }
      }
    ]
  })

  depends_on = [aws_s3_bucket_public_access_block.static_site]
}

# --- CloudFront ---

resource "aws_cloudfront_origin_access_control" "static_site_s3" {
  name                              = "louie-cloud-static-s3"
  description                       = "CloudFront → S3 for louie.cloud static site"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

# Rewrites client-side routes (/blog, /blog/my-post, ...) to /index.html so
# React Router can handle them. Requests for real files (anything with a file
# extension) pass through untouched.
resource "aws_cloudfront_function" "spa_rewrite" {
  name    = "louie-cloud-spa-rewrite"
  runtime = "cloudfront-js-2.0"
  comment = "Serve index.html for SPA routes"
  publish = true
  code    = <<-EOT
    function handler(event) {
      var request = event.request;
      var lastSegment = request.uri.split('/').pop();
      if (lastSegment.indexOf('.') === -1) {
        request.uri = '/index.html';
      }
      return request;
    }
  EOT
}

data "aws_cloudfront_cache_policy" "caching_optimized" {
  name = "Managed-CachingOptimized"
}

data "aws_cloudfront_cache_policy" "caching_disabled" {
  name = "Managed-CachingDisabled"
}

data "aws_cloudfront_origin_request_policy" "all_viewer_except_host" {
  name = "Managed-AllViewerExceptHostHeader"
}

data "aws_cloudfront_response_headers_policy" "security_headers" {
  name = "Managed-SecurityHeadersPolicy"
}

resource "aws_cloudfront_distribution" "static_site" {
  enabled             = true
  is_ipv6_enabled     = true
  comment             = "louie-cloud-static" # deploy-static.yml looks the distribution up by this
  default_root_object = "index.html"
  price_class         = "PriceClass_100"
  aliases             = local.static_site_aliases

  origin {
    origin_id                = "static-site-s3"
    domain_name              = aws_s3_bucket.static_site.bucket_regional_domain_name
    origin_access_control_id = aws_cloudfront_origin_access_control.static_site_s3.id
  }

  origin {
    origin_id                = "contact-lambda"
    domain_name              = local.contact_function_url_domain
    origin_access_control_id = aws_cloudfront_origin_access_control.contact_lambda.id

    custom_origin_config {
      http_port              = 80
      https_port             = 443
      origin_protocol_policy = "https-only"
      origin_ssl_protocols   = ["TLSv1.2"]
    }
  }

  # Contact form API — never cached, all viewer headers/body forwarded.
  ordered_cache_behavior {
    path_pattern             = "/api/*"
    target_origin_id         = "contact-lambda"
    allowed_methods          = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
    cached_methods           = ["GET", "HEAD"]
    cache_policy_id          = data.aws_cloudfront_cache_policy.caching_disabled.id
    origin_request_policy_id = data.aws_cloudfront_origin_request_policy.all_viewer_except_host.id
    viewer_protocol_policy   = "redirect-to-https"
    compress                 = true
  }

  # Site files. Cache lifetimes come from the Cache-Control headers set at
  # upload time (hashed assets: 1 year, index.html: no-cache).
  default_cache_behavior {
    target_origin_id           = "static-site-s3"
    allowed_methods            = ["GET", "HEAD", "OPTIONS"]
    cached_methods             = ["GET", "HEAD"]
    cache_policy_id            = data.aws_cloudfront_cache_policy.caching_optimized.id
    response_headers_policy_id = data.aws_cloudfront_response_headers_policy.security_headers.id
    viewer_protocol_policy     = "redirect-to-https"
    compress                   = true

    function_association {
      event_type   = "viewer-request"
      function_arn = aws_cloudfront_function.spa_rewrite.arn
    }
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    acm_certificate_arn      = aws_acm_certificate_validation.portfolio.certificate_arn
    ssl_support_method       = "sni-only"
    minimum_protocol_version = "TLSv1.2_2021"
  }

  tags = {
    Name = "louie-cloud-static"
  }
}

# --- DNS: louie.cloud + www → this distribution ---
# These records already exist (created by hand, pointing at the old
# distribution); allow_overwrite lets Terraform take them over.

resource "aws_route53_record" "static_site" {
  for_each = {
    for pair in setproduct(local.static_site_aliases, ["A", "AAAA"]) :
    "${pair[0]}-${pair[1]}" => { name = pair[0], type = pair[1] }
  }

  zone_id         = data.aws_route53_zone.portfolio.zone_id
  name            = each.value.name
  type            = each.value.type
  allow_overwrite = true

  alias {
    name                   = aws_cloudfront_distribution.static_site.domain_name
    zone_id                = aws_cloudfront_distribution.static_site.hosted_zone_id
    evaluate_target_health = false
  }
}

# ACM Certificate — must be in us-east-1 for CloudFront
resource "aws_acm_certificate" "portfolio" {
  provider                  = aws.us_east_1
  domain_name               = var.domain_name
  subject_alternative_names = ["www.${var.domain_name}"]
  validation_method         = "DNS"

  lifecycle {
    create_before_destroy = true
  }

  tags = {
    Name = "portfolio-cert"
  }
}

# Read-only lookup of existing hosted zone
data "aws_route53_zone" "portfolio" {
  name         = var.domain_name
  private_zone = false
}

# ACM DNS validation CNAMEs (new records, added to existing zone)
resource "aws_route53_record" "cert_validation" {
  for_each = {
    for dvo in aws_acm_certificate.portfolio.domain_validation_options : dvo.domain_name => {
      name   = dvo.resource_record_name
      record = dvo.resource_record_value
      type   = dvo.resource_record_type
    }
  }

  allow_overwrite = true
  name            = each.value.name
  records         = [each.value.record]
  ttl             = 60
  type            = each.value.type
  zone_id         = data.aws_route53_zone.portfolio.zone_id
}

resource "aws_acm_certificate_validation" "portfolio" {
  provider                = aws.us_east_1
  certificate_arn         = aws_acm_certificate.portfolio.arn
  validation_record_fqdns = [for record in aws_route53_record.cert_validation : record.fqdn]
}

locals {
  ec2_origin_ip = var.enable_eip ? aws_eip.portfolio[0].public_ip : aws_instance.portfolio.public_ip
}

# CloudFront Distribution
resource "aws_cloudfront_distribution" "portfolio" {
  enabled         = true
  is_ipv6_enabled = true
  comment         = "portfolio"
  aliases         = [var.domain_name, "www.${var.domain_name}"]

  origin {
    domain_name = local.ec2_origin_ip
    origin_id   = "portfolio-ec2"

    custom_origin_config {
      http_port              = 80
      https_port             = 443
      origin_protocol_policy = "http-only"
      origin_ssl_protocols   = ["TLSv1.2"]
    }
  }

  # API paths — no caching, forward everything
  ordered_cache_behavior {
    path_pattern     = "/api/*"
    allowed_methods  = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "portfolio-ec2"

    forwarded_values {
      query_string = true
      headers      = ["Authorization", "Content-Type", "Origin", "Accept", "X-Requested-With"]
      cookies {
        forward = "all"
      }
    }

    viewer_protocol_policy = "redirect-to-https"
    min_ttl                = 0
    default_ttl            = 0
    max_ttl                = 0
    compress               = true
  }

  # Everything else — cache static assets for 1 hour
  default_cache_behavior {
    allowed_methods  = ["GET", "HEAD", "OPTIONS"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "portfolio-ec2"

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }

    viewer_protocol_policy = "redirect-to-https"
    min_ttl                = 0
    default_ttl            = 3600
    max_ttl                = 86400
    compress               = true
  }

  # North America + Europe edge locations only
  price_class = "PriceClass_100"

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
    Name = "portfolio-cloudfront"
  }

  depends_on = [aws_acm_certificate_validation.portfolio]
}

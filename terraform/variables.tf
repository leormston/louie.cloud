variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "eu-west-2"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "production"
}

variable "domain_name" {
  description = "Domain name for the portfolio (required for CloudFront)"
  type        = string

  validation {
    condition     = var.domain_name != ""
    error_message = "domain_name must be set (e.g. louie.cloud)."
  }
}

# --- Static site (S3 + CloudFront + contact Lambda) ---

variable "static_site_bucket_name" {
  description = "S3 bucket that holds the built frontend"
  type        = string
  default     = "louie-cloud-site"
}

variable "contact_email" {
  description = "Verified SES identity that sends and receives contact form emails"
  type        = string
  default     = "louie@louie.cloud"
}

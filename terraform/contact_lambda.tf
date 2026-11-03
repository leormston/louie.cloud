# Contact form backend for the static site: one Lambda behind CloudFront.
#
# The function URL uses IAM auth and is only callable by the static site's
# CloudFront distribution (via Origin Access Control). Because CloudFront signs
# the request, the browser must send an `x-amz-content-sha256` header with the
# SHA-256 of the POST body — see src/components/jsx/contact.jsx.

locals {
  contact_function_name = "louie-cloud-contact"
  # Function URL looks like https://abc123.lambda-url.eu-west-2.on.aws/
  contact_function_url_domain = trimsuffix(trimprefix(aws_lambda_function_url.contact.function_url, "https://"), "/")
}

data "archive_file" "contact_lambda" {
  type        = "zip"
  source_dir  = "${path.module}/lambda/contact"
  output_path = "${path.module}/.build/contact-lambda.zip"
}

resource "aws_iam_role" "contact_lambda" {
  name = "${local.contact_function_name}-lambda"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect    = "Allow"
        Principal = { Service = "lambda.amazonaws.com" }
        Action    = "sts:AssumeRole"
      }
    ]
  })
}

resource "aws_iam_role_policy" "contact_lambda" {
  name = "${local.contact_function_name}-lambda"
  role = aws_iam_role.contact_lambda.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid      = "SendContactEmail"
        Effect   = "Allow"
        Action   = ["ses:SendEmail"]
        Resource = "arn:aws:ses:${var.aws_region}:${data.aws_caller_identity.current.account_id}:identity/*"
        Condition = {
          StringEquals = { "ses:FromAddress" = var.contact_email }
        }
      },
      {
        Sid      = "WriteLogs"
        Effect   = "Allow"
        Action   = ["logs:CreateLogStream", "logs:PutLogEvents"]
        Resource = "${aws_cloudwatch_log_group.contact_lambda.arn}:*"
      }
    ]
  })
}

resource "aws_cloudwatch_log_group" "contact_lambda" {
  name              = "/aws/lambda/${local.contact_function_name}"
  retention_in_days = 14
}

resource "aws_lambda_function" "contact" {
  function_name    = local.contact_function_name
  description      = "louie.cloud contact form → SES email"
  role             = aws_iam_role.contact_lambda.arn
  runtime          = "nodejs22.x"
  architectures    = ["arm64"]
  handler          = "index.handler"
  filename         = data.archive_file.contact_lambda.output_path
  source_code_hash = data.archive_file.contact_lambda.output_base64sha256
  memory_size      = 128
  timeout          = 10

  # Caps how many copies can run at once: limits cost/abuse and keeps the
  # in-memory rate limiter meaningful.
  reserved_concurrent_executions = 2

  environment {
    variables = {
      CONTACT_EMAIL = var.contact_email
      SES_REGION    = var.aws_region
    }
  }

  depends_on = [
    aws_cloudwatch_log_group.contact_lambda,
    aws_iam_role_policy.contact_lambda,
  ]
}

resource "aws_lambda_function_url" "contact" {
  function_name      = aws_lambda_function.contact.function_name
  authorization_type = "AWS_IAM"
}

resource "aws_cloudfront_origin_access_control" "contact_lambda" {
  name                              = "louie-cloud-contact-lambda"
  description                       = "CloudFront → contact form Lambda function URL"
  origin_access_control_origin_type = "lambda"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

# Only the static site distribution may call the function URL.
resource "aws_lambda_permission" "contact_cloudfront_url" {
  statement_id           = "AllowCloudFrontInvokeFunctionUrl"
  action                 = "lambda:InvokeFunctionUrl"
  function_name          = aws_lambda_function.contact.function_name
  principal              = "cloudfront.amazonaws.com"
  source_arn             = aws_cloudfront_distribution.static_site.arn
  function_url_auth_type = "AWS_IAM"
}

# Since late 2025, function URLs also need lambda:InvokeFunction for the caller.
resource "aws_lambda_permission" "contact_cloudfront_invoke" {
  statement_id  = "AllowCloudFrontInvokeFunction"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.contact.function_name
  principal     = "cloudfront.amazonaws.com"
  source_arn    = aws_cloudfront_distribution.static_site.arn
}

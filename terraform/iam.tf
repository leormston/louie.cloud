# IAM Role for EC2 Instance
resource "aws_iam_role" "portfolio" {
  name = "portfolio-ec2-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ec2.amazonaws.com"
        }
      }
    ]
  })

  tags = {
    Name = "portfolio-ec2-role"
  }
}

# IAM Policy for EC2 to access Cognito and DynamoDB
resource "aws_iam_role_policy" "portfolio" {
  name = "portfolio-ec2-policy"
  role = aws_iam_role.portfolio.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "cognito-idp:*",
          "cognito-identity:*"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "dynamodb:GetItem",
          "dynamodb:PutItem",
          "dynamodb:UpdateItem",
          "dynamodb:DeleteItem",
          "dynamodb:Query",
          "dynamodb:Scan",
          "dynamodb:BatchGetItem",
          "dynamodb:BatchWriteItem"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:*:*:*"
      },
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject"
        ]
        Resource = "*"
      }
    ]
  })
}

# IAM Instance Profile
resource "aws_iam_instance_profile" "portfolio" {
  name = "portfolio-instance-profile"
  role = aws_iam_role.portfolio.name
}

# IAM User for GitHub Actions (for deployments)
resource "aws_iam_user" "github_actions" {
  name = "github-actions-portfolio-deployer"

  tags = {
    Name = "github-actions-deployer"
  }
}

# Access Key for GitHub Actions
resource "aws_iam_access_key" "github_actions" {
  user = aws_iam_user.github_actions.name
}

# IAM Policy for GitHub Actions
resource "aws_iam_user_policy" "github_actions" {
  name = "github-actions-deploy-policy"
  user = aws_iam_user.github_actions.name

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "ec2:DescribeInstances",
          "ec2:DescribeSecurityGroups"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "ssm:StartSession",
          "ssm:TerminateSession"
        ]
        Resource = [
          "arn:aws:ec2:${var.aws_region}:*:instance/*"
        ]
        Condition = {
          StringEquals = {
            "aws:RequestedRegion" = var.aws_region
          }
        }
      }
    ]
  })
}

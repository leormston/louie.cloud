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

# Note: GitHub Actions IAM user must be created manually
# Run this AWS CLI command first:
# aws iam create-user --user-name github-actions-portfolio
# aws iam create-access-key --user-name github-actions-portfolio
#
# Then add the access key and secret to GitHub secrets:
# AWS_ACCESS_KEY_ID
# AWS_SECRET_ACCESS_KEY

# IAM Policy for GitHub Actions (attach manually to the user created above)
# Use this inline policy:
# {
#   "Version": "2012-10-17",
#   "Statement": [
#     {
#       "Effect": "Allow",
#       "Action": [
#         "ec2:*",
#         "dynamodb:*",
#         "iam:*"
#       ],
#       "Resource": "*"
#     }
#   ]
# }

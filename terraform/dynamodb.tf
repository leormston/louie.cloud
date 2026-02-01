# DynamoDB Tables

# Blog Posts Table
resource "aws_dynamodb_table" "blog_posts" {
  name           = "portfolio-blog-posts"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "id"
  stream_specification {
    stream_view_type = "NEW_AND_OLD_IMAGES"
  }

  attribute {
    name = "id"
    type = "S"
  }

  global_secondary_index {
    name            = "createdAt-index"
    hash_key        = "id"
    range_key       = "createdAt"
    projection_type = "ALL"
  }

  ttl {
    attribute_name = "expiration"
    enabled        = true
  }

  tags = {
    Name = "portfolio-blog-posts"
  }
}

# Testimonials Table
resource "aws_dynamodb_table" "testimonials" {
  name           = "portfolio-testimonials"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "id"
  stream_specification {
    stream_view_type = "NEW_AND_OLD_IMAGES"
  }

  attribute {
    name = "id"
    type = "S"
  }

  global_secondary_index {
    name            = "createdAt-index"
    hash_key        = "approved"
    range_key       = "createdAt"
    projection_type = "ALL"
  }

  attribute {
    name = "approved"
    type = "S"
  }

  attribute {
    name = "createdAt"
    type = "S"
  }

  ttl {
    attribute_name = "expiration"
    enabled        = true
  }

  tags = {
    Name = "portfolio-testimonials"
  }
}

# Optional: Backup for both tables
resource "aws_backup_vault" "portfolio" {
  name = "portfolio-backup-vault"

  tags = {
    Name = "portfolio-backup"
  }
}

resource "aws_backup_plan" "portfolio" {
  name = "portfolio-daily-backup"

  rule {
    rule_name         = "daily_backup"
    target_backup_vault_name = aws_backup_vault.portfolio.name
    schedule          = "cron(0 5 ? * * *)" # 5 AM UTC daily
    start_window      = 60
    completion_window = 120
    lifecycle {
      delete_after = 30 # Keep for 30 days
    }
  }
}

resource "aws_backup_resource_assignment" "blog_posts" {
  backup_plan_id      = aws_backup_plan.portfolio.id
  iam_role_arn        = aws_backup_role.portfolio.arn
  resources           = [aws_dynamodb_table.blog_posts.arn]
  selection_tag_type  = "STRINGEQUALS"
  selection_tag_key   = "Backup"
  selection_tag_value = "daily"
}

resource "aws_backup_resource_assignment" "testimonials" {
  backup_plan_id      = aws_backup_plan.portfolio.id
  iam_role_arn        = aws_backup_role.portfolio.arn
  resources           = [aws_dynamodb_table.testimonials.arn]
  selection_tag_type  = "STRINGEQUALS"
  selection_tag_key   = "Backup"
  selection_tag_value = "daily"
}

resource "aws_iam_role" "backup" {
  name = "portfolio-backup-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "backup.amazonaws.com"
        }
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "backup" {
  role       = aws_iam_role.backup.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSBackupServiceRolePolicyForBackup"
}

resource "aws_iam_role_policy_attachment" "backup_restore" {
  role       = aws_iam_role.backup.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSBackupServiceRolePolicyForRestores"
}

# Cognito User Pool
resource "aws_cognito_user_pool" "portfolio" {
  name = "portfolio-user-pool"

  password_policy {
    minimum_length    = 8
    require_lowercase = true
    require_numbers   = true
    require_symbols   = false
    require_uppercase = true
  }

  auto_verified_attributes = ["email"]

  schema {
    name                = "email"
    attribute_data_type = "String"
    mutable             = true
    required            = true
  }

  schema {
    name                = "name"
    attribute_data_type = "String"
    mutable             = true
  }

  tags = {
    Name = "portfolio-user-pool"
  }
}

# Cognito User Pool Client
resource "aws_cognito_user_pool_client" "portfolio" {
  name         = "portfolio-client"
  user_pool_id = aws_cognito_user_pool.portfolio.id
  explicit_auth_flows = [
    "ALLOW_USER_PASSWORD_AUTH",
    "ALLOW_REFRESH_TOKEN_AUTH"
  ]

  prevent_user_existence_errors = "ENABLED"
}

# Cognito Identity Pool (for AWS credentials)
resource "aws_cognito_identity_pool" "portfolio" {
  identity_pool_name               = "portfolio_identity_pool"
  allow_unauthenticated_identities = false

  cognito_identity_providers {
    client_id     = aws_cognito_user_pool_client.portfolio.id
    provider_name = aws_cognito_user_pool.portfolio.endpoint
  }
}

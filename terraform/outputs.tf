output "instance_id" {
  description = "ID of the EC2 instance"
  value       = aws_instance.portfolio.id
}

output "instance_public_ip" {
  description = "Public IP address of the EC2 instance"
  value       = aws_instance.portfolio.public_ip
}

output "eip_address" {
  description = "Elastic IP address"
  value       = var.enable_eip ? aws_eip.portfolio[0].public_ip : null
}

output "security_group_id" {
  description = "ID of the security group"
  value       = aws_security_group.portfolio.id
}

output "iam_role_name" {
  description = "Name of the IAM role"
  value       = aws_iam_role.portfolio.name
}

output "instance_details" {
  description = "Summary of instance details"
  value = {
    instance_id    = aws_instance.portfolio.id
    public_ip      = aws_instance.portfolio.public_ip
    instance_type  = aws_instance.portfolio.instance_type
    security_group = aws_security_group.portfolio.id
    ssh_command    = "ssh -i <your-key.pem> ubuntu@${aws_instance.portfolio.public_ip}"
  }
}

output "connect_to_instance" {
  description = "SSH command to connect to the instance"
  value       = "ssh -i <your-key.pem> ubuntu@${var.enable_eip ? aws_eip.portfolio[0].public_ip : aws_instance.portfolio.public_ip}"
}

output "dynamodb_blog_table" {
  description = "Name of the DynamoDB blog posts table"
  value       = aws_dynamodb_table.blog_posts.name
}

output "dynamodb_testimonials_table" {
  description = "Name of the DynamoDB testimonials table"
  value       = aws_dynamodb_table.testimonials.name
}

output "dynamodb_tables" {
  description = "Summary of DynamoDB tables"
  value = {
    blog_posts_table   = aws_dynamodb_table.blog_posts.name
    blog_posts_arn     = aws_dynamodb_table.blog_posts.arn
    testimonials_table = aws_dynamodb_table.testimonials.name
    testimonials_arn   = aws_dynamodb_table.testimonials.arn
  }
}

output "cognito_user_pool_id" {
  description = "Cognito User Pool ID"
  value       = aws_cognito_user_pool.portfolio.id
}

output "cognito_client_id" {
  description = "Cognito Client ID"
  value       = aws_cognito_user_pool_client.portfolio.id
}

output "cognito_identity_pool_id" {
  description = "Cognito Identity Pool ID"
  value       = aws_cognito_identity_pool.portfolio.id
}

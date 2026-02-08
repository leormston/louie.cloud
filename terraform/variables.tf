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

variable "instance_type" {
  description = "EC2 instance type"
  type        = string
  default     = "t3.micro"
}

variable "instance_name" {
  description = "Name of the EC2 instance"
  type        = string
  default     = "portfolio-server"
}

variable "app_port" {
  description = "Port for the application"
  type        = number
  default     = 3000
}

variable "domain_name" {
  description = "Domain name for the portfolio"
  type        = string
  default     = ""
}

variable "enable_eip" {
  description = "Enable Elastic IP for the instance"
  type        = bool
  default     = true
}

variable "key_pair_name" {
  description = "Name of the existing EC2 key pair for SSH access"
  type        = string
}

variable "volume_size" {
  description = "Root volume size in GB"
  type        = number
  default     = 30
}

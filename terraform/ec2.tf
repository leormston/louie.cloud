# Security Group
resource "aws_security_group" "portfolio" {
  name        = "portfolio-sg"
  description = "Security group for portfolio application"

  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = var.app_port
    to_port     = var.app_port
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "portfolio-sg"
  }
}

# EC2 Instance
resource "aws_instance" "portfolio" {
  ami                    = data.aws_ami.ubuntu.id
  instance_type          = var.instance_type
  key_name               = var.key_pair_name
  vpc_security_group_ids = [aws_security_group.portfolio.id]
  iam_instance_profile   = aws_iam_instance_profile.portfolio.name

  root_block_device {
    volume_type           = "gp3"
    volume_size           = var.volume_size
    delete_on_termination = true
    encrypted             = true
  }

  user_data = base64encode(templatefile("${path.module}/user_data.sh", {
    app_port = var.app_port
  }))

  monitoring              = true
  associate_public_ip_address = true

  tags = {
    Name = var.instance_name
  }

  depends_on = [aws_iam_instance_profile.portfolio]
}

# Elastic IP
resource "aws_eip" "portfolio" {
  count    = var.enable_eip ? 1 : 0
  instance = aws_instance.portfolio.id
  domain   = "vpc"

  tags = {
    Name = "portfolio-eip"
  }

  depends_on = [aws_instance.portfolio]
}

# Data source for Ubuntu AMI
data "aws_ami" "ubuntu" {
  most_recent = true
  owners      = ["099720109477"] # Canonical

  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd/ubuntu-jammy-22.04-amd64-server-*"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}

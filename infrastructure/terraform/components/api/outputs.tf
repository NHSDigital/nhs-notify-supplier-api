output "api_urll" {
  value = aws_api_gateway_stage.main.invoke_url
}

output "deployment" {
  description = "Deployment details used for post-deployment scripts"
  value = {
    aws_region     = var.region
    aws_account_id = var.aws_account_id
    project        = var.project
    environment    = var.environment
    group          = var.group
    component      = var.component
    commit_id      = var.commit_id
  }
}

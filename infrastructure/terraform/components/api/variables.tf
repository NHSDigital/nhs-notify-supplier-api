##
# Basic Required Variables for tfscaffold Components
##

variable "project" {
  type        = string
  description = "The name of the tfscaffold project"
}

variable "environment" {
  type        = string
  description = "The name of the tfscaffold environment"
}

variable "aws_account_id" {
  type        = string
  description = "The AWS Account ID (numeric)"
}

variable "region" {
  type        = string
  description = "The AWS Region"
}

variable "group" {
  type        = string
  description = "The group variables are being inherited from (often synonmous with account short-name)"
}

##
# tfscaffold variables specific to this component
##

# This is the only primary variable to have its value defined as
# a default within its declaration in this file, because the variables
# purpose is as an identifier unique to this component, rather
# then to the environment from where all other variables come.
variable "component" {
  type        = string
  description = "The variable encapsulating the name of this component"
  default     = "supapi"
}

variable "default_tags" {
  type        = map(string)
  description = "A map of default tags to apply to all taggable resources within the component"
  default     = {}
}

##
# Variables specific to the component
##

variable "kms_deletion_window" {
  type        = string
  description = "When a kms key is deleted, how long should it wait in the pending deletion state?"
  default     = "30"
}

variable "log_retention_in_days" {
  type        = number
  description = "The retention period in days for the Cloudwatch Logs events to be retained, default of 0 is indefinite"
  default     = 0
}

variable "log_level" {
  type        = string
  description = "The log level to be used in lambda functions within the component. Any log with a lower severity than the configured value will not be logged: https://docs.python.org/3/library/logging.html#levels"
  default     = "INFO"
}

variable "force_lambda_code_deploy" {
  type        = bool
  description = "If the lambda package in s3 has the same commit id tag as the terraform build branch, the lambda will not update automatically. Set to True if making changes to Lambda code from on the same commit for example during development"
  default     = false
}

variable "parent_acct_environment" {
  type        = string
  description = "Name of the environment responsible for the acct resources used, affects things like DNS zone. Useful for named dev environments"
  default     = "main"
}

variable "shared_infra_account_id" {
  type        = string
  description = "The AWS Account ID of the shared infrastructure account"
  default     = "000000000000"
}

variable "manually_configure_mtls_truststore" {
  type        = bool
  description = "Manually manage the truststore used for API Gateway mTLS (e.g. for prod environment)"
  default     = false
}

variable "enable_backups" {
  type        = bool
  description = "Enable backups"
  default     = false
}

variable "ca_pem_filename" {
  type        = string
  description = "Filename for the CA truststore file within the s3 bucket"
  default     = null
}

variable "force_destroy" {
  type        = bool
  description = "Flag to force deletion of S3 buckets"
  default     = false
}

variable "letter_table_ttl_hours" {
  type        = number
  description = "Number of hours to set as TTL on letters table"
  default     = 24
}

variable "max_get_limit" {
  type        = number
  description = "Default limit to apply to GET requests that support pagination"
  default     = 2500
}

variable "eventpub_data_plane_bus_arn" {
  type        = string
  description = "ARN of the EventBridge data plane bus for eventpub"
  default     = ""
}

variable "eventpub_control_plane_bus_arn" {
  type        = string
  description = "ARN of the EventBridge control plane bus for eventpub"
  default     = ""
}

variable "letter_variant_map" {
  type = map(object({ supplierId = string, specId = string }))
  default = {
    "lv1" = { supplierId = "supplier1", specId = "spec1" },
    "lv2" = { supplierId = "supplier1", specId = "spec2" },
    "lv3" = { supplierId = "supplier2", specId = "spec3" }
  }
}

variable "core_account_id" {
  type        = string
  description = "AWS Account ID for Core"
  default     = "000000000000"
}

variable "core_environment" {
  type        = string
  description = "Environment of Core"
  default     = "prod"

}

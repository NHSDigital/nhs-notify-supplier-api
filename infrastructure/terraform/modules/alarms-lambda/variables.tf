variable "alarm_prefix" {
  type = string
}

variable "function_name" {
  type = string
}

variable "log_group_name" {
  type    = string
  default = ""
}

variable "tags" {
  type    = map(string)
  default = {}
}

variable "period_seconds" {
  type    = number
  default = 300
}

variable "evaluation_periods" {
  type    = number
  default = 1
}

variable "errors_threshold" {
  type    = number
  default = 0
}

variable "throttles_threshold" {
  type    = number
  default = 0
}

variable "enable_error_log_metric" {
  type    = bool
  default = true
}

variable "error_log_metric_namespace" {
  type    = string
  default = "Custom/LambdaErrorLogs"
}

variable "error_log_metric_name_prefix" {
  type    = string
  default = "LambdaErrorLogs-"
}

variable "error_log_metric_filter_pattern" {
  type    = string
  default = "{ ($.level = \"50\" || $.level = \"error\") && $.environment = * }"
}

variable "error_log_threshold" {
  type    = number
  default = 0
}

variable "error_log_evaluation_periods" {
  type    = number
  default = 1
}

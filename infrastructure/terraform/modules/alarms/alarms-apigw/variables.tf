variable "alarm_prefix" {
  type = string
}

variable "api_name" {
  type = string
}

variable "stage_name" {
  type = string
}

variable "tags" {
  type    = map(string)
  default = {}
}

variable "error_5xx_threshold" {
  type    = number
  default = 0
}

variable "error_5xx_period_seconds" {
  type    = number
  default = 60
}

variable "error_5xx_evaluation_periods" {
  type    = number
  default = 1
}

variable "latency_threshold_ms" {
  type    = number
  default = 29000
}

variable "latency_period_seconds" {
  type    = number
  default = 60
}

variable "latency_evaluation_periods" {
  type    = number
  default = 5
}

variable "latency_datapoints_to_alarm" {
  type    = number
  default = 3
}

variable "latency_anomaly_sensitivity" {
  type    = number
  default = 2
}

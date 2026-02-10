variable "alarm_prefix" {
  type = string
}

variable "queue_name" {
  type = string
}

variable "dlq_queue_name" {
  type    = string
  default = null
}

variable "tags" {
  type    = map(string)
  default = {}
}

variable "age_period_seconds" {
  type    = number
  default = 60
}

variable "age_anomaly_sensitivity" {
  type    = number
  default = 2
}

variable "age_anomaly_evaluation_periods" {
  type    = number
  default = 5
}

variable "age_anomaly_datapoints_to_alarm" {
  type    = number
  default = 3
}

variable "dlq_visible_threshold" {
  type    = number
  default = 0
}

variable "alarm_prefix" {
  type = string
}

variable "queue_name" {
  type = string
}

variable "tags" {
  type    = map(string)
  default = {}
}

variable "age_period_seconds" {
  type    = number
  default = 300
}

variable "age_threshold_seconds" {
  type    = number
  default = 30
}

variable "age_anomaly_evaluation_periods" {
  type    = number
  default = 3
}

variable "age_anomaly_datapoints_to_alarm" {
  type    = number
  default = 3
}

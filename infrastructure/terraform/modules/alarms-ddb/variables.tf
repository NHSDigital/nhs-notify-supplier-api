variable "alarm_prefix" {
  type = string
}

variable "table_name" {
  type = string
}

variable "tags" {
  type    = map(string)
  default = {}
}

variable "period_seconds" {
  type    = number
  default = 60
}

variable "evaluation_periods" {
  type    = number
  default = 1
}

variable "read_throttle_threshold" {
  type    = number
  default = 0
}

variable "write_throttle_threshold" {
  type    = number
  default = 0
}

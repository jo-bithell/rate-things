variable "name_prefix" {
  type = string
}

variable "location" {
  type = string
}

variable "resource_group_name" {
  type = string
}

variable "tags" {
  type    = map(string)
  default = {}
}

variable "jwt_signing_key" {
  type      = string
  sensitive = true
}

variable "cosmos_connection_string" {
  type      = string
  sensitive = true
}

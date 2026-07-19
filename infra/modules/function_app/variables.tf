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

variable "cosmos_connection_string_secret_uri" {
  type = string
}

variable "jwt_signing_key_secret_uri" {
  type = string
}

variable "key_vault_id" {
  type = string
}

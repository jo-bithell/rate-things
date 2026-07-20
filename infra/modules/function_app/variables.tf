variable "name_prefix" {
  type = string
}

variable "location" {
  type = string
}

variable "compute_location" {
  description = "Region for the App Service Plan and Function App specifically. May differ from `location` (used for storage/monitoring/everything else) when compute quota for the Y1 plan isn't available in the primary region."
  type        = string
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

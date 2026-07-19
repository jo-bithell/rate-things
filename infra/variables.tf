variable "environment" {
  description = "Environment name (dev, prod, etc.) used in resource naming."
  type        = string
}

variable "location" {
  description = "Azure region for all resources."
  type        = string
  default     = "eastus"
}

variable "project_name" {
  description = "Short project name used as a naming prefix."
  type        = string
  default     = "ratethings"
}

variable "jwt_signing_key" {
  description = "Symmetric key used to sign JWTs. Generate a strong random value and pass via TF_VAR_jwt_signing_key or a tfvars file kept out of source control."
  type        = string
  sensitive   = true
}

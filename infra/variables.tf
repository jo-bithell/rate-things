variable "environment" {
  description = "Environment name (dev, prod, etc.) used in resource naming."
  type        = string
}

variable "location" {
  description = "Azure region for all resources. Must be a region that supports Microsoft.Web/staticSites (currently centralus, eastus2, westus2, westeurope, eastasia)."
  type        = string
  default     = "eastus2"
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

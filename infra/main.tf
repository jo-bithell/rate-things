locals {
  name_prefix = "${var.project_name}-${var.environment}"
  tags = {
    project     = var.project_name
    environment = var.environment
    managed_by  = "terraform"
  }
  function_app_compute_location = var.function_app_compute_location != "" ? var.function_app_compute_location : var.location
}

module "resource_group" {
  source   = "./modules/resource_group"
  name     = "${local.name_prefix}-rg"
  location = var.location
  tags     = local.tags
}

module "cosmos_db" {
  source              = "./modules/cosmos_db"
  name_prefix         = local.name_prefix
  location            = var.location
  resource_group_name = module.resource_group.name
  tags                = local.tags
}

module "key_vault" {
  source                    = "./modules/key_vault"
  name_prefix                = local.name_prefix
  location                   = var.location
  resource_group_name        = module.resource_group.name
  tags                       = local.tags
  jwt_signing_key            = var.jwt_signing_key
  cosmos_connection_string   = module.cosmos_db.primary_sql_connection_string
}

module "function_app" {
  source                              = "./modules/function_app"
  name_prefix                         = local.name_prefix
  location                            = var.location
  compute_location                    = local.function_app_compute_location
  resource_group_name                 = module.resource_group.name
  tags                                = local.tags
  cosmos_connection_string_secret_uri = module.key_vault.cosmos_connection_string_secret_uri
  jwt_signing_key_secret_uri          = module.key_vault.jwt_signing_key_secret_uri
  key_vault_id                        = module.key_vault.id
}

module "static_web_app" {
  source              = "./modules/static_web_app"
  name_prefix         = local.name_prefix
  location            = var.location
  resource_group_name = module.resource_group.name
  tags                = local.tags
  function_app_id     = module.function_app.function_app_id
}

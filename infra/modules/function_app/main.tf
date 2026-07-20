data "azurerm_client_config" "current" {}

resource "random_string" "storage_suffix" {
  length  = 6
  special = false
  upper   = false
}

resource "azurerm_storage_account" "this" {
  name                     = "${replace(var.name_prefix, "-", "")}fn${random_string.storage_suffix.result}"
  resource_group_name      = var.resource_group_name
  location                 = var.location
  account_tier             = "Standard"
  account_replication_type = "LRS"
  tags                     = var.tags
}

resource "azurerm_log_analytics_workspace" "this" {
  name                = "${var.name_prefix}-law"
  location            = var.location
  resource_group_name = var.resource_group_name
  sku                 = "PerGB2018"
  retention_in_days   = 30
  tags                = var.tags
}

resource "azurerm_application_insights" "this" {
  name                = "${var.name_prefix}-appi"
  location            = var.location
  resource_group_name = var.resource_group_name
  workspace_id        = azurerm_log_analytics_workspace.this.id
  application_type    = "web"
  tags                = var.tags
}

resource "azurerm_service_plan" "this" {
  name                = "${var.name_prefix}-plan"
  location            = var.compute_location
  resource_group_name = var.resource_group_name
  os_type             = "Linux"
  sku_name            = "Y1" # Consumption plan
  tags                = var.tags
}

resource "azurerm_linux_function_app" "this" {
  name                = "${var.name_prefix}-func"
  location            = var.compute_location
  resource_group_name = var.resource_group_name
  service_plan_id     = azurerm_service_plan.this.id

  storage_account_name       = azurerm_storage_account.this.name
  storage_account_access_key = azurerm_storage_account.this.primary_access_key

  tags = var.tags

  identity {
    type = "SystemAssigned"
  }

  site_config {
    application_insights_connection_string = azurerm_application_insights.this.connection_string
    application_insights_key               = azurerm_application_insights.this.instrumentation_key

    application_stack {
      dotnet_version              = "10.0"
      use_dotnet_isolated_runtime = true
    }

    # No cors block: the Static Web App reaches this API through its linked-backend
    # proxy (see azurerm_static_web_app_function_app_registration), which is a
    # server-to-server call and isn't subject to browser CORS. Leaving this open
    # would let any origin call the API directly with a stolen/guessed token.
  }

  app_settings = {
    FUNCTIONS_WORKER_RUNTIME   = "dotnet-isolated"
    CosmosDb__ConnectionString = "@Microsoft.KeyVault(SecretUri=${var.cosmos_connection_string_secret_uri})"
    Jwt__SigningKey            = "@Microsoft.KeyVault(SecretUri=${var.jwt_signing_key_secret_uri})"
    Jwt__Issuer                = "ratethings-api"
    Jwt__Audience              = "ratethings-client"
  }

  lifecycle {
    ignore_changes = [
      app_settings["WEBSITE_RUN_FROM_PACKAGE"],
    ]
  }
}

# This access policy can only be created after the function app exists (it needs
# the app's managed-identity principal_id), which means on first-ever deploy the
# app_settings above may briefly fail to resolve their @Microsoft.KeyVault(...)
# references. Azure retries resolution automatically; restart the app once post-
# deploy if it doesn't pick them up on its own.
resource "azurerm_key_vault_access_policy" "function_app" {
  key_vault_id = var.key_vault_id
  tenant_id    = data.azurerm_client_config.current.tenant_id
  object_id    = azurerm_linux_function_app.this.identity[0].principal_id

  secret_permissions = ["Get", "List"]
}

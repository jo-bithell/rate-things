resource "random_string" "cosmos_suffix" {
  length  = 4
  special = false
  upper   = false
}

resource "azurerm_cosmosdb_account" "this" {
  name                = "${var.name_prefix}-cosmos-${random_string.cosmos_suffix.result}"
  location            = var.location
  resource_group_name = var.resource_group_name
  offer_type          = "Standard"
  kind                = "GlobalDocumentDB"
  tags                = var.tags

  capabilities {
    name = "EnableServerless"
  }

  consistency_policy {
    consistency_level = "Session"
  }

  geo_location {
    location          = var.location
    failover_priority = 0
  }
}

resource "azurerm_cosmosdb_sql_database" "this" {
  name                = "ratethings"
  resource_group_name = var.resource_group_name
  account_name        = azurerm_cosmosdb_account.this.name
}

resource "azurerm_cosmosdb_sql_container" "users" {
  name                = "users"
  resource_group_name = var.resource_group_name
  account_name        = azurerm_cosmosdb_account.this.name
  database_name       = azurerm_cosmosdb_sql_database.this.name
  partition_key_paths = ["/id"]

  unique_key {
    paths = ["/email"]
  }
}

resource "azurerm_cosmosdb_sql_container" "topics" {
  name                = "topics"
  resource_group_name = var.resource_group_name
  account_name        = azurerm_cosmosdb_account.this.name
  database_name       = azurerm_cosmosdb_sql_database.this.name
  partition_key_paths = ["/id"]
}

resource "azurerm_cosmosdb_sql_container" "entities" {
  name                = "entities"
  resource_group_name = var.resource_group_name
  account_name        = azurerm_cosmosdb_account.this.name
  database_name       = azurerm_cosmosdb_sql_database.this.name
  partition_key_paths = ["/topicId"]

  indexing_policy {
    included_path {
      path = "/*"
    }
    # tags is an array of strings; default indexing already covers it via /*,
    # kept explicit here for clarity on what powers tag filtering.
    included_path {
      path = "/tags/*"
    }
  }
}

resource "azurerm_cosmosdb_sql_container" "lists" {
  name                = "lists"
  resource_group_name = var.resource_group_name
  account_name        = azurerm_cosmosdb_account.this.name
  database_name       = azurerm_cosmosdb_sql_database.this.name
  partition_key_paths = ["/ownerId"]
}

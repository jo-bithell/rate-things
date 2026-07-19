output "endpoint" {
  value = azurerm_cosmosdb_account.this.endpoint
}

output "primary_sql_connection_string" {
  value     = azurerm_cosmosdb_account.this.primary_sql_connection_string
  sensitive = true
}

output "account_name" {
  value = azurerm_cosmosdb_account.this.name
}

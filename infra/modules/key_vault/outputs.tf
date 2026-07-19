output "id" {
  value = azurerm_key_vault.this.id
}

output "name" {
  value = azurerm_key_vault.this.name
}

# Versionless URIs so app_settings Key Vault references auto-roll to the latest secret version.
output "jwt_signing_key_secret_uri" {
  value = azurerm_key_vault_secret.jwt_signing_key.versionless_id
}

output "cosmos_connection_string_secret_uri" {
  value = azurerm_key_vault_secret.cosmos_connection_string.versionless_id
}

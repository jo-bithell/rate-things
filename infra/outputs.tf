output "resource_group_name" {
  value = module.resource_group.name
}

output "cosmos_account_endpoint" {
  value = module.cosmos_db.endpoint
}

output "function_app_default_hostname" {
  value = module.function_app.default_hostname
}

output "static_web_app_default_hostname" {
  value = module.static_web_app.default_hostname
}

output "static_web_app_api_key" {
  value     = module.static_web_app.api_key
  sensitive = true
}

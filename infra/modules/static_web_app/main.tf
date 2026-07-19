# Standard SKU is required to link a "bring your own" Functions backend.
resource "azurerm_static_web_app" "this" {
  name                = "${var.name_prefix}-swa"
  location            = var.location
  resource_group_name = var.resource_group_name
  sku_tier            = "Standard"
  sku_size            = "Standard"
  tags                = var.tags
}

resource "azurerm_static_web_app_function_app_registration" "this" {
  static_web_app_id = azurerm_static_web_app.this.id
  function_app_id   = var.function_app_id
}

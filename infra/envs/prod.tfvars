environment  = "prod"
location     = "eastus2"
project_name = "ratethings"
# App Service compute quota on this subscription is only granted in eastus, not
# eastus2 (Static Web Apps isn't available in eastus at all, hence the split).
function_app_compute_location = "eastus"
# jwt_signing_key should be supplied via TF_VAR_jwt_signing_key, not committed here.

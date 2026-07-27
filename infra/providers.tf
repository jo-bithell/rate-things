terraform {
  required_version = ">= 1.7.0"

  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 4.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.6"
    }
  }

  # storage_account_name and key are supplied via `terraform init -backend-config=...`
  # so the same config can target a different state file per environment.
  backend "azurerm" {
    resource_group_name = "ratethings-tfstate-rg"
    container_name      = "tfstate"
  }
}

provider "azurerm" {
  features {
    key_vault {
      purge_soft_delete_on_destroy    = true
      recover_soft_deleted_key_vaults = true
    }
  }
}

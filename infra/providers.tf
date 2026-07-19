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

  # Configure a remote backend before running `terraform init` in a real environment, e.g.:
  # backend "azurerm" {
  #   resource_group_name  = "ratethings-tfstate-rg"
  #   storage_account_name = "ratethingstfstate"
  #   container_name       = "tfstate"
  #   key                  = "ratethings.tfstate"
  # }
}

provider "azurerm" {
  features {
    key_vault {
      purge_soft_delete_on_destroy    = true
      recover_soft_deleted_key_vaults = true
    }
  }
}

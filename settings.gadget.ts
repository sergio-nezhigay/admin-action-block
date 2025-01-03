import type { GadgetSettings } from "gadget-server";

export const settings: GadgetSettings = {
  type: "gadget/settings/v1",
  frameworkVersion: "v1.3.0",
  plugins: {
    connections: {
      shopify: {
        apiVersion: "2024-07",
        enabledModels: [
          "shopifyBulkOperation",
          "shopifyCustomer",
          "shopifyCustomerAddress",
          "shopifyFile",
          "shopifyOrder",
          "shopifyProduct",
          "shopifyProductImage",
          "shopifyProductMedia",
          "shopifyProductOption",
          "shopifyProductVariant",
          "shopifyProductVariantMedia",
        ],
        type: "partner",
        scopes: [
          "read_orders",
          "read_products",
          "read_customers",
          "write_pixels",
          "read_customer_events",
          "read_payment_customizations",
          "write_payment_customizations",
          "write_products",
          "read_files",
          "write_files",
          "read_customer_merge",
          "write_orders",
          "unauthenticated_read_customers",
          "unauthenticated_write_customers",
        ],
      },
      openai: true,
    },
  },
};

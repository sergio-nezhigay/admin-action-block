import { Products } from 'api/types';
import Shopify from 'shopify-api-node';
import transliterate from './transliterate';
import fetchChatGPT from './fetchChatGPT';
import parseGeneratedDescription from './parseGeneratedDescription';
import preparePrompt from './preparePrompt';

export default async function createProducts({
  shopify,
  products,
}: {
  shopify: Shopify;
  products: Products;
}) {
  const createProductQuery = `
      mutation CreateProductWithMedia(
      $input: ProductInput!,
      $media: [CreateMediaInput!]!
    )  {
        productCreate(
            input: $input,
            media: $media
        ) {
            product {
                id
                title
                variants(first: 1) {
                    edges {
                        node {
                            id
                        }
                    }
                }
            },
            userErrors {
                field
                message
                }
            }
      }
    `;
  const updateVariantQuery = `
    mutation UpdateProductVariant(
      $input: ProductVariantInput!
    ) {
      productVariantUpdate(input: $input) {
        productVariant {
          id
          price
          sku
          inventoryQuantity
        }
        userErrors {
          field
          message
        }
      }
    }
  `;

  const createdProducts = [];

  for (const product of products) {
    const handle = transliterate(product.title);
    const prompt = preparePrompt(product.title, product.description);
    const response = (await fetchChatGPT(prompt)) || '';
    const { title, html } = parseGeneratedDescription(response);

    const media = product.pictures.map((picture) => ({
      mediaContentType: 'IMAGE',
      originalSource: picture,
    }));
    const variables = {
      input: {
        title: title,
        vendor: product.vendor,
        descriptionHtml: html || null,
        handle,
      },
      media,
    };

    const { productCreate } = await shopify.graphql(
      createProductQuery,
      variables
    );

    if (!productCreate?.product) {
      throw new Error('Failed to create one or more products.');
    }

    const variantId = productCreate.product.variants.edges[0].node.id;
    const variables2 = {
      input: {
        id: variantId,
        price: product.price || 0,
        barcode: product.part_number || '',
      },
    };
    const { productVariantUpdate } = await shopify.graphql(
      updateVariantQuery,
      variables2
    );

    if (!productVariantUpdate?.productVariant) {
      throw new Error('Failed to update variant.');
    }
    createdProducts.push(productCreate.product);
  }

  return {
    message: 'Products created successfully',
    createdProducts,
  };
}

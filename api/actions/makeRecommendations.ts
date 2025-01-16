import { updateMetafield } from '../utilities';
import { findSimilarProducts } from '../utilities/findSimilarProducts';

export const run: ActionRun = async ({ api, connections }) => {
  const allRecords = [];
  const pauseDuration = 1000;
  const shopify = await connections.shopify.forShopId('86804627772');

  let records = await api.shopifyProduct.findMany({
    first: 200,
    select: {
      id: true,
      title: true,
      body: true,
      vendor: true,
      specificationsType: true,
      specificationsProperties: true,
      specificationsFrequency: true,
      variants: { edges: { node: { price: true, barcode: true } } },
    },
    filter: {
      specificationsType: { startsWith: 'DDR1' },
    },
  });
  while (records.hasNextPage) {
    console.log('Pausing before fetching the next batch...');
    await new Promise((resolve) => setTimeout(resolve, pauseDuration));

    records = await records.nextPage();
    allRecords.push(...records);
  }
  const products = allRecords.map((record) => ({
    id: record.id,
    title: record.title || '',
    body: record.body || '',
    vendor: record.vendor || '',
    barcode: record.variants.edges[0]?.node.barcode || '',
    price: record.variants.edges[0]?.node.price || 0,
    specificationsType: record.specificationsType,
    specificationsProperties: record.specificationsProperties,
    specificationsFrequency: record.specificationsFrequency,
  }));
  console.log('🚀 ~ products:', products);

  for (const product of products) {
    const similarProducts = await findSimilarProducts({ product, api });
    console.log('🚀 ~ similarProducts:', similarProducts);
    const relatedProductReferences = similarProducts.map(
      (similarProduct) => `\"gid://shopify/Product/${similarProduct.id}\"`
    );
    const variables = {
      metafields: [
        {
          ownerId: `gid://shopify/Product/${product.id}`,
          namespace: 'shopify--discovery--product_recommendation',
          key: 'related_products',
          value: `[${relatedProductReferences.join(', ')}]`,
          type: 'list.product_reference',
        },
      ],
    };
    await updateMetafield({
      shopify,
      variables,
    });
    await new Promise((resolve) => setTimeout(resolve, pauseDuration));
  }

  console.log('All products have been processed.', allRecords.length);
};

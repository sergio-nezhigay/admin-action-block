// http://api.brain.com.ua/products/categoryID/SID [?vendorID=vendorID] [&search=search] [&filterID=filterID] [&filters[]=filterID] [&limit=limit] [&offset=offset] [&sortby=field_name] [&order=order] [&lang=lang]

import { FetchingFunc } from 'api/types';
import { brainRequest } from './brainRequest';
import { fetchBrainProduct } from './fetchBrainProduct';
import { fetchBrainProductsPictures } from './fetchBrainProductsPictures';
import { fetchBrainProductsContent } from './fetchBrainProductsContent';

export async function fetchBrainProducts({ query, limit, page }: FetchingFunc) {
  console.log('🚀 ~ fetchBrainProducts:', { query, limit, page });
  const categoryID = '1181';

  const { result } = await brainRequest({
    url: `http://api.brain.com.ua/products/${categoryID}`,
    params: {
      searchString: query,
      limit,
      offset: page,
    },
  });

  console.log(
    '===== LOG START =====',
    new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  );
  console.log('result:', JSON.stringify(result, null, 4));

  const products = result?.list.map((product: any) => {
    const pictures = product?.large_image ? [product?.large_image] : [];
    return {
      id: product.productID,
      price: product.price,
      name: product.name,
      description: product.brief_description,
      pictures: pictures,
      part_number: product.articul,
      vendor: 'Test',
      instock: 0,
      warranty: product.warranty,
    };
  });
  const test = await fetchBrainProductsContent([products[0].id]);
  console.log('🚀 ~ test:', test);

  return { products: products, count: products.length };
}

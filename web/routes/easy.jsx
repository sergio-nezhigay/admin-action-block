import {
  Divider,
  Page,
  Banner,
  Pagination,
  BlockStack,
  Select,
  Spinner,
} from '@shopify/polaris';
import { useState, useEffect } from 'react';
import ProductList from '../components/ProductList';
import { easybuyCategories } from '../data/easybuyCategories';

export default function Easy() {
  const [products, setProducts] = useState([]);
  const [productError, setProductError] = useState(null);
  const [totalItems, setTotalItems] = useState(0);
  const [debouncedQuery, setDebouncedQuery] = useState('кабель');
  const [page, setPage] = useState(1);

  const [loading, setLoading] = useState(false);
  const itemsPerPage = 7;
  //  const categoriesAndValues = easybuyCategories.map(({ value, label }) => ({
  //    value,
  //    label: `${label}: ${value}`,
  //  }));
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setProductError(null);
        setLoading(true);
        const response = await fetch(
          `/easy-products?query=${debouncedQuery}&page=${page}&limit=${itemsPerPage}`
        );
        const result = await response.json();

        if (response.ok) {
          setProducts(result.products);
          setTotalItems(result.count);
        } else {
          setProductError('Failed to fetch products. ' + result.error);
        }
      } catch (error) {
        console.log('🚀 ~ error:', error);
        setProductError('Error fetching products.');
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [page, debouncedQuery]);

  return (
    <Page>
      <BlockStack gap='500'>
        {/*<Select
          label='Select Category'
          options={categoriesAndValues}
          value={category}
          onChange={(value) => {
            setCategory(value);
            setPage(1);
          }}
        />
        <Divider borderColor='border' />*/}
        {productError && (
          <Banner title='Error' status='critical'>
            {productError.message}
          </Banner>
        )}
        <Pagination
          hasPrevious={page > 1}
          hasNext={page * itemsPerPage < totalItems}
          onPrevious={() => setPage(page - 1)}
          onNext={() => setPage(page + 1)}
        />
        <ProductList
          products={products}
          debouncedQuery={debouncedQuery}
          setDebouncedQuery={setDebouncedQuery}
        />
        {loading && (
          <div style={{ textAlign: 'center', marginTop: '20px' }}>
            <Spinner size='large' />
          </div>
        )}
      </BlockStack>
    </Page>
  );
}

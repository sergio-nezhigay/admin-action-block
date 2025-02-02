import { useEffect, useState } from 'react';
import {
  BlockStack,
  InlineStack,
  TextField,
  Select,
  ProgressIndicator,
  Button,
  Text,
} from '@shopify/ui-extensions-react/admin';
import {
  NovaPoshtaWarehouse,
  updateWarehouse,
} from '../../shared/shopifyOperations';
import useNovaposhtaApiKey from './useNovaposhtaApiKey';

type City = { Ref: string; Description: string; AreaDescription: string };
type Warehouse = { Ref: string; Description: string };

const API_URL = 'https://api.novaposhta.ua/v2.0/json/';
const isSingleWord = (str: string) => str.trim().split(/\s+/).length === 1;

const fetchData = async (payload: any) => {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return response.json();
};

const useCitySuggestions = (
  searchQuery: string,
  apiKey: string | null,
  setChosenCityRef: any
) => {
  const [cityOptions, setCityOptions] = useState<City[]>([]);
  const [isLoading, setLoading] = useState(false);

  useEffect(() => {
    if (!apiKey || !searchQuery.trim()) {
      setCityOptions([]);
      return;
    }

    const fetchCities = async () => {
      setLoading(true);
      try {
        const { data } = await fetchData({
          modelName: 'Address',
          calledMethod: 'getCities',
          methodProperties: { FindByString: searchQuery },
          apiKey,
        });
        setCityOptions(data || []);
        setChosenCityRef(data?.length ? data[0].Ref : null);
      } catch (error) {
        console.error('Failed to fetch cities', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCities();
  }, [searchQuery, apiKey]);

  return { cityOptions, isLoading };
};

const useWarehouseSuggestions = (
  chosenCityRef: string | null,
  apiKey: string | null,
  setChosenWarehouseRef: any,
  novaPoshtaWarehouseRef?: string | null
) => {
  const [warehouseOptions, setWarehouseOptions] = useState<Warehouse[]>([]);
  const [isLoading, setLoading] = useState(false);

  useEffect(() => {
    if (!chosenCityRef || !apiKey) {
      setWarehouseOptions([]);
      return;
    }

    const fetchWarehouses = async () => {
      setLoading(true);
      try {
        const { data } = await fetchData({
          modelName: 'AddressGeneral',
          calledMethod: 'getWarehouses',
          methodProperties: { CityRef: chosenCityRef },
          apiKey,
        });
        setWarehouseOptions(data || []);

        let newRef: string | null = null;
        if (data?.length === 1) {
          newRef = data[0].Ref;
        } else if (novaPoshtaWarehouseRef) {
          const matchedWarehouse = data?.find(
            (w) => w.Ref === novaPoshtaWarehouseRef
          );
          if (matchedWarehouse) {
            newRef = novaPoshtaWarehouseRef;
          }
        }
        setChosenWarehouseRef(newRef);
      } catch (error) {
        console.error('Failed to fetch warehouses', error);
      } finally {
        setLoading(false);
      }
    };

    fetchWarehouses();
  }, [chosenCityRef, apiKey, novaPoshtaWarehouseRef]);

  return { warehouseOptions, isLoading };
};

export default function NovaPoshtaSelector({
  novaPoshtaWarehouse,
  setNovaPoshtaWarehouse,
  orderId,
}: {
  novaPoshtaWarehouse?: NovaPoshtaWarehouse;
  setNovaPoshtaWarehouse: (warehouse: NovaPoshtaWarehouse) => void;
  orderId: string;
}) {
  const [editModeActive, setEditModeActive] = useState(false);

  const [searchQuery, setSearchQuery] = useState(
    novaPoshtaWarehouse?.cityDescription?.toLowerCase() || ''
  );
  const [chosenCityRef, setChosenCityRef] = useState<string | null>(
    novaPoshtaWarehouse?.cityRef || null
  );
  const [chosenWarehouseRef, setChosenWarehouseRef] = useState<string | null>(
    novaPoshtaWarehouse?.warehouseRef || null
  );

  const { apiKey, error, loadingApiKey } = useNovaposhtaApiKey();
  const { cityOptions, isLoading: isLoadingCities } = useCitySuggestions(
    searchQuery,
    apiKey,
    setChosenCityRef
  );
  const { warehouseOptions, isLoading: isLoadingWarehouses } =
    useWarehouseSuggestions(
      chosenCityRef,
      apiKey,
      setChosenWarehouseRef,
      novaPoshtaWarehouse?.warehouseRef
    );

  if (loadingApiKey) {
    return <ProgressIndicator size='small-300' />;
  }

  if (error) {
    return <Text>Error: {error}</Text>;
  }

  if (!apiKey) {
    return <Text>No API key found.</Text>;
  }

  const saveWarehouse = async () => {
    const selectedCity = cityOptions.find((city) => city.Ref === chosenCityRef);
    const selectedWarehouse = warehouseOptions.find(
      (warehouse) => warehouse.Ref === chosenWarehouseRef
    );

    await updateWarehouse({
      warehouse: {
        cityRef: chosenCityRef,
        cityDescription: selectedCity?.Description || '',
        warehouseRef: chosenWarehouseRef,
        warehouseDescription: selectedWarehouse?.Description || '',
        matchProbability: 1,
      },
      orderId,
    });

    setNovaPoshtaWarehouse({
      cityDescription: selectedCity?.Description,
      warehouseDescription: selectedWarehouse?.Description,
      cityRef: chosenCityRef,
      warehouseRef: chosenWarehouseRef,
      matchProbability: 1,
    });
  };

  return (
    <BlockStack rowGap='base'>
      {novaPoshtaWarehouse.cityDescription &&
        novaPoshtaWarehouse.warehouseDescription && (
          <InlineStack gap inlineAlignment='space-between'>
            <Text fontWeight='bold'>Збережено:</Text>
            <Text>
              {novaPoshtaWarehouse.cityDescription},{' '}
              {novaPoshtaWarehouse.warehouseDescription}
            </Text>
          </InlineStack>
        )}

      {editModeActive ? (
        <>
          <TextField
            label='Редагуйте назву пункта:'
            value={searchQuery}
            onChange={(value) => {
              setSearchQuery(value);
              setChosenWarehouseRef(null);
            }}
            placeholder='Назва'
          />
          <InlineStack gap>
            <InlineStack inlineSize='40%'>
              {isLoadingCities ? (
                <ProgressIndicator size='small-300' />
              ) : (
                <Select
                  label='Оберіть пункт..'
                  options={cityOptions.map((city) => ({
                    value: city.Ref,
                    label: isSingleWord(city.Description)
                      ? `${city.Description} (${city.AreaDescription} обл.)`
                      : city.Description,
                  }))}
                  onChange={setChosenCityRef}
                  value={chosenCityRef || ''}
                />
              )}
            </InlineStack>
            {isLoadingWarehouses ? (
              <ProgressIndicator size='small-300' />
            ) : (
              <InlineStack inlineSize='60%'>
                <Select
                  label='Оберіть відділення'
                  options={warehouseOptions.map((warehouse) => ({
                    value: warehouse.Ref,
                    label: warehouse.Description,
                  }))}
                  onChange={setChosenWarehouseRef}
                  value={chosenWarehouseRef || ''}
                />
              </InlineStack>
            )}
          </InlineStack>

          <Button
            onClick={saveWarehouse}
            disabled={!chosenCityRef || !chosenWarehouseRef}
          >
            {chosenCityRef && chosenWarehouseRef
              ? 'Зберегти адресу'
              : 'Адреса не обрана'}
          </Button>
        </>
      ) : (
        <Button onClick={() => setEditModeActive(true)}>
          Редагувати адресу
        </Button>
      )}
    </BlockStack>
  );
}

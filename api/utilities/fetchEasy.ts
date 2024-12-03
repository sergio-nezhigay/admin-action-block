import { parseStringPromise } from 'xml2js';

import { FetchingFunc } from 'api/types';

interface Offer {
  name?: string;
  vendorCode?: string;
  vendor?: string;
  picture?: string;
  price?: string;
  id?: string;
  description?: string;
  $: { available: string }; // Customize as needed
}

interface ParsedObj {
  yml_catalog: {
    shop: {
      offers: {
        offer: Offer[];
      };
    };
  };
}

export async function fetchEasy({ query, limit, page }: FetchingFunc) {
  try {
    const response = await fetch(process.env.EASY_BUY_URL || '');
    const xmlText = await response.text();

    const parsedObj: ParsedObj = await parseStringPromise(xmlText, {
      explicitArray: false,
    });

    const words = query
      .toLowerCase()
      .split(' ')
      .filter((word) => word);

    const filterOnlyAvailable = true;

    const filteredOffers = parsedObj.yml_catalog.shop.offers.offer.filter(
      (offer) => {
        const title = offer.name?.toLowerCase() || '';
        const vendorCode = offer.vendorCode?.toLowerCase() || '';
        const available = filterOnlyAvailable
          ? offer.$.available === 'true'
          : true;

        return (
          (words.every((word) => title.includes(word)) ||
            words.every((word) => vendorCode.includes(word))) &&
          available &&
          vendorCode
        );
      }
    );

    const mappedOffers = filteredOffers.map((offer, index) => {
      let pictures = Array.isArray(offer?.picture)
        ? offer.picture
        : offer?.picture
        ? [offer.picture]
        : [];

      return {
        name: offer.name,
        price: offer.price,
        description: offer.description,
        pictures: pictures,
        part_number: offer.vendorCode,
        vendor: offer.vendor || 'Informatica',
        instock: offer.$.available === 'true' ? 5 : 0,
        warranty: 12,
        id: offer?.id || `offer-${index}`,
      };
    });

    const paginatedOffers = mappedOffers.slice(
      (page - 1) * limit,
      page * limit
    );
    return { products: paginatedOffers, count: filteredOffers.length };
  } catch (error) {
    console.error('Error fetching or processing the XML:', error);
    throw error;
  }
}

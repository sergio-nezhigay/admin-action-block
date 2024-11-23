import { parseStringPromise } from 'xml2js';

export async function fetchEasy({ query = '', limit = 10, page = 1 }) {
  try {
    const response = await fetch(process.env.EASY_BUY_URL);
    const xmlText = await response.text();

    const parsedObj = await parseStringPromise(xmlText, {
      explicitArray: false,
    });

    const words = query
      .toLowerCase()
      .split(' ')
      .filter((word) => word);

    const filteredOffers = parsedObj.yml_catalog.shop.offers.offer.filter(
      (offer) => {
        const title = offer.name?.toLowerCase() || '';
        return words.every((word) => title.includes(word));
      }
    );

    const mappedOffers = filteredOffers.map((offer) => {
      return {
        name: offer.name,
        price: offer.price,
        description: offer.description,
        pictures: offer.picture,
        part_number: offer.vendorCode,
        vendor: offer.vendor,
        instock: offer.$.available === 'true' ? 5 : 0,
        warranty: 12,
        id: offer?.$?.id || `offer-${index}`,
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

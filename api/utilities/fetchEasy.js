export async function fetchEasy({ category, limit = 10, page = 1 }) {
  try {
    console.log('Fetching...categoryid, Limit, page=', category, limit, page);

    const response = await fetch(process.env.EASY_BUY_URL);
    const xmlText = await response.text(); // Get XML as text
    console.log('XML fetched successfully.');
    const c = countOffers(xmlText);
    console.log('🚀 ~ c:', c);
    // Initialize array to hold products
    let products = [];

    const offerPattern =
      /<offer id="(\d+)" available="(true|false)">.*?<url>(.*?)<\/url>.*?<price>(\d+)<\/price>.*?<currencyId>(.*?)<\/currencyId>.*?<categoryId>(.*?)<\/categoryId>.*?<name>(.*?)<\/name>.*?<vendor>(.*?)<\/vendor>.*?<vendorCode>(.*?)<\/vendorCode>.*?<description>(.*?)<\/description>.*?<\/offer>/gs;

    // Extract offers using regex

    let match;
    while ((match = offerPattern.exec(xmlText)) !== null) {
      const pictures = [];
      let pictureMatch;
      const picturePattern = /<picture>(.*?)<\/picture>/g;

      while ((pictureMatch = picturePattern.exec(match[0])) !== null) {
        pictures.push(pictureMatch[1]);
      }
      const offer = {
        id: match[1],
        available: match[2] === 'true',
        url: match[3],
        price: parseFloat(match[4]),
        currency: match[5],
        categoryId: match[6],
        name: match[7],
        vendor: match[8],
        vendorCode: match[9],
        description: match[10],
        pictures: pictures,
      };
      products.push(offer);
      if (offer.id === 1420690747) {
        console.log(
          '===== LOG START =====',
          new Date().toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })
        );
        console.log('offer:', JSON.stringify(offer, null, 4));
        console.log('match:', JSON.stringify(match, null, 4));
      }
    }

    // Display the extracted offers
    console.log('category=', category);
    console.log('products=', products);
    //const categoryProducts = products;
    const categoryProducts = products.filter(
      ({ categoryId }) => categoryId === category
    );

    const startIndex = (page - 1) * limit;
    console.log('🚀 ~ page:', page);
    console.log('🚀 ~ startIndex:', startIndex);
    const endIndex = startIndex + limit;
    console.log('🚀 ~ limit:', limit);
    console.log('🚀 ~ endIndex:', endIndex);
    const paginatedProducts = categoryProducts.slice(startIndex, endIndex);

    console.log(
      `Fetched ${paginatedProducts.length} products (Page ${page}, Limit ${limit})`
    );
    const result = {
      list: paginatedProducts,
      count: categoryProducts.length,
    };

    console.log('Products fetched and parsed:', result.count);
    return result;
  } catch (error) {
    console.error('Error fetching or parsing XML feed:', error);
    return { list: [], count: 0 }; // Return an empty result in case of error
  }
}

function countOffers(xmlData) {
  const offerRegex = /<offer[^>]*>/g; // Regex to match <offer> tags
  const matches = xmlData.match(offerRegex); // Find all matches
  return matches ? matches.length : 0; // Return the count of <offer> tags, or 0 if none found
}

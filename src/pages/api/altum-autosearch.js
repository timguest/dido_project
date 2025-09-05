// pages/api/altum-autosearch.js

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { search, limit = 10, sort = 'datum' } = req.body;

    // Validate required fields
    if (!search) {
      return res.status(400).json({
        success: false,
        error: 'Search parameter is verplicht'
      });
    }

    // Validate API key
    const apiKey = process.env.ALTUM_API_KEY;
    if (!apiKey) {
      return res.status(500).json({
        success: false,
        error: 'Altum API key niet geconfigureerd'
      });
    }

    // Clean postcode (remove spaces and validate format)
    const cleanSearch = search.replace(/\s/g, '').toUpperCase();
    const postcodeRegex = /^[1-9][0-9]{3}[A-Z]{2}$/;

    if (!postcodeRegex.test(cleanSearch)) {
      return res.status(400).json({
        success: false,
        error: 'Ongeldig postcode formaat (verwacht: 1015MN)'
      });
    }

    // Build query parameters
    const queryParams = new URLSearchParams({
      search: cleanSearch,
      sort: sort,
      limit: limit.toString()
    });

    const endpoint = `https://api.altum.ai/autosearch?${queryParams.toString()}`;

    console.log('Altum Autosearch API Request:', {
      endpoint,
      postcode: cleanSearch,
      limit,
      sort
    });

    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey
      },
      timeout: 30000
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Altum Autosearch API error:', response.status, errorText);

      if (response.status === 401 || response.status === 403) {
        return res.status(500).json({
          success: false,
          error: 'API authenticatie mislukt'
        });
      }

      if (response.status === 404) {
        return res.status(404).json({
          success: false,
          error: 'Geen panden gevonden voor deze postcode'
        });
      }

      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    console.log(`Altum Autosearch API Response - Found ${data.length} properties`);

    // Process and filter the data
    const processedProperties = data.map(property => ({
      // Core property data
      bagid: property.bagid,
      houseaddress: property.houseaddress,
      postcode: property.postcode,
      housenumber: property.housenumber,
      houseaddition: property.houseaddition || '',
      street: property.street,
      city: property.city,
      province: property.province,

      // Market data
      date_listed: property.date_listed,
      asking_price: property.asking_price ? parseInt(property.asking_price) : null,
      market_status: property.market_status,
      image: property.image,

      // Formatted data for display
      formatted_address: `${property.street} ${property.housenumber}${property.houseaddition ? `-${property.houseaddition}` : ''}`,
      formatted_price: property.asking_price ?
        new Intl.NumberFormat('nl-NL', {
          style: 'currency',
          currency: 'EUR',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0
        }).format(parseInt(property.asking_price)) : null,
      formatted_date: property.date_listed ? formatDate(property.date_listed) : null,

      // Status indicators
      has_price: !!property.asking_price,
      has_image: !!property.image,
      is_available: property.market_status === 'Beschikbaar',
      is_sold: property.market_status === 'Verkocht'
    }));

    // Generate statistics
    const propertiesWithPrice = processedProperties.filter(p => p.asking_price);
    const availableProperties = processedProperties.filter(p => p.is_available);
    const soldProperties = processedProperties.filter(p => p.is_sold);

    const statistics = {
      total_properties: processedProperties.length,
      properties_with_price: propertiesWithPrice.length,
      available_properties: availableProperties.length,
      sold_properties: soldProperties.length,
      average_price: propertiesWithPrice.length > 0 ?
        Math.round(propertiesWithPrice.reduce((sum, p) => sum + p.asking_price, 0) / propertiesWithPrice.length) : null,
      price_range: propertiesWithPrice.length > 0 ? {
        min: Math.min(...propertiesWithPrice.map(p => p.asking_price)),
        max: Math.max(...propertiesWithPrice.map(p => p.asking_price))
      } : null,
      streets: [...new Set(processedProperties.map(p => p.street))],
      search_postcode: cleanSearch
    };

    return res.status(200).json({
      success: true,
      data: {
        properties: processedProperties,
        statistics: statistics,
        search_params: {
          postcode: cleanSearch,
          limit: limit,
          sort: sort
        }
      }
    });

  } catch (error) {
    console.error('Altum Autosearch API Error:', error);

    if (error.name === 'AbortError') {
      return res.status(504).json({
        success: false,
        error: 'Request timeout - Altum API niet bereikbaar'
      });
    }

    return res.status(500).json({
      success: false,
      error: error.message || 'Er is een fout opgetreden bij het ophalen van gebied gegevens'
    });
  }
}

// Helper function to format dates
function formatDate(dateStr) {
  if (!dateStr) return null;

  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('nl-NL', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch {
    return dateStr; // Return original if parsing fails
  }
}
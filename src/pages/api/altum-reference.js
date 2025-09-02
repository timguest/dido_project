// pages/api/altum-reference.js

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      street,
      streetNumber,
      addition,
      city,
      postalCode,
      // Optional parameters from your UI
      buildYear,
      innerSurfaceArea,
      houseType,
      energyLabel
    } = req.body;

    // Validate required fields
    if (!postalCode || !streetNumber) {
      return res.status(400).json({
        success: false,
        error: 'Postcode en huisnummer zijn verplicht'
      });
    }

    // Determine API configuration (sandbox vs production)
    const useSandbox = process.env.USE_SANDBOX === 'true';
    const apiKey = useSandbox ? process.env.SANDBOX_API_KEY : process.env.ALTUM_API_KEY;
    const baseUrl = useSandbox ? 'https://api.altum.ai/sandbox' : 'https://api.altum.ai';

    // Validate API key
    if (!apiKey) {
      return res.status(500).json({
        success: false,
        error: useSandbox ? 'Sandbox API key niet geconfigureerd' : 'Altum API key niet geconfigureerd'
      });
    }

    // Clean postcode (remove spaces)
    const cleanPostcode = postalCode.replace(/\s/g, '');

    // Build request body for Altum API
    const altumRequestBody = {
      postcode: cleanPostcode,
      housenumber: parseInt(streetNumber),
      // Optional fields
      ...(addition && { houseaddition: addition }),
      ...(buildYear && { buildyear: parseInt(buildYear) }),
      ...(innerSurfaceArea && { innersurfacearea: parseInt(innerSurfaceArea) }),
      ...(houseType && { housetype: houseType }),
      ...(energyLabel && { energylabel: energyLabel }),

      // Default search parameters for good results
      reference_number: 10, // Get 10 reference houses
      date_limit: 24, // Look back 24 months
      comparable_housetype: 1, // Use comparable house types
      comparable_innersurfacearea: 1, // ±10% surface area difference
      comparable_buildyear: 2, // ±20 year difference
      comparable_distance: 1, // Within 1km radius

      // Weight parameters (adjust based on importance)
      weight_innersurfacearea: 0.3,
      weight_buildyear: 0.2,
      weight_transactiondate: 0.2,
      weight_distance: 0.3,
      weight_visualsimilarity: 0.0, // Disabled for now

      // Include both cadastral and listing references
      include_listings: true,
      visual_similarity: false // Disable visual similarity for faster response
    };

    console.log(`Reference API Request (${useSandbox ? 'SANDBOX' : 'PRODUCTION'}):`, altumRequestBody);

    const response = await fetch(`${baseUrl}/interactive-reference`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey
      },
      body: JSON.stringify(altumRequestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Altum Reference API error:', response.status, errorText);

      // Handle specific error cases
      if (response.status === 401 || response.status === 403) {
        return res.status(500).json({
          success: false,
          error: 'API authenticatie mislukt'
        });
      }

      if (response.status === 400) {
        try {
          const errorData = JSON.parse(errorText);
          return res.status(400).json({
            success: false,
            error: errorData.Output || 'Adres niet gevonden in database'
          });
        } catch {
          return res.status(400).json({
            success: false,
            error: 'Adres niet gevonden in database'
          });
        }
      }

      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    console.log(`Reference API Response (${useSandbox ? 'SANDBOX' : 'PRODUCTION'}):`, data);

    // Process and enhance the response data
    const processedData = {
      givenHouse: data.GivenHouse,
      inputs: data.Inputs,
      referenceData: {
        referencePriceMean: data.ReferenceData.ReferencePriceMean,
        referenceCount: data.ReferenceData.ReferenceHouses?.length || 0,
        referenceHouses: data.ReferenceData.ReferenceHouses?.map(house => ({
          ...house,
          // Add formatted price for display
          formattedTransactionPrice: formatPriceRange(house.TransactionPrice),
          formattedIndexedPrice: formatPriceRange(house.IndexedTransactionPrice),
          // Add distance in km for better display
          distanceKm: Math.round(house.Distance / 1000 * 10) / 10,
          // Format transaction date
          formattedTransactionDate: formatTransactionDate(house.Transactiondate)
        })) || []
      },
      // Add some summary statistics
      summary: {
        averagePrice: data.ReferenceData.ReferencePriceMean,
        totalReferences: data.ReferenceData.ReferenceHouses?.length || 0,
        averageDistance: calculateAverageDistance(data.ReferenceData.ReferenceHouses),
        houseTypeDistribution: calculateHouseTypeDistribution(data.ReferenceData.ReferenceHouses)
      },
      // Metadata
      is_sandbox: useSandbox
    };

    return res.status(200).json({
      success: true,
      data: processedData,
      sandbox: useSandbox
    });

  } catch (error) {
    console.error('Reference API Error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Er is een fout opgetreden bij het ophalen van referentiegegevens'
    });
  }
}

// Helper functions
function formatPriceRange(priceRange) {
  if (!priceRange) return null;

  // Convert "400000-450000" to "€400.000 - €450.000"
  const [min, max] = priceRange.split('-');
  const formatPrice = (price) => {
    return new Intl.NumberFormat('nl-NL', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(parseInt(price));
  };

  return `${formatPrice(min)} - ${formatPrice(max)}`;
}

function formatTransactionDate(dateStr) {
  if (!dateStr) return null;

  // Convert "202104" to "April 2021"
  const year = dateStr.toString().substring(0, 4);
  const month = dateStr.toString().substring(4, 6);

  const months = [
    'Januari', 'Februari', 'Maart', 'April', 'Mei', 'Juni',
    'Juli', 'Augustus', 'September', 'Oktober', 'November', 'December'
  ];

  return `${months[parseInt(month) - 1]} ${year}`;
}

function calculateAverageDistance(houses) {
  if (!houses || houses.length === 0) return 0;

  const totalDistance = houses.reduce((sum, house) => sum + (house.Distance || 0), 0);
  return Math.round(totalDistance / houses.length);
}

function calculateHouseTypeDistribution(houses) {
  if (!houses || houses.length === 0) return {};

  const distribution = {};
  houses.forEach(house => {
    const type = house.HouseType || 'Onbekend';
    distribution[type] = (distribution[type] || 0) + 1;
  });

  return distribution;
}
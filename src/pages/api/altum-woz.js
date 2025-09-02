// pages/api/altum-woz.js

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
      postalCode
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

    // Validate postcode format (should be 6 characters)
    if (cleanPostcode.length !== 6) {
      return res.status(400).json({
        success: false,
        error: 'Postcode moet 6 karakters zijn (bijv. 1234AB)'
      });
    }

    // Build request body for Altum WOZ API
    const altumRequestBody = {
      postcode: cleanPostcode,
      housenumber: streetNumber,
      // Include addition if provided
      ...(addition && addition.trim() && { addition: addition.trim() }),
      // Request indexed values (current market value)
      index: 1,
      // Use cache for faster response
      cache: 1
    };

    console.log(`WOZ API Request (${useSandbox ? 'SANDBOX' : 'PRODUCTION'}):`, altumRequestBody);

    const response = await fetch(`${baseUrl}/woz`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey
      },
      body: JSON.stringify(altumRequestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Altum WOZ API error:', response.status, errorText);

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
          const errorMessage = errorData.detail?.Output ||
                             'De combinatie van postcode, huisnummer en toevoeging bestaat niet of heeft geen WOZ-waarde';
          return res.status(400).json({
            success: false,
            error: errorMessage
          });
        } catch {
          return res.status(400).json({
            success: false,
            error: 'WOZ-gegevens niet gevonden voor dit adres'
          });
        }
      }

      if (response.status === 422) {
        return res.status(400).json({
          success: false,
          error: 'Ongeldig adresformaat'
        });
      }

      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    console.log(`WOZ API Response (${useSandbox ? 'SANDBOX' : 'PRODUCTION'}):`, data);

    // Process the WOZ data
    const wozOutput = data.Output;

    // Get the latest WOZ value (first in array is most recent)
    const latestWozValue = wozOutput.wozvalue && wozOutput.wozvalue.length > 0
      ? wozOutput.wozvalue[0]
      : null;

    // Process all WOZ values for historical data
    const historicalValues = wozOutput.wozvalue?.map(woz => ({
      date: woz.Date,
      value: parseInt(woz.Value),
      indexedValue: woz.IndexedValue ? parseInt(woz.IndexedValue) : null,
      formattedValue: formatCurrency(parseInt(woz.Value)),
      formattedIndexedValue: woz.IndexedValue ? formatCurrency(parseInt(woz.IndexedValue)) : null,
      year: woz.Date ? woz.Date.split('-')[2] : null
    })) || [];

    const processedData = {
      // Basic property information
      bagId: wozOutput.BagID,
      postCode: wozOutput.PostCode,
      houseNumber: wozOutput.HouseNumber,
      houseAddition: wozOutput.HouseAddition,
      street: wozOutput.Street,
      city: wozOutput.City,
      houseAddress: wozOutput.HouseAddress,
      houseType: wozOutput.HouseType,
      buildYear: wozOutput.BuildYear,
      outerSurfaceArea: wozOutput.OuterSurfaceArea,
      coordinates: {
        longitude: wozOutput.Longitude,
        latitude: wozOutput.Latitude
      },

      // WOZ specific data
      wozSourceDate: wozOutput['WOZ-source_date'],

      // Current WOZ value (latest)
      currentWozValue: latestWozValue ? parseInt(latestWozValue.Value) : null,
      currentIndexedValue: latestWozValue?.IndexedValue ? parseInt(latestWozValue.IndexedValue) : null,
      currentWozYear: latestWozValue?.Date ? latestWozValue.Date.split('-')[2] : null,

      // Formatted for display
      formattedCurrentWoz: latestWozValue ? formatCurrency(parseInt(latestWozValue.Value)) : null,
      formattedCurrentIndexed: latestWozValue?.IndexedValue ? formatCurrency(parseInt(latestWozValue.IndexedValue)) : null,

      // Historical data
      historicalValues: historicalValues,

      // Summary statistics
      summary: {
        totalYears: historicalValues.length,
        oldestYear: historicalValues.length > 0 ? Math.min(...historicalValues.map(h => parseInt(h.year))) : null,
        newestYear: historicalValues.length > 0 ? Math.max(...historicalValues.map(h => parseInt(h.year))) : null,
        valueGrowth: calculateValueGrowth(historicalValues),
        averageYearlyGrowth: calculateAverageGrowth(historicalValues)
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
    console.error('WOZ API Error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Er is een fout opgetreden bij het ophalen van WOZ-gegevens'
    });
  }
}

// Helper functions
function formatCurrency(value) {
  if (!value) return null;

  return new Intl.NumberFormat('nl-NL', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
}

function calculateValueGrowth(historicalValues) {
  if (historicalValues.length < 2) return null;

  // Sort by year to ensure correct order
  const sortedValues = historicalValues
    .filter(h => h.value && h.year)
    .sort((a, b) => parseInt(a.year) - parseInt(b.year));

  if (sortedValues.length < 2) return null;

  const oldest = sortedValues[0];
  const newest = sortedValues[sortedValues.length - 1];

  const growth = newest.value - oldest.value;
  const growthPercentage = ((newest.value / oldest.value) - 1) * 100;

  return {
    absoluteGrowth: growth,
    percentageGrowth: Math.round(growthPercentage * 100) / 100,
    formattedGrowth: formatCurrency(growth),
    fromYear: oldest.year,
    toYear: newest.year,
    period: parseInt(newest.year) - parseInt(oldest.year)
  };
}

function calculateAverageGrowth(historicalValues) {
  if (historicalValues.length < 2) return null;

  const sortedValues = historicalValues
    .filter(h => h.value && h.year)
    .sort((a, b) => parseInt(a.year) - parseInt(b.year));

  if (sortedValues.length < 2) return null;

  // Calculate year-over-year growth rates
  const growthRates = [];
  for (let i = 1; i < sortedValues.length; i++) {
    const currentValue = sortedValues[i].value;
    const previousValue = sortedValues[i - 1].value;
    const growthRate = ((currentValue / previousValue) - 1) * 100;
    growthRates.push(growthRate);
  }

  const averageGrowth = growthRates.reduce((sum, rate) => sum + rate, 0) / growthRates.length;

  return {
    averageYearlyGrowthRate: Math.round(averageGrowth * 100) / 100,
    basedOnYears: growthRates.length,
    growthRateRange: {
      min: Math.round(Math.min(...growthRates) * 100) / 100,
      max: Math.round(Math.max(...growthRates) * 100) / 100
    }
  };
}
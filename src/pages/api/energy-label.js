// pages/api/energy-label.js

const EP_ONLINE_API_KEY = process.env.EP_ONLINE_API_KEY
const BASE_URL = "https://public.ep-online.nl/api/v5";

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Validate API key
    if (!EP_ONLINE_API_KEY) {
      return res.status(500).json({
        success: false,
        error: 'EP-Online API key niet geconfigureerd'
      });
    }

    const { postcode, huisnummer, huisletter, huisnummertoevoeging } = req.body;

    // Validate required fields
    if (!postcode || !huisnummer) {
      return res.status(400).json({
        success: false,
        error: 'Postcode en huisnummer zijn verplicht'
      });
    }

    // Clean and validate postcode
    const cleanPostcode = postcode.replace(/\s/g, '').toUpperCase();
    const postcodeRegex = /^\d{4}[A-Z]{2}$/;

    if (!postcodeRegex.test(cleanPostcode)) {
      return res.status(400).json({
        success: false,
        error: 'Ongeldig postcode formaat (verwacht: 1234AB)'
      });
    }

    // Build query parameters
    const queryParams = new URLSearchParams({
      postcode: cleanPostcode,
      huisnummer: huisnummer.toString()
    });

    // Add optional parameters if provided
    if (huisletter && huisletter.trim()) {
      queryParams.append('huisletter', huisletter.trim().toUpperCase());
    }

    if (huisnummertoevoeging && huisnummertoevoeging.trim()) {
      queryParams.append('huisnummertoevoeging', huisnummertoevoeging.trim());
    }

    const endpoint = `${BASE_URL}/PandEnergielabel/Adres?${queryParams.toString()}`;

    console.log('EP-Online API Request URL:', endpoint);

    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'Authorization': EP_ONLINE_API_KEY,
        'Accept': 'application/json',
        'User-Agent': 'EP-Online-JavaScript-Client/1.0'
      },
      timeout: 15000
    });

    if (!response.ok) {
      console.error('EP-Online API error:', response.status, response.statusText);

      if (response.status === 404) {
        return res.status(404).json({
          success: false,
          error: 'Geen energielabel gevonden voor dit adres'
        });
      }

      if (response.status === 401 || response.status === 403) {
        return res.status(500).json({
          success: false,
          error: 'API authenticatie mislukt'
        });
      }

      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('EP-Online API Response:', JSON.stringify(data, null, 2));

    // Handle response - can be array or single object
    let labelData;
    if (Array.isArray(data)) {
      if (data.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Geen energielabel gevonden voor dit adres'
        });
      }
      labelData = data[0]; // Take first result
    } else if (typeof data === 'object' && data !== null) {
      labelData = data;
    } else {
      throw new Error('Onverwacht response formaat van EP-Online API');
    }

    // Parse the response using the exact field names from the Python code
    const processedData = {
      address: `${cleanPostcode} ${huisnummer}${huisletter ? huisletter : ''}${huisnummertoevoeging ? `-${huisnummertoevoeging}` : ''}`,
      energy_class: labelData.Energieklasse || null,
      registration_date: labelData.Registratiedatum || null,
      valid_until: labelData.Geldig_tot || null,
      building_type: labelData.Gebouwtype || null,
      construction_year: labelData.Bouwjaar || null,
      floor_area: labelData.Gebruiksoppervlakte_thermische_zone || null,
      postcode: labelData.Postcode || cleanPostcode,
      city: labelData.Plaats || null,

      // Additional processed fields for better display
      formatted_registration_date: formatDate(labelData.Registratiedatum),
      formatted_valid_until: formatDate(labelData.Geldig_tot),
      energy_class_color: getEnergyClassColor(labelData.Energieklasse),
      is_valid: isLabelValid(labelData.Geldig_tot),

      // Raw data for debugging/further processing
      raw_data: labelData
    };

    // Add summary information
    const summary = {
      has_label: !!processedData.energy_class,
      is_current: processedData.is_valid,
      label_age_months: calculateLabelAge(labelData.Registratiedatum),
      efficiency_score: getEfficiencyScore(labelData.Energieklasse)
    };

    return res.status(200).json({
      success: true,
      data: {
        ...processedData,
        summary: summary
      }
    });

  } catch (error) {
    console.error('Energy Label API Error:', error);

    if (error.name === 'AbortError') {
      return res.status(504).json({
        success: false,
        error: 'Request timeout - EP-Online API niet bereikbaar'
      });
    }

    return res.status(500).json({
      success: false,
      error: error.message || 'Er is een fout opgetreden bij het ophalen van energielabel gegevens'
    });
  }
}

// Helper functions
function formatDate(dateStr) {
  if (!dateStr) return null;

  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('nl-NL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch {
    return dateStr; // Return original if parsing fails
  }
}

function getEnergyClassColor(energyClass) {
  if (!energyClass) return '#gray-500';

  const colorMap = {
    'A++': '#10B981', // green-500
    'A+': '#10B981',
    'A': '#10B981',
    'B': '#84CC16', // lime-500
    'C': '#EAB308', // yellow-500
    'D': '#F59E0B', // amber-500
    'E': '#F97316', // orange-500
    'F': '#EF4444', // red-500
    'G': '#DC2626'  // red-600
  };

  return colorMap[energyClass.toUpperCase()] || '#6B7280';
}

function isLabelValid(validUntilStr) {
  if (!validUntilStr) return false;

  try {
    const validUntil = new Date(validUntilStr);
    const now = new Date();
    return validUntil > now;
  } catch {
    return false;
  }
}

function calculateLabelAge(registrationDateStr) {
  if (!registrationDateStr) return null;

  try {
    const registrationDate = new Date(registrationDateStr);
    const now = new Date();
    const diffTime = Math.abs(now - registrationDate);
    const diffMonths = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 30.44)); // Average days per month
    return diffMonths;
  } catch {
    return null;
  }
}

function getEfficiencyScore(energyClass) {
  if (!energyClass) return 0;

  const scoreMap = {
    'A++': 10,
    'A+': 9,
    'A': 8,
    'B': 7,
    'C': 6,
    'D': 5,
    'E': 4,
    'F': 3,
    'G': 2
  };

  return scoreMap[energyClass.toUpperCase()] || 0;
}
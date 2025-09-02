// pages/api/energy-label.js
export default async function handler(req, res) {
  console.log('🔍 Energy Label API called');
  console.log('Request method:', req.method);
  console.log('Request body:', req.body);

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { postcode, huisnummer, huisletter, huisnummertoevoeging } = req.body;

  console.log('Parsed request data:', { postcode, huisnummer, huisletter, huisnummertoevoeging });

  if (!postcode || !huisnummer) {
    console.log('❌ Missing required fields');
    return res.status(400).json({
      error: 'Postcode en huisnummer zijn verplicht'
    });
  }

  const EP_ONLINE_API_KEY = process.env.EP_ONLINE_API_KEY;

  console.log('API Key check:', EP_ONLINE_API_KEY ? `Present (${EP_ONLINE_API_KEY.substring(0, 10)}...)` : 'Missing');
  console.log('Full API Key (first 20 chars):', EP_ONLINE_API_KEY ? EP_ONLINE_API_KEY.substring(0, 20) : 'NULL');

  if (!EP_ONLINE_API_KEY || EP_ONLINE_API_KEY === "YOUR_EP_ONLINE_API_KEY" || EP_ONLINE_API_KEY === "") {
    console.log('❌ EP-Online API key not configured properly');
    console.log('Current value:', EP_ONLINE_API_KEY);
    return res.status(500).json({
      error: 'EP-Online API key niet geconfigureerd. Check .env.local file.'
    });
  }

  try {
    // Clean and prepare parameters (following Python logic)
    const cleanPostcode = postcode.replace(/\s/g, '').toUpperCase();
    const params = new URLSearchParams({
      postcode: cleanPostcode,
      huisnummer: huisnummer
    });

    if (huisletter) {
      params.append('huisletter', huisletter.toUpperCase());
    }

    if (huisnummertoevoeging) {
      params.append('huisnummertoevoeging', huisnummertoevoeging);
    }

    const fullUrl = `https://public.ep-online.nl/api/v5/PandEnergielabel/Adres?${params}`;
    console.log('🌐 Making request to URL:', fullUrl);
    console.log('📋 Request params:', Object.fromEntries(params));

    const response = await fetch(fullUrl, {
      method: 'GET',
      headers: {
        'Authorization': EP_ONLINE_API_KEY,
        'Accept': 'application/json',
        'User-Agent': 'DIDO-Analytics-MVT/1.0'
      },
      timeout: 15000
    });

    console.log('📡 Response status:', response.status);
    console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.log('❌ Error response body:', errorText);

      if (response.status === 404) {
        console.log('📍 No energy label found (404)');
        return res.json({
          success: true,
          data: null,
          message: 'Geen energielabel gevonden voor dit adres'
        });
      }

      if (response.status === 401 || response.status === 403) {
        console.log('🔑 Authentication failed');
        return res.status(401).json({
          error: 'EP-Online API authenticatie gefaald. Controleer API key.'
        });
      }

      console.log(`❌ EP-Online API returned status ${response.status}`);
      return res.status(response.status).json({
        error: `EP-Online API error: ${response.status} - ${errorText}`
      });
    }

    console.log('✅ Successfully received response from EP-Online');

    const data = await response.json();
    console.log('📄 Raw API Response:', JSON.stringify(data, null, 2));

    // Handle both array and single object responses (following Python logic)
    let labelData;
    if (Array.isArray(data)) {
      console.log(`📊 Response is array with ${data.length} items`);
      if (data.length === 0) {
        console.log('📍 Empty array response - no label found');
        return res.json({
          success: true,
          data: null,
          message: 'Geen energielabel gevonden (empty result)'
        });
      }
      labelData = data[0];
    } else if (typeof data === 'object' && data !== null) {
      console.log('📊 Response is single object');
      labelData = data;
    } else {
      console.log('❌ Unexpected response type:', typeof data);
      return res.status(500).json({
        error: `Unexpected response type: ${typeof data}`
      });
    }

    console.log('🔍 Processing label data:', JSON.stringify(labelData, null, 2));

    // Parse the response using exact field names from Python code
    const result = {
      address: `${cleanPostcode} ${huisnummer}${huisletter || ''}${huisnummertoevoeging || ''}`,
      energy_class: labelData.Energieklasse || null,
      registration_date: labelData.Registratiedatum || null,
      valid_until: labelData.Geldig_tot || null,
      building_type: labelData.Gebouwtype || null,
      construction_year: labelData.Bouwjaar || null,
      floor_area: labelData.Gebruiksoppervlakte_thermische_zone || null,
      postcode: labelData.Postcode || null,
      city: labelData.Plaats || null,
      raw_data: labelData
    };

    console.log('✅ Parsed result:', JSON.stringify(result, null, 2));

    return res.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('💥 Energy label API error:', error);
    console.error('Error stack:', error.stack);
    return res.status(500).json({
      error: `Fout bij ophalen energielabel: ${error.message}`
    });
  }
}
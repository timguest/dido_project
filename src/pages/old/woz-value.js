// pages/api/woz-value.js
export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { postcode, housenumber } = req.body;

  // Validate required parameters
  if (!postcode || !housenumber) {
    return res.status(400).json({
      error: 'Postcode en huisnummer zijn verplicht',
      success: false
    });
  }

  // Get API key from environment variables
  const apiKey = process.env.ALTUM_API_KEY;

  if (!apiKey) {
    console.error('ALTUM_API_KEY environment variable is not set');
    return res.status(500).json({
      error: 'Server configuratiefout: API-sleutel niet gevonden',
      success: false
    });
  }

  try {
    console.log(`🔍 Fetching WOZ data for postcode: ${postcode}, housenumber: ${housenumber}`);

    // Call Altum AI WOZ API
    const response = await fetch('https://api.altum.ai/woz', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey
      },
      body: JSON.stringify({
        postcode: postcode,
        housenumber: housenumber
      })
    });

    console.log(`📡 Altum API response status: ${response.status}`);

    // Handle non-200 responses
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`HTTP error ${response.status}: ${errorText}`);

      return res.status(response.status).json({
        error: `Altum API error: ${response.status} - ${response.statusText}`,
        details: errorText,
        success: false
      });
    }

    const wozData = await response.json();
    console.log('📄 Raw WOZ data received:', JSON.stringify(wozData, null, 2));

    // Parse and structure the WOZ data
    let processedData = null;

    // The response structure is different than expected - let's check what we actually get
    console.log('🔍 Analyzing WOZ response structure:');
    console.log('- Top level keys:', Object.keys(wozData));

    // Check if wozvalue is directly in the response or nested
    let wozValueArray = null;
    if (wozData.wozvalue && Array.isArray(wozData.wozvalue)) {
      wozValueArray = wozData.wozvalue;
      console.log('✅ Found wozvalue array directly in response');
    } else if (wozData.Output && wozData.Output.wozvalue && Array.isArray(wozData.Output.wozvalue)) {
      wozValueArray = wozData.Output.wozvalue;
      console.log('✅ Found wozvalue array in Output');
    } else {
      console.log('❌ No wozvalue array found');
    }

    if (wozValueArray && wozValueArray.length > 0) {
      console.log('🔍 WOZ value array structure:');
      console.log('- Array length:', wozValueArray.length);
      console.log('- First item keys:', Object.keys(wozValueArray[0]));
      console.log('- First item:', JSON.stringify(wozValueArray[0], null, 2));
      console.log('- Last item:', JSON.stringify(wozValueArray[wozValueArray.length - 1], null, 2));

      // Get the most recent WOZ value (like in Python: latest_woz = woz_data['Output']['wozvalue'])
      // Assuming the last item in the array is the most recent, or we need to sort by date
      let latestWoz = wozValueArray[wozValueArray.length - 1]; // Take last item first

      // Try to find the most recent by date if Date field exists
      if (wozValueArray[0].Date) {
        latestWoz = wozValueArray.reduce((latest, current) => {
          const currentDate = new Date(current.Date);
          const latestDate = new Date(latest.Date);
          return currentDate > latestDate ? current : latest;
        });
        console.log('📅 Selected most recent WOZ by date:', latestWoz);
      }

      processedData = {
        address: `${postcode} ${housenumber}`,
        woz_value: latestWoz.Value ? parseInt(latestWoz.Value.toString().replace(/[^\d]/g, '')) : null,
        woz_date: latestWoz.Date || null,
        woz_year: latestWoz.Date ? new Date(latestWoz.Date).getFullYear() : null,
        raw_data: wozData // Keep raw data for debugging/future use
      };

      // Add property details from the main response
      if (wozData.BuildYear) processedData.building_year = wozData.BuildYear;
      if (wozData.InnerSurfaceArea) processedData.surface_area = wozData.InnerSurfaceArea;
      if (wozData.HouseType) processedData.property_type = wozData.HouseType;

      console.log('✅ Processed WOZ data:', processedData);

      return res.status(200).json({
        success: true,
        data: processedData,
        message: `WOZ-waarde succesvol opgehaald: €${processedData.woz_value?.toLocaleString('nl-NL')}`
      });

    } else {
      console.log('⚠️ No WOZ value array found in response');
      console.log('🔍 Available data in response:', wozData);

      // Still return some basic property data if available
      const basicData = {
        address: `${postcode} ${housenumber}`,
        woz_value: null,
        error: 'Geen WOZ-waarde array gevonden',
        // Include any basic property info that might be useful
        building_year: wozData.BuildYear || null,
        surface_area: wozData.InnerSurfaceArea || null,
        property_type: wozData.HouseType || null,
        raw_data: wozData
      };

      return res.status(200).json({
        success: false,
        data: basicData,
        message: 'Geen WOZ-waarde gevonden, maar wel propertydata'
      });
    }

  } catch (error) {
    console.error('❌ Error fetching WOZ data:', error);

    return res.status(500).json({
      error: 'Fout bij het ophalen van WOZ-waarde',
      details: error.message,
      success: false
    });
  }
}
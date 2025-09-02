// pages/api/altum-location.js

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

    // Build request body for Altum Location API
    const altumRequestBody = {
      postcode: cleanPostcode,
      housenumber: parseInt(streetNumber),
      // Include addition if provided
      ...(addition && addition.trim() && { houseaddition: addition.trim() })
    };

    console.log(`Location API Request (${useSandbox ? 'SANDBOX' : 'PRODUCTION'}):`, altumRequestBody);

    // Note: Sandbox might use different endpoint names
    const endpoint = useSandbox ? `${baseUrl}/avm` : `${baseUrl}/location-data`;

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey
      },
      body: JSON.stringify(altumRequestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Altum Location API error:', response.status, errorText);

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
    console.log(`Location API Response (${useSandbox ? 'SANDBOX' : 'PRODUCTION'}):`, data);

    // Process the location data
    const locationOutput = data.Output || data;

    const processedData = {
      // Basic property information
      bagId: locationOutput.BagID,
      postCode: locationOutput.PostCode,
      houseNumber: locationOutput.HouseNumber,
      houseAddition: locationOutput.HouseAddition,
      street: locationOutput.Street,
      city: locationOutput.City,
      property_type: locationOutput.HouseType,
      build_year: locationOutput.BuildYear,
      inner_surface_area: locationOutput.InnerSurfaceArea,
      outer_surface_area: locationOutput.OuterSurfaceArea,
      volume: locationOutput.Volume,
      rooms: locationOutput.Rooms,

      // Location data
      coordinates: {
        longitude: locationOutput.Longitude,
        latitude: locationOutput.Latitude
      },

      // Energy information
      energy_label: locationOutput.EnergyLabel,

      // Additional metadata
      neighborhood: locationOutput.Neighborhood || locationOutput.BuurtCode,
      district: locationOutput.District || locationOutput.WijkCode,

      // Raw data for debugging/further processing
      raw_data: locationOutput,

      // Metadata
      is_sandbox: useSandbox
    };

    // Add formatted information
    const enhancedData = {
      ...processedData,
      formatted_address: `${processedData.street} ${processedData.houseNumber}${processedData.houseAddition ? `-${processedData.houseAddition}` : ''}, ${processedData.postCode} ${processedData.city}`,
      formatted_surface_area: processedData.inner_surface_area ? `${processedData.inner_surface_area} m²` : null,
      formatted_build_year: processedData.build_year ? `${processedData.build_year}` : null,
      property_age: processedData.build_year ? new Date().getFullYear() - parseInt(processedData.build_year) : null
    };

    return res.status(200).json({
      success: true,
      data: enhancedData,
      sandbox: useSandbox
    });

  } catch (error) {
    console.error('Location API Error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Er is een fout opgetreden bij het ophalen van locatiegegevens'
    });
  }
}
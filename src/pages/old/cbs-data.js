// pages/api/cbs-data.js
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { municipality } = req.query;

  if (!municipality) {
    return res.status(400).json({ error: 'Municipality parameter is required' });
  }

  try {
    console.log(`Fetching REAL CBS data for: ${municipality}`);

    // REAL CBS API calls from server (no CORS restrictions)
    const [demographicsResult, incomeResult, wozResult] = await Promise.allSettled([
      fetchCBSDemographics(municipality),
      fetchCBSIncome(municipality),
      fetchCBSWOZ(municipality)
    ]);

    // Process results
    const data = {
      gemeente: municipality,

      // Demographics data
      bevolkingsDichtheid: demographicsResult.status === 'fulfilled' ? demographicsResult.value?.populationDensity : null,
      aantalInwoners: demographicsResult.status === 'fulfilled' ? demographicsResult.value?.inhabitants : null,
      aantalHuishoudens: demographicsResult.status === 'fulfilled' ? demographicsResult.value?.households : null,
      gemiddeldHuishoudinkomen: demographicsResult.status === 'fulfilled' ? demographicsResult.value?.averageHouseholdIncome : null,

      // Income data
      gemiddeldInkomen: incomeResult.status === 'fulfilled' ? incomeResult.value?.averageIncome : null,
      gemiddeldInkomenPerInwoner: incomeResult.status === 'fulfilled' ? incomeResult.value?.incomePerInhabitant : null,

      // WOZ data
      wozWaarde: wozResult.status === 'fulfilled' ? wozResult.value?.averageWozValue : null,
      wozPerM2: wozResult.status === 'fulfilled' ? wozResult.value?.wozPerM2 : null,
      wozPeriode: wozResult.status === 'fulfilled' ? wozResult.value?.year : null,

      // Data sources
      dataSources: {
        demographics: demographicsResult.status === 'fulfilled' ? 'CBS 83765NED (Server)' : null,
        income: incomeResult.status === 'fulfilled' ? 'CBS 85927ENG (Server)' : null,
        woz: wozResult.status === 'fulfilled' ? 'CBS 85036NED (Server)' : null
      }
    };

    const debug = {
      municipality,
      results: {
        demographics: demographicsResult.status,
        income: incomeResult.status,
        woz: wozResult.status
      },
      errors: [
        demographicsResult.status === 'rejected' ? { type: 'demographics', error: demographicsResult.reason?.message } : null,
        incomeResult.status === 'rejected' ? { type: 'income', error: incomeResult.reason?.message } : null,
        wozResult.status === 'rejected' ? { type: 'woz', error: wozResult.reason?.message } : null
      ].filter(Boolean),
      timestamp: new Date().toISOString()
    };

    return res.status(200).json({
      success: true,
      data,
      debug
    });

  } catch (error) {
    console.error('CBS API Error:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
      municipality
    });
  }
}

// REAL CBS API call for demographics
async function fetchCBSDemographics(municipality) {
  const url = `https://opendata.cbs.nl/ODataApi/odata4/83765NED/Observations?$filter=contains(RegioS,'${municipality}')&$select=RegioS,BevolkingsdichtheidInwonersPerKm2_33,AantalInwoners_5,AantalHuishoudens_28,GemiddeldInkomenVanParticuliereHuishoudens_64&$top=10`;

  console.log('Demographics API URL:', url);

  const response = await fetch(url, {
    headers: {
      'Accept': 'application/json',
      'User-Agent': 'DIDO-Analytics/1.0'
    }
  });

  if (!response.ok) {
    throw new Error(`Demographics API failed: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();

  if (!data.value || data.value.length === 0) {
    throw new Error(`No demographics data found for municipality: ${municipality}`);
  }

  // Find best matching record
  const record = data.value.find(r =>
    r.RegioS && r.RegioS.toLowerCase().includes(municipality.toLowerCase())
  ) || data.value[0];

  console.log('Selected demographics record:', record);

  return {
    populationDensity: parseFloat(record.BevolkingsdichtheidInwonersPerKm2_33) || null,
    inhabitants: parseInt(record.AantalInwoners_5) || null,
    households: parseInt(record.AantalHuishoudens_28) || null,
    averageHouseholdIncome: parseFloat(record.GemiddeldInkomenVanParticuliereHuishoudens_64) || null,
    region: record.RegioS
  };
}

// REAL CBS API call for income data
async function fetchCBSIncome(municipality) {
  // Table 85927ENG - Income accounts of households by region
  const url = `https://opendata.cbs.nl/ODataApi/odata4/85927ENG/Observations?$filter=contains(RegioS,'${municipality}')&$top=20`;

  console.log('Income API URL:', url);

  const response = await fetch(url, {
    headers: {
      'Accept': 'application/json',
      'User-Agent': 'DIDO-Analytics/1.0'
    }
  });

  if (!response.ok) {
    throw new Error(`Income API failed: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();

  if (!data.value || data.value.length === 0) {
    throw new Error(`No income data found for municipality: ${municipality}`);
  }

  // Find the record with the most recent year and relevant income data
  const record = data.value
    .filter(r => r.RegioS && r.RegioS.toLowerCase().includes(municipality.toLowerCase()))
    .sort((a, b) => (b.Perioden || '').localeCompare(a.Perioden || ''))[0] || data.value[0];

  console.log('Selected income record:', record);
  console.log('Available income fields:', Object.keys(record).filter(k => k.includes('_')));

  // Extract income values from the record - CBS uses various field names
  const incomeFields = Object.keys(record).filter(key => {
    const value = record[key];
    return (
      typeof value === 'number' &&
      value > 1000 && // Reasonable income threshold
      value < 200000 && // Maximum reasonable income
      (key.includes('Income') ||
       key.includes('Inkomen') ||
       key.includes('_') && !key.includes('RegioS') && !key.includes('Perioden'))
    );
  });

  // Use the first reasonable income field found
  const incomeValue = incomeFields.length > 0 ? record[incomeFields[0]] : null;

  return {
    averageIncome: incomeValue,
    incomePerInhabitant: incomeValue,
    incomeFields,
    selectedField: incomeFields[0] || null,
    region: record.RegioS,
    period: record.Perioden
  };
}

// REAL CBS API call for WOZ data
async function fetchCBSWOZ(municipality) {
  const url = `https://opendata.cbs.nl/ODataApi/odata4/85036NED/Observations?$filter=contains(RegioS,'${municipality}') and Eigendom eq 'Totaal'&$select=RegioS,Perioden,GemiddeldeWOZWaardeVanWoningen_1,Eigendom&$top=10`;

  console.log('WOZ API URL:', url);

  const response = await fetch(url, {
    headers: {
      'Accept': 'application/json',
      'User-Agent': 'DIDO-Analytics/1.0'
    }
  });

  if (!response.ok) {
    throw new Error(`WOZ API failed: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();

  if (!data.value || data.value.length === 0) {
    throw new Error(`No WOZ data found for municipality: ${municipality}`);
  }

  // Get most recent valid WOZ data
  const validRecords = data.value.filter(r =>
    r.GemiddeldeWOZWaardeVanWoningen_1 &&
    !isNaN(parseFloat(r.GemiddeldeWOZWaardeVanWoningen_1))
  );

  if (validRecords.length === 0) {
    throw new Error('No valid WOZ values found');
  }

  const latestRecord = validRecords.sort((a, b) =>
    (b.Perioden || '').localeCompare(a.Perioden || '')
  )[0];

  console.log('Selected WOZ record:', latestRecord);

  const wozValue = parseInt(parseFloat(latestRecord.GemiddeldeWOZWaardeVanWoningen_1));

  return {
    averageWozValue: wozValue,
    year: latestRecord.Perioden,
    region: latestRecord.RegioS
  };
}
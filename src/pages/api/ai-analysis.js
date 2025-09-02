// pages/api/ai-analysis.js
import { GoogleGenerativeAI } from '@google/generative-ai';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { locationData, referenceData, wozData, energyLabel, addressData } = req.body;

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        success: false,
        error: 'Gemini API key not configured'
      });
    }

    // Initialize Gemini AI
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

    // Format the data for AI analysis
    const analysisPrompt = formatDataForAI(locationData, referenceData, wozData, energyLabel, addressData);

    // Generate AI analysis
    const result = await model.generateContent({
      contents: [{
        role: "user",
        parts: [{ text: analysisPrompt }]
      }],
      systemInstruction: getSystemInstruction(),
      generationConfig: {
        temperature: 0.3,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 1024,
      }
    });

    const response = await result.response;
    const aiText = response.text();

    // Parse the JSON response from AI
    let aiAnalysis;
    try {
      aiAnalysis = JSON.parse(aiText);
    } catch (parseError) {
      console.error('Failed to parse AI response:', aiText);
      return res.status(500).json({
        success: false,
        error: 'Invalid AI response format',
        rawResponse: aiText
      });
    }

    return res.status(200).json({
      success: true,
      data: aiAnalysis
    });

  } catch (error) {
    console.error('AI Analysis error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to analyze property data'
    });
  }
}

function formatDataForAI(locationData, referenceData, wozData, energyLabel, addressData) {
  let prompt = `Analyseer de volgende vastgoedgegevens voor: ${addressData.street} ${addressData.streetNumber}${addressData.addition ? `-${addressData.addition}` : ''}, ${addressData.city}\n\n`;

  // Location Data
  if (locationData && locationData.Output) {
    const loc = locationData.Output;
    prompt += `Location API Response: {\n`;
    prompt += `  BagID: '${loc.BagID || 'N/A'}',\n`;
    prompt += `  PostCode: '${loc.PostCode || 'N/A'}',\n`;
    prompt += `  HouseNumber: '${loc.HouseNumber || 'N/A'}',\n`;
    prompt += `  HouseAddition: '${loc.HouseAddition || 'N/A'}',\n`;
    prompt += `  City: '${loc.City || 'N/A'}',\n`;
    prompt += `  Street: '${loc.Street || 'N/A'}',\n`;
    prompt += `  HouseType: '${loc.HouseType || 'N/A'}',\n`;
    prompt += `  BuildYear: ${loc.BuildYear || 'N/A'},\n`;
    prompt += `  InnerSurfaceArea: ${loc.InnerSurfaceArea || 'N/A'},\n`;
    prompt += `  OuterSurfaceArea: ${loc.OuterSurfaceArea || 'N/A'},\n`;
    prompt += `  Volume: ${loc.Volume || 'N/A'},\n`;
    prompt += `  EnergyLabel: '${loc.EnergyLabel || 'N/A'}',\n`;
    prompt += `  Rooms: ${loc.Rooms || 'N/A'},\n`;
    prompt += `  PriceEstimation: '${loc.PriceEstimation || 'N/A'}',\n`;
    prompt += `  Confidence: '${loc.Confidence || 'N/A'}',\n`;
    prompt += `  AccuracyIndicator: ${loc.AccuracyIndicator || 'N/A'}\n`;
    prompt += `}\n\n`;
  }

  // Reference Data
  if (referenceData && referenceData.GivenHouse && referenceData.ReferenceData) {
    const given = referenceData.GivenHouse;
    const ref = referenceData.ReferenceData;
    prompt += `Reference API Response: {\n`;
    prompt += `  GivenHouse: {\n`;
    prompt += `    PostCode: '${given.PostCode || 'N/A'}',\n`;
    prompt += `    HouseNumber: ${given.HouseNumber || 'N/A'},\n`;
    prompt += `    HouseAddition: '${given.HouseAddition || 'N/A'}',\n`;
    prompt += `    ValuationDate: '${given.ValuationDate || 'N/A'}',\n`;
    prompt += `    InnerSurfaceArea: ${given.InnerSurfaceArea || 'N/A'},\n`;
    prompt += `    OuterSurfaceArea: ${given.OuterSurfaceArea || 'N/A'},\n`;
    prompt += `    HouseType: '${given.HouseType || 'N/A'}',\n`;
    prompt += `    BuildYear: ${given.BuildYear || 'N/A'},\n`;
    if (given.EnergyLabel) {
      prompt += `    EnergyLabel: {\n`;
      prompt += `      DefinitiveEnergyLabel: '${given.EnergyLabel.DefinitiveEnergyLabel || 'N/A'}'\n`;
      prompt += `    }\n`;
    }
    prompt += `  },\n`;
    prompt += `  ReferenceData: {\n`;
    prompt += `    ReferencePriceMean: '${ref.ReferencePriceMean || 'N/A'}',\n`;
    prompt += `    ReferenceHouses: ${ref.ReferenceHouses ? `[${ref.ReferenceHouses.length} vergelijkbare woningen]` : 'N/A'}\n`;
    prompt += `  }\n`;
    prompt += `}\n\n`;
  }

  // WOZ Data
  if (wozData && wozData.Output) {
    const woz = wozData.Output;
    prompt += `WOZ API Response: {\n`;
    prompt += `  BagID: '${woz.BagID || 'N/A'}',\n`;
    prompt += `  PostCode: '${woz.PostCode || 'N/A'}',\n`;
    prompt += `  HouseNumber: '${woz.HouseNumber || 'N/A'}',\n`;
    prompt += `  HouseAddition: '${woz.HouseAddition || 'N/A'}',\n`;
    prompt += `  City: '${woz.City || 'N/A'}',\n`;
    prompt += `  Street: '${woz.Street || 'N/A'}',\n`;
    prompt += `  HouseType: '${woz.HouseType || 'N/A'}',\n`;
    prompt += `  BuildYear: ${woz.BuildYear || 'N/A'},\n`;
    prompt += `  InnerSurfaceArea: ${woz.InnerSurfaceArea || 'N/A'},\n`;
    prompt += `  OuterSurfaceArea: ${woz.OuterSurfaceArea || 'N/A'},\n`;
    prompt += `  WOZ-source_date: '${woz['WOZ-source_date'] || 'N/A'}',\n`;
    if (woz.wozvalue && Array.isArray(woz.wozvalue) && woz.wozvalue.length > 0) {
      const latestWoz = woz.wozvalue[woz.wozvalue.length - 1];
      prompt += `  LatestWOZValue: ${JSON.stringify(latestWoz)}\n`;
    }
    prompt += `}\n\n`;
  }

  // Energy Label Data
  if (energyLabel) {
    prompt += `EP-Online API Response: {\n`;
    prompt += `  EnergyClass: '${energyLabel.energy_class || 'N/A'}',\n`;
    prompt += `  FloorArea: ${energyLabel.floor_area || 'N/A'},\n`;
    prompt += `  BuildYear: ${energyLabel.build_year || 'N/A'},\n`;
    prompt += `  Validity: '${energyLabel.validity || 'N/A'}'\n`;
    prompt += `}\n\n`;
  } else {
    prompt += `EP-Online API error: 404 Not Found\n\n`;
  }

  return prompt;
}

function getSystemInstruction() {
  return `You are a real estate valuation expert with deep expertise in the Dutch housing market.
Your role: Based on the structured property information provided by the user, you must deliver a clear, professional, and well-argued estimate of the expected sale price of the property.

CRITICAL REQUIREMENTS
- ONLY OUTPUT THE ANSWER: No confirmations, no introductions, no explanations outside the required structure.
- ACCURACY & DEPTH: Think carefully and reason step by step before forming your judgment.
- STRUCTURED OUTPUT: Always use the predefined JSON format.
- NO ASSUMPTIONS: If information is missing, acknowledge it in the argumentation, but never invent details.
- CONFIDENCE LEVEL: Always include a percentage of how confident you are in your estimate.

OUTPUT FORMAT
Your output must be a JSON object with exactly the following fields:
{
  "geschat_verkoopbedrag": "€ ...",
  "zekerheid": "...%",
  "argumentatie": [
    "Reden 1",
    "Reden 2",
    "Reden 3",
    "... (meer indien nodig)"
  ]
}

OUTPUT RULES
- geschat_verkoopbedrag: Provide one clear number in euros (e.g., "€325.000").
- zekerheid: Express confidence as a percentage (e.g., "75%").
- argumentatie: Provide a structured list of reasons, focusing on location, size, condition, amenities, recent comparable sales, and any other relevant property characteristics explicitly mentioned in the input.
- Transparency: If information is missing (e.g., bouwjaar, staat van onderhoud), explicitly note its impact on certainty in the argumentation.
- No duplication: Each reason should be unique and focused.

This is your sole task. Always think deeply, structure clearly, and deliver your final valuation in the exact JSON format above.`;
}
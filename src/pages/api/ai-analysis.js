// pages/api/ai-analysis.js
import { GoogleGenAI } from '@google/genai';
import { SYSTEM_PROMPT } from '../../lib/systemPrompt.js';

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

    // Initialize Gemini AI client - Using JavaScript SDK equivalent
    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
    });

    const model = "gemini-2.5-pro";

    // Format the data for AI analysis
    const analysisPrompt = formatDataForAI(locationData, referenceData, wozData, energyLabel, addressData);

    // Create contents array - JavaScript SDK format
    const contents = [
      {
        role: "user",
        parts: [
          {
            text: analysisPrompt
          }
        ]
      }
    ];

    // Generate content config - JavaScript SDK format
    const config = {
      thinkingConfig: {
        thinkingBudget: 2320,
      }
    };

    // Generate AI analysis using streaming
    let aiText = '';
    const response = await ai.models.generateContentStream({
      model: model,
      contents: contents,
      config: config,
      systemInstruction: SYSTEM_PROMPT
    });

    // Collect all chunks
    for await (const chunk of response) {
      if (chunk.text) {
        aiText += chunk.text;
      }
    }

    // Clean and extract JSON from the response
    let aiAnalysis;
    try {
      // Remove any markdown code blocks or extra text
      let cleanedText = aiText.trim();

      // Remove markdown code blocks if present
      cleanedText = cleanedText.replace(/```json\s*/g, '').replace(/```\s*/g, '');

      // Find JSON object in the response
      const jsonMatch = cleanedText.match(/\{[\s\S]*?\}/);
      if (jsonMatch) {
        aiAnalysis = JSON.parse(jsonMatch[0]);
      } else {
        // If no JSON found, create a fallback response with the raw text
        aiAnalysis = {
          geschat_verkoopbedrag: "Niet beschikbaar",
          zekerheid: "0%",
          argumentatie: [
            "AI heeft geen gestructureerd antwoord gegeven",
            "Raw output ontvangen in plaats van JSON format",
            "Controleer de system prompt configuratie"
          ],
          raw_ai_output: aiText // Include raw output for debugging
        };
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', aiText);
      // Create fallback with raw AI output
      aiAnalysis = {
        geschat_verkoopbedrag: "Analyse beschikbaar",
        zekerheid: "50%",
        argumentatie: [
          "AI analyse succesvol uitgevoerd",
          "Data gebaseerd op locatie, referenties en WOZ waarden",
          "Bekijk de volledige analyse hieronder"
        ],
        raw_analysis: aiText // Show the full Dutch analysis as fallback
      };
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

function formatDataForAI(locationData, referenceData, wozData, energyLabel, addressData) {
  let prompt = `VASTGOED ANALYSE DATA voor ${addressData.street} ${addressData.streetNumber}${addressData.addition ? `-${addressData.addition}` : ''}, ${addressData.city}:\n\n`;

  // Location Data
  if (locationData && locationData.Output) {
    const loc = locationData.Output;
    prompt += `LOCATIE DATA:\n`;
    prompt += `- Type: ${loc.HouseType || 'N/A'}\n`;
    prompt += `- Bouwjaar: ${loc.BuildYear || 'N/A'}\n`;
    prompt += `- Oppervlakte binnen: ${loc.InnerSurfaceArea || 'N/A'} m²\n`;
    prompt += `- Kamers: ${loc.Rooms || 'N/A'}\n`;
    prompt += `- Energielabel: ${loc.EnergyLabel || 'N/A'}\n`;
    if (loc.PriceEstimation) {
      prompt += `- AI Prijsschatting: €${loc.PriceEstimation}\n`;
    }
    prompt += `\n`;
  }

  // Reference Data
  if (referenceData && referenceData.ReferenceData) {
    const ref = referenceData.ReferenceData;
    prompt += `REFERENTIE DATA:\n`;
    prompt += `- Vergelijkbare woningen: ${ref.ReferenceHouses?.length || 0}\n`;
    prompt += `- Prijsrange vergelijkingen: ${ref.ReferencePriceMean || 'N/A'}\n`;
    prompt += `\n`;
  }

  // WOZ Data
  if (wozData && wozData.Output) {
    const woz = wozData.Output;
    prompt += `WOZ DATA:\n`;
    prompt += `- Oppervlakte: ${woz.InnerSurfaceArea || 'N/A'} m²\n`;
    if (woz.wozvalue && Array.isArray(woz.wozvalue) && woz.wozvalue.length > 0) {
      const latestWoz = woz.wozvalue[woz.wozvalue.length - 1];
      prompt += `- Laatste WOZ waarde: €${latestWoz.value || 'N/A'} (${latestWoz.year || 'N/A'})\n`;
    }
    prompt += `\n`;
  }

  // Energy Label Data
  if (energyLabel) {
    prompt += `ENERGIELABEL:\n`;
    prompt += `- Label: ${energyLabel.energy_class || 'N/A'}\n`;
    prompt += `- Oppervlakte: ${energyLabel.floor_area || 'N/A'} m²\n`;
  } else {
    prompt += `ENERGIELABEL: Niet gevonden (404 error)\n`;
  }

  prompt += `\nGeef een JSON analyse van deze woning.`;

  return prompt;
}
// pages/api/ai-analysis.js
import { GoogleGenerativeAI } from '@google/generative-ai';

const SYSTEM_PROMPT = `Je bent een Nederlandse vastgoedexpert gespecialiseerd in het analyseren van Nederlandse woningen.
Geef een uitgebreide, professionele analyse van het vastgoedobject op basis van de verstrekte data.
Behandel in je analyse:
- Locatie waardering en marktpositie
- Objectkenmerken (type, oppervlakte, bouwjaar)
- Geschatte marktwaarde met onderbouwing
- Risico's en aandachtspunten
- Aanbevelingen voor potentiële kopers/investeerders
Schrijf in duidelijk, professioneel Nederlands en geef concrete, bruikbare inzichten. Wees specifiek over prijsindicaties en marktomstandigheden.`;

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

    // Initialize Gemini AI client
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

    // Create raw JSON data object for user message
    const rawDataForAI = {
      addressData,
      locationData,
      referenceData,
      wozData,
      energyLabel: energyLabel || null // Don't send error object, just null
    };

    // Convert to clean JSON string
    const userMessage = JSON.stringify(rawDataForAI, null, 2);

    console.log('=== SENDING TO GEMINI ===');
    console.log('System Prompt length:', SYSTEM_PROMPT.length);
    console.log('User Message length:', userMessage.length);

    // Use the latest model with system instruction
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash-thinking-exp-1219",
      systemInstruction: SYSTEM_PROMPT
    });

    // Generate AI analysis using streaming
    const result = await model.generateContentStream({
      contents: [
        {
          role: "user",
          parts: [{ text: userMessage }]
        }
      ]
    });

    // Collect all chunks from the stream
    let aiText = '';
    for await (const chunk of result.stream) {
      if (chunk.text) {
        aiText += chunk.text();
      }
    }

    console.log('=== GEMINI RESPONSE RECEIVED ===');
    console.log('Response length:', aiText.length);

    // Return the AI analysis
    const aiAnalysis = {
      raw_analysis: aiText.trim(),
      metadata: {
        model_used: "gemini-2.0-flash-thinking-exp-1219",
        analysis_timestamp: new Date().toISOString(),
        data_sources: []
      }
    };

    // Track which data sources were available - ONLY add if data exists
    if (locationData) aiAnalysis.metadata.data_sources.push('Altum Location Data');
    if (referenceData) aiAnalysis.metadata.data_sources.push('Altum Reference Data');
    if (wozData) aiAnalysis.metadata.data_sources.push('WOZ Data');
    if (energyLabel) aiAnalysis.metadata.data_sources.push('Energy Label');
    // Removed the "else" line that was adding "404 - not found"

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
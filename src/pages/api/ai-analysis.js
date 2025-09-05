// pages/api/ai-analysis.js
import { GoogleGenerativeAI } from '@google/generative-ai';

const SYSTEM_PROMPT = `Je bent een Nederlandse vastgoedexpert gespecialiseerd in het analyseren van Nederlandse woningen.

Begin je analyse altijd met:
GESCHATTE WAARDE: [bedrag van] - [bedrag tot] EUR
BETROUWBAARHEID: [percentage]% - [korte uitleg waarom]

Geef vervolgens een uitgebreide, professionele analyse van het vastgoedobject op basis van de verstrekte data zonder gebruik van koppen, sterretjes, hekjes of andere opmaak.

Behandel in je analyse in vloeiende tekst:

Allereerst de locatie waardering en marktpositie van het object. Beschrijf de buurt, bereikbaarheid, voorzieningen en hoe dit de waarde beïnvloedt.

Vervolgens de objectkenmerken waarbij je ingaat op het type woning, oppervlakte, bouwjaar, staat van onderhoud en bijzondere kenmerken die de waarde bepalen.

Daarna een gedetailleerde onderbouwing van de geschatte marktwaarde met vergelijkingen naar soortgelijke objecten in de omgeving en recente transacties.

Bespreek ook de belangrijkste risicos en aandachtspunten zoals mogelijke gebreken, marktrisicos, onderhoudskosten of andere factoren die de waarde kunnen beïnvloeden.

Sluit af met concrete aanbevelingen voor potentiële kopers of investeerders, inclusief specifieke adviezen over timing, financiering en mogelijke onderhandelingsruimte.

Schrijf in duidelijk, professioneel Nederlands en geef concrete, bruikbare inzichten. Wees specifiek over prijsindicaties en marktomstandigheden. Gebruik alleen gewone tekst zonder enige opmaak.`;
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
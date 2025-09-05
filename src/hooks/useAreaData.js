// hooks/useAreaData.js
import { useState, useCallback } from 'react';

export function useAreaData(postalCode, setStep) {
  const [areaData, setAreaData] = useState({
    properties: [],
    statistics: null,
    energyLabels: {}
  });

  const [loadingState, setLoadingState] = useState({
    autosearch: false,
    energyLabels: false,
    ai: false
  });

  const [errors, setErrors] = useState({});
  const [aiAnalysis, setAiAnalysis] = useState(null);

  // Fetch properties from Altum Autosearch
  const fetchAreaProperties = useCallback(async () => {
    console.log('🚀 Starting area properties fetch for postcode:', postalCode);
    setLoadingState(prev => ({ ...prev, autosearch: true }));
    setErrors(prev => ({ ...prev, autosearch: null }));

    try {
      const response = await fetch('/api/altum-autosearch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          search: postalCode,
          limit: 15,
          sort: 'datum'
        })
      });

      const result = await response.json();
      console.log('📥 Autosearch response:', result);

      if (result.success) {
        setAreaData(prev => ({
          ...prev,
          properties: result.data.properties,
          statistics: result.data.statistics
        }));
        return result.data.properties;
      } else {
        throw new Error(result.error || 'Failed to fetch area properties');
      }
    } catch (error) {
      console.error('❌ Autosearch error:', error);
      setErrors(prev => ({
        ...prev,
        autosearch: error.message || 'Failed to fetch area properties'
      }));
      return [];
    } finally {
      setLoadingState(prev => ({ ...prev, autosearch: false }));
    }
  }, [postalCode]);

  // Batch fetch energy labels for properties
  const fetchBatchEnergyLabels = useCallback(async (properties) => {
    console.log('🚀 Starting batch energy labels fetch for', properties.length, 'properties');
    setLoadingState(prev => ({ ...prev, energyLabels: true }));
    setErrors(prev => ({ ...prev, energyLabels: null }));

    const energyLabels = {};
    let successCount = 0;
    let errorCount = 0;

    // Limit concurrent requests to avoid overwhelming the API
    const batchSize = 3;
    for (let i = 0; i < properties.length; i += batchSize) {
      const batch = properties.slice(i, i + batchSize);

      const batchPromises = batch.map(async (property) => {
        try {
          // Parse house number and addition
          const baseHuisnummer = property.housenumber.toString();
          let huisletter = null;
          let huisnummertoevoeging = null;

          if (property.houseaddition?.trim()) {
            const addition = property.houseaddition.trim();
            if (addition.match(/^[A-Z]$/i)) {
              huisletter = addition.toUpperCase();
            } else {
              huisnummertoevoeging = addition;
            }
          }

          const requestData = {
            postcode: property.postcode,
            huisnummer: baseHuisnummer
          };

          if (huisletter) requestData.huisletter = huisletter;
          if (huisnummertoevoeging) requestData.huisnummertoevoeging = huisnummertoevoeging;

          const response = await fetch('/api/energy-label', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestData)
          });

          const result = await response.json();

          if (result.success) {
            energyLabels[property.bagid] = result.data;
            successCount++;
          } else {
            // Energy label not found is normal, don't count as error
            if (!result.error?.toLowerCase().includes('geen energielabel gevonden')) {
              errorCount++;
            }
            energyLabels[property.bagid] = null;
          }
        } catch (error) {
          console.warn(`Energy label fetch failed for ${property.houseaddress}:`, error.message);
          energyLabels[property.bagid] = null;
          errorCount++;
        }
      });

      await Promise.allSettled(batchPromises);

      // Small delay between batches to be nice to the API
      if (i + batchSize < properties.length) {
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }

    console.log(`📊 Energy labels batch complete: ${successCount} found, ${errorCount} errors`);

    setAreaData(prev => ({
      ...prev,
      energyLabels: energyLabels
    }));

    // Only set error if significant number of requests failed
    if (errorCount > properties.length * 0.5) {
      setErrors(prev => ({
        ...prev,
        energyLabels: `Veel energie labels konden niet worden opgehaald (${errorCount}/${properties.length})`
      }));
    }

    setLoadingState(prev => ({ ...prev, energyLabels: false }));
    return energyLabels;
  }, []);

  // Main function to fetch all area data
  const fetchAreaData = useCallback(async () => {
    const properties = await fetchAreaProperties();
    if (properties.length > 0) {
      await fetchBatchEnergyLabels(properties);
    }
  }, [fetchAreaProperties, fetchBatchEnergyLabels]);

  // Run AI analysis for area data
  const runAreaAIAnalysis = useCallback(async () => {
    setLoadingState(prev => ({ ...prev, ai: true }));
    setStep(3);
    setErrors(prev => ({ ...prev, ai: null }));

    try {
      // Combine properties with their energy labels
      const enrichedProperties = areaData.properties.map(property => ({
        ...property,
        energy_label: areaData.energyLabels[property.bagid]
      }));

      const response = await fetch('/api/ai-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          analysisType: 'area',
          postalCode: postalCode,
          properties: enrichedProperties,
          statistics: areaData.statistics,
          energyLabels: areaData.energyLabels
        })
      });

      const result = await response.json();

      if (result.success) {
        setAiAnalysis(result.data);
      } else {
        throw new Error(result.error || 'AI analysis failed');
      }
    } catch (error) {
      console.error('Area AI analysis error:', error);
      setErrors(prev => ({ ...prev, ai: error.message }));

      // Fallback analysis
      const propertiesWithPrices = areaData.properties.filter(p => p.asking_price);
      const avgPrice = propertiesWithPrices.length > 0
        ? Math.round(propertiesWithPrices.reduce((sum, p) => sum + p.asking_price, 0) / propertiesWithPrices.length)
        : 0;

      setAiAnalysis({
        raw_analysis: `❌ AI Analyse Mislukt: ${error.message}\n\nGebied Analyse voor ${postalCode}:\n\n📊 STATISTIEKEN:\n- Totaal ${areaData.properties.length} panden gevonden\n- ${propertiesWithPrices.length} panden met prijs informatie\n- Gemiddelde vraagprijs: €${avgPrice.toLocaleString('nl-NL')}\n\nDe verzamelde data is beschikbaar hieronder voor handmatige beoordeling.`,
        metadata: {
          model_used: 'Error',
          analysis_timestamp: new Date().toISOString(),
          data_sources: ['Error occurred during analysis']
        }
      });
    } finally {
      setLoadingState(prev => ({ ...prev, ai: false }));
    }
  }, [areaData, postalCode, setStep]);

  // Reset all area data
  const resetAreaAnalysis = useCallback(() => {
    setAreaData({
      properties: [],
      statistics: null,
      energyLabels: {}
    });
    setAiAnalysis(null);
    setErrors({});
    setLoadingState({
      autosearch: false,
      energyLabels: false,
      ai: false
    });
  }, []);

  return {
    areaData,
    loadingState,
    errors,
    aiAnalysis,
    fetchAreaData,
    runAreaAIAnalysis,
    resetAreaAnalysis
  };
}
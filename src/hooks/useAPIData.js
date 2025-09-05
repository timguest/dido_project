// hooks/useAPIData.js (Updated with Area Analysis Support)
import { useState, useCallback } from 'react';
import { useAreaData } from './useAreaData';

export function useAPIData(addressData, setStep, analysisMode = 'individual', postalCode = '') {
  // Individual property analysis state
  const [apiData, setApiData] = useState({
    locationData: null,
    referenceData: null,
    wozData: null,
    energyLabel: null
  });

  const [loadingState, setLoadingState] = useState({
    location: false,
    reference: false,
    woz: false,
    energy: false,
    ai: false
  });

  const [errors, setErrors] = useState({});
  const [aiAnalysis, setAiAnalysis] = useState(null);

  // Area analysis hook
  const {
    areaData,
    loadingState: areaLoadingState,
    errors: areaErrors,
    aiAnalysis: areaAiAnalysis,
    fetchAreaData,
    runAreaAIAnalysis,
    resetAreaAnalysis
  } = useAreaData(postalCode, setStep);

  // Generic API fetcher factory for individual properties
  const createAPIFetcher = useCallback((endpoint, dataKey, customProcessing) => async () => {
    console.log(`🚀 Starting ${endpoint} fetch for ${dataKey}`);
    setLoadingState(prev => ({ ...prev, [dataKey]: true }));
    setErrors(prev => ({ ...prev, [dataKey]: null }));

    try {
      let requestData = addressData;

      // Custom processing for energy label
      if (customProcessing) {
        requestData = customProcessing(addressData);
      }

      const response = await fetch(`/api/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData)
      });

      const result = await response.json();
      console.log(`📥 ${endpoint} response:`, result);

      if (result.success) {
        console.log(`✅ Setting ${dataKey} data:`, result.data);
        setApiData(prev => {
          const newState = { ...prev, [dataKey]: result.data };
          console.log(`🔄 New apiData state after ${dataKey}:`, newState);
          return newState;
        });
      } else {
        // Special handling for energy label - missing is not an error
        if (dataKey === 'energyLabel' &&
            (result.error?.toLowerCase().includes('not found') ||
             result.error?.includes('404') ||
             result.error?.toLowerCase().includes('geen energielabel gevonden'))) {
          console.log('⚠️ Energy label not found - this is normal');
          setApiData(prev => ({ ...prev, [dataKey]: null }));
        } else {
          throw new Error(result.error || `${endpoint} API failed`);
        }
      }
    } catch (error) {
      console.error(`❌ ${endpoint} error:`, error);

      // Double check for energy label errors that got through
      if (dataKey === 'energyLabel' &&
          (error.message?.toLowerCase().includes('not found') ||
           error.message?.includes('404') ||
           error.message?.toLowerCase().includes('geen energielabel gevonden'))) {
        console.log('⚠️ Energy label not found in catch - this is normal');
        setApiData(prev => ({ ...prev, [dataKey]: null }));
      } else {
        setErrors(prev => ({
          ...prev,
          [dataKey]: error.message || `Failed to fetch ${endpoint} data`
        }));
        setApiData(prev => ({ ...prev, [dataKey]: null }));
      }
    } finally {
      setLoadingState(prev => ({ ...prev, [dataKey]: false }));
    }
  }, [addressData]);

  // Individual API fetchers
  const fetchLocationData = createAPIFetcher('altum-location', 'locationData');
  const fetchReferenceData = createAPIFetcher('altum-reference', 'referenceData');
  const fetchWOZData = createAPIFetcher('altum-woz', 'wozData');
  const fetchEnergyLabel = createAPIFetcher('energy-label', 'energyLabel', (addressData) => {
    // Custom processing for energy label API
    const baseHuisnummer = addressData.streetNumber.match(/^\d+/)?.[0];
    let huisletter = null;
    let huisnummertoevoeging = null;

    if (addressData.addition?.trim()) {
      const addition = addressData.addition.trim();
      if (addition.match(/^[A-Z]$/i)) {
        huisletter = addition.toUpperCase();
      } else {
        huisnummertoevoeging = addition;
      }
    }

    const requestData = {
      postcode: addressData.postalCode.replace(/\s/g, ''),
      huisnummer: baseHuisnummer
    };

    if (huisletter) requestData.huisletter = huisletter;
    if (huisnummertoevoeging) requestData.huisnummertoevoeging = huisnummertoevoeging;

    return requestData;
  });

  // Fetch all individual property data
  const fetchAllData = useCallback(async () => {
    await Promise.allSettled([
      fetchLocationData(),
      fetchReferenceData(),
      fetchWOZData(),
      fetchEnergyLabel()
    ]);
  }, [fetchLocationData, fetchReferenceData, fetchWOZData, fetchEnergyLabel]);

  // Run AI analysis for individual property
  const runAIAnalysis = useCallback(async () => {
    setLoadingState(prev => ({ ...prev, ai: true }));
    setStep(3);
    setErrors(prev => ({ ...prev, ai: null }));

    try {
      const response = await fetch('/api/ai-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          analysisType: 'individual',
          locationData: apiData.locationData,
          referenceData: apiData.referenceData,
          wozData: apiData.wozData,
          energyLabel: apiData.energyLabel,
          addressData: addressData
        })
      });

      const result = await response.json();

      if (result.success) {
        setAiAnalysis(result.data);
      } else {
        throw new Error(result.error || 'AI analysis failed');
      }
    } catch (error) {
      console.error('AI analysis error:', error);
      setErrors(prev => ({ ...prev, ai: error.message }));
      setAiAnalysis({
        raw_analysis: `❌ AI Analyse Mislukt: ${error.message}\n\nDe verzamelde data is nog steeds beschikbaar hieronder voor handmatige beoordeling.`,
        metadata: {
          model_used: 'Error',
          analysis_timestamp: new Date().toISOString(),
          data_sources: ['Error occurred during analysis']
        }
      });
    } finally {
      setLoadingState(prev => ({ ...prev, ai: false }));
    }
  }, [apiData, addressData, setStep]);

  // Reset individual property analysis
  const resetAnalysis = useCallback(() => {
    setApiData({
      locationData: null,
      referenceData: null,
      wozData: null,
      energyLabel: null
    });
    setAiAnalysis(null);
    setErrors({});
    setLoadingState({
      location: false,
      reference: false,
      woz: false,
      energy: false,
      ai: false
    });
  }, []);

  // Main data fetching function that routes based on analysis mode
  const fetchData = useCallback(async () => {
    if (analysisMode === 'area') {
      await fetchAreaData();
    } else {
      await fetchAllData();
    }
  }, [analysisMode, fetchAreaData, fetchAllData]);

  // Main AI analysis function that routes based on analysis mode
  const runAnalysis = useCallback(async () => {
    if (analysisMode === 'area') {
      await runAreaAIAnalysis();
    } else {
      await runAIAnalysis();
    }
  }, [analysisMode, runAreaAIAnalysis, runAIAnalysis]);

  // Main reset function that routes based on analysis mode
  const resetAll = useCallback(() => {
    resetAnalysis();
    resetAreaAnalysis();
  }, [resetAnalysis, resetAreaAnalysis]);

  // Return the appropriate data based on analysis mode
  if (analysisMode === 'area') {
    return {
      apiData: areaData,
      loadingState: areaLoadingState,
      errors: areaErrors,
      aiAnalysis: areaAiAnalysis,
      fetchAllData: fetchAreaData,
      runAIAnalysis: runAreaAIAnalysis,
      resetAnalysis: resetAreaAnalysis,
      // Unified interface
      fetchData,
      runAnalysis,
      resetAll
    };
  }

  // Individual analysis mode (default)
  return {
    apiData,
    loadingState,
    errors,
    aiAnalysis,
    fetchAllData,
    runAIAnalysis,
    resetAnalysis,
    // Unified interface
    fetchData,
    runAnalysis,
    resetAll
  };
}
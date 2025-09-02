import React, { useState, useCallback, useMemo } from 'react';
import { Building2, MapPin, DollarSign, Zap, Brain, Loader2, CheckCircle, AlertTriangle, Sparkles, TrendingUp, ChevronDown, ChevronRight, Eye, EyeOff, Copy, Download } from 'lucide-react';

export default function RealEstateAnalyzer() {
  const [step, setStep] = useState(1);
  const [addressData, setAddressData] = useState({
    street: '',
    streetNumber: '',
    addition: '',
    city: '',
    postalCode: ''
  });
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
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [errors, setErrors] = useState({});

  // Default address data
  const defaultAddress = {
    street: 'Westerstraat',
    streetNumber: '72',
    addition: '1',
    city: 'Amsterdam',
    postalCode: '1015 MN'
  };

  const fillDefaultAddress = useCallback(() => {
    setAddressData(defaultAddress);
  }, []);

  const handleAddressSubmit = useCallback(() => {
    if (addressData.street && addressData.streetNumber && addressData.city && addressData.postalCode) {
      setStep(2);
      fetchAllData();
    }
  }, [addressData]);

  const handleInputChange = useCallback((field, value) => {
    setAddressData(prev => ({ ...prev, [field]: value }));
  }, []);

  // API fetching functions with better error handling
  const createAPIFetcher = (endpoint, dataKey) => async () => {
    console.log(`🚀 Starting ${endpoint} fetch for ${dataKey}`);
    setLoadingState(prev => ({ ...prev, [dataKey]: true }));
    setErrors(prev => ({ ...prev, [dataKey]: null }));

    try {
      const response = await fetch(`/api/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(addressData)
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
        throw new Error(result.error || `${endpoint} API failed`);
      }
    } catch (error) {
      console.error(`❌ ${endpoint} error:`, error);
      setErrors(prev => ({
        ...prev,
        [dataKey]: error.message || `Failed to fetch ${endpoint} data`
      }));
      setApiData(prev => ({ ...prev, [dataKey]: null }));
    } finally {
      setLoadingState(prev => ({ ...prev, [dataKey]: false }));
    }
  };

  const fetchLocationData = createAPIFetcher('altum-location', 'location');
  const fetchReferenceData = createAPIFetcher('altum-reference', 'reference');
  const fetchWOZData = createAPIFetcher('altum-woz', 'woz');

  const fetchEnergyLabel = async () => {
    console.log('🚀 Starting energy label fetch');
    setLoadingState(prev => ({ ...prev, energy: true }));
    setErrors(prev => ({ ...prev, energy: null }));

    try {
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

      const response = await fetch('/api/energy-label', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData)
      });

      const result = await response.json();
      console.log('📥 Energy label response:', result);

      if (result.success) {
        console.log('✅ Setting energy label data:', result.data);
        setApiData(prev => {
          const newState = { ...prev, energyLabel: result.data };
          console.log('🔄 New apiData state after energy label:', newState);
          return newState;
        });
      } else {
        // Energy labels are not always available - this is normal, not an error
        console.log('⚠️ Energy label not found:', result.error);
        setApiData(prev => {
          const newState = { ...prev, energyLabel: null };
          console.log('🔄 New apiData state after energy label (null):', newState);
          return newState;
        });

        // Only set as warning if it's a real API error, not just "not found"
        if (result.error &&
            !result.error.toLowerCase().includes('not found') &&
            !result.error.includes('404') &&
            !result.error.toLowerCase().includes('geen energielabel gevonden')) {
          setErrors(prev => ({
            ...prev,
            energy: `Waarschuwing: ${result.error}`
          }));
        }
      }
    } catch (error) {
      console.error('❌ Energy label API error:', error);
      // Network errors or real API failures
      setErrors(prev => ({
        ...prev,
        energy: `API fout: ${error.message || 'Kon energielabel API niet bereiken'}`
      }));
      setApiData(prev => ({ ...prev, energyLabel: null }));
    } finally {
      setLoadingState(prev => ({ ...prev, energy: false }));
    }
  };

  const fetchAllData = useCallback(async () => {
    await Promise.allSettled([
      fetchLocationData(),
      fetchReferenceData(),
      fetchWOZData(),
      fetchEnergyLabel()
    ]);
  }, [addressData]);

  const runAIAnalysis = useCallback(async () => {
    setLoadingState(prev => ({ ...prev, ai: true }));
    setStep(3);
    setErrors(prev => ({ ...prev, ai: null }));

    try {
      const response = await fetch('/api/ai-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
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
  }, [apiData, addressData]);

  const formatCurrency = useCallback((value) => {
    if (!value || isNaN(value)) return value;
    return new Intl.NumberFormat('nl-NL', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  }, []);

  const isFormValid = useMemo(() =>
    addressData.street && addressData.streetNumber && addressData.city && addressData.postalCode,
    [addressData]
  );

  const resetAnalysis = useCallback(() => {
    setStep(1);
    setApiData({ locationData: null, referenceData: null, wozData: null, energyLabel: null });
    setAiAnalysis(null);
    setErrors({});
    setAddressData({
      street: '',
      streetNumber: '',
      addition: '',
      city: '',
      postalCode: ''
    });
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-slate-200/60 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                  DIDO Analytics
                </h1>
                <p className="text-sm text-slate-500">Real Estate Investment Analyzer</p>
              </div>
            </div>
            {step > 1 && (
              <button
                onClick={resetAnalysis}
                className="text-sm bg-slate-100 text-slate-600 px-3 py-2 rounded-lg hover:bg-slate-200 transition-colors"
              >
                Nieuwe Analyse
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Step 1: Address Input */}
        {step === 1 && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-8">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MapPin className="w-8 h-8 text-blue-600" />
                </div>
                <h2 className="text-2xl font-bold text-slate-800 mb-2">Voer het adres in</h2>
                <p className="text-slate-600 mb-4">Start je analyse door het adres van de woning in te voeren</p>

                <button
                  type="button"
                  onClick={fillDefaultAddress}
                  className="inline-flex items-center space-x-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2 rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all duration-200 text-sm font-medium shadow-lg shadow-purple-500/25"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Demo: Westerstraat 72-1</span>
                </button>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Straatnaam
                    </label>
                    <input
                      type="text"
                      value={addressData.street}
                      onChange={(e) => handleInputChange('street', e.target.value)}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      placeholder="Bijv. Kalverstraat"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Huisnummer
                    </label>
                    <input
                      type="text"
                      value={addressData.streetNumber}
                      onChange={(e) => handleInputChange('streetNumber', e.target.value)}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      placeholder="Bijv. 72"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Toevoeging <span className="text-slate-400">(optioneel)</span>
                    </label>
                    <input
                      type="text"
                      value={addressData.addition}
                      onChange={(e) => handleInputChange('addition', e.target.value)}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      placeholder="Bijv. 1, A, bis"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Plaats
                    </label>
                    <input
                      type="text"
                      value={addressData.city}
                      onChange={(e) => handleInputChange('city', e.target.value)}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      placeholder="Bijv. Amsterdam"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Postcode
                    </label>
                    <input
                      type="text"
                      value={addressData.postalCode}
                      onChange={(e) => handleInputChange('postalCode', e.target.value)}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      placeholder="Bijv. 1012 NP"
                    />
                  </div>
                </div>

                <button
                  onClick={handleAddressSubmit}
                  disabled={!isFormValid}
                  className={`w-full py-3 px-6 rounded-lg font-medium transition-all duration-200 ${
                    isFormValid
                      ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-500/25'
                      : 'bg-slate-300 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  Start Analyse →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Data Fetching */}
        {step === 2 && (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-slate-800 mb-2">Data verzamelen</h2>
              <p className="text-slate-600">
                {addressData.street} {addressData.streetNumber}{addressData.addition && `-${addressData.addition}`}, {addressData.city}
              </p>
            </div>

            <APIStatusGrid
              loadingState={loadingState}
              apiData={apiData}
              errors={errors}
              formatCurrency={formatCurrency}
            />

            <div className="text-center">
              <button
                onClick={runAIAnalysis}
                disabled={Object.values(loadingState).some(loading => loading)}
                className={`py-3 px-8 rounded-lg font-medium transition-all duration-200 ${
                  Object.values(loadingState).some(loading => loading)
                    ? 'bg-slate-400 text-white cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-500/25'
                }`}
              >
                {Object.values(loadingState).some(loading => loading) ? 'Data ophalen...' : 'Start AI Analyse →'}
              </button>
            </div>
          </div>
        )}

        {/* Step 3: AI Analysis */}
        {step === 3 && (
          <div>
            {/* DEBUG: Show raw apiData state */}
            <div className="mb-4 p-4 bg-yellow-100 rounded">
              <h4 className="font-bold">🐛 DEBUG - Raw apiData State:</h4>
              <pre className="text-xs overflow-auto max-h-32">
                {JSON.stringify(apiData, null, 2)}
              </pre>
            </div>

            <AIAnalysisSection
              loadingState={loadingState}
              aiAnalysis={aiAnalysis}
              apiData={apiData}
              errors={errors}
              formatCurrency={formatCurrency}
              resetAnalysis={resetAnalysis}
            />
          </div>
        )}
      </div>
    </div>
  );
}

// Separate component for API status grid
function APIStatusGrid({ loadingState, apiData, errors, formatCurrency }) {
  const apiConfigs = [
    {
      key: 'location',
      dataKey: 'location', // Changed from 'locationData'
      icon: MapPin,
      title: 'Locatie Data',
      color: 'blue',
      extractInfo: (data) => data ? [
        `Type: ${data.property_type || data.raw_data?.HouseType || 'N/A'}`,
        `Bouwjaar: ${data.build_year || data.raw_data?.BuildYear || 'N/A'}`,
        `Oppervlakte: ${data.inner_surface_area ? `${data.inner_surface_area} m²` : (data.raw_data?.InnerSurfaceArea ? `${data.raw_data.InnerSurfaceArea} m²` : 'N/A')}`
      ] : null
    },
    {
      key: 'reference',
      dataKey: 'reference', // Changed from 'referenceData'
      icon: Building2,
      title: 'Referentie',
      color: 'purple',
      extractInfo: (data) => data?.referenceData ? [
        `Referenties: ${data.referenceData.referenceCount || data.referenceData.referenceHouses?.length || 0}`,
        `Prijsrange: ${data.referenceData.referencePriceMean || 'N/A'}`
      ] : null
    },
    {
      key: 'woz',
      dataKey: 'woz', // Changed from 'wozData'
      icon: DollarSign,
      title: 'WOZ Waarde',
      color: 'green',
      extractInfo: (data) => data ? [
        `WOZ: ${data.formattedCurrentWoz || formatCurrency(data.currentWozValue) || 'N/A'}`,
        `Oppervlakte: ${data.outerSurfaceArea ? `${data.outerSurfaceArea} m²` : 'N/A'}`
      ] : null
    },
    {
      key: 'energy',
      dataKey: 'energyLabel', // This stays the same
      icon: Zap,
      title: 'Energielabel',
      color: 'yellow',
      extractInfo: (data) => data ? [
        `Label: ${data.energy_class || 'N/A'}`,
        `Oppervlakte: ${data.floor_area ? `${data.floor_area} m²` : 'N/A'}`
      ] : ['Geen energielabel beschikbaar', 'Dit is normaal voor sommige woningen']
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {apiConfigs.map(config => {
        const Icon = config.icon;
        const isLoading = loadingState[config.key];
        const hasData = apiData[config.dataKey];
        const hasError = errors[config.key];
        const info = config.extractInfo(hasData);

        // Special handling for energy label - missing is not an error
        const isEnergyLabel = config.key === 'energy';
        const showWarningIcon = hasError && !isEnergyLabel;

        return (
          <div key={config.key} className="bg-white rounded-lg border border-slate-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <Icon className={`w-5 h-5 text-${config.color}-600`} />
                <span className="font-medium">{config.title}</span>
              </div>
              {isLoading ? (
                <Loader2 className={`w-4 h-4 animate-spin text-${config.color}-600`} />
              ) : hasData ? (
                <CheckCircle className="w-4 h-4 text-green-600" />
              ) : showWarningIcon ? (
                <AlertTriangle className="w-4 h-4 text-red-600" />
              ) : (
                <div className="w-4 h-4 rounded-full bg-slate-300"></div>
              )}
            </div>

            {info && (
              <div className="text-sm text-slate-600 space-y-1">
                {info.map((line, index) => (
                  <div key={index}>{line}</div>
                ))}
              </div>
            )}

            {hasError && !isEnergyLabel && (
              <div className="text-sm text-red-600">{hasError}</div>
            )}

            {hasError && isEnergyLabel && (
              <div className="text-sm text-amber-600">⚠️ {hasError}</div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// Separate component for AI Analysis section
function AIAnalysisSection({ loadingState, aiAnalysis, apiData, errors, formatCurrency, resetAnalysis }) {
  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
          {loadingState.ai ? (
            <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
          ) : (
            <Brain className="w-8 h-8 text-purple-600" />
          )}
        </div>
        <h2 className="text-2xl font-bold text-slate-800 mb-2">AI Analyse</h2>
        <p className="text-slate-600">
          {loadingState.ai ? 'AI analyseert de verzamelde data...' : 'Analyse compleet'}
        </p>
      </div>

      {aiAnalysis && (
        <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-8">
          <div className="mb-6">
            <h3 className="text-xl font-bold text-slate-800 mb-2">AI Vastgoedanalyse</h3>
            <div className="flex items-center space-x-4 text-sm text-slate-500">
              <span>Model: {aiAnalysis.metadata?.model_used || 'Unknown'}</span>
              <span>•</span>
              <span>Data bronnen: {aiAnalysis.metadata?.data_sources?.length || 0}</span>
              <span>•</span>
              <span>{new Date().toLocaleDateString('nl-NL')}</span>
            </div>
          </div>

          <div className="prose prose-slate max-w-none mb-8">
            <div className="bg-slate-50 p-6 rounded-lg">
              <div className="whitespace-pre-wrap text-slate-800 leading-relaxed">
                {aiAnalysis.raw_analysis}
              </div>
            </div>
          </div>

          <DataSourcesSection aiAnalysis={aiAnalysis} apiData={apiData} />

          <CompleteAPIDataViewer
            apiData={apiData}
            formatCurrency={formatCurrency}
            errors={errors}
          />

          {Object.keys(errors).some(key => errors[key]) && (
            <ErrorSection errors={errors} />
          )}

          <div className="mt-8 text-center">
            <button
              onClick={resetAnalysis}
              className="bg-slate-600 text-white py-3 px-8 rounded-lg hover:bg-slate-700 transition-colors font-medium shadow-lg shadow-slate-500/25"
            >
              Nieuwe Analyse Starten
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Component for data sources
function DataSourcesSection({ aiAnalysis, apiData }) {
  if (!aiAnalysis.metadata?.data_sources?.length) return null;

  // Add a note if energy label was found in other APIs
  const hasEnergyLabelInLocation = apiData.locationData?.Output?.EnergyLabel;
  const hasEnergyLabelInReference = apiData.referenceData?.GivenHouse?.EnergyLabel?.DefinitiveEnergyLabel;
  const hasDirectEnergyLabel = apiData.energyLabel;

  const energyLabelNote = (!hasDirectEnergyLabel && (hasEnergyLabelInLocation || hasEnergyLabelInReference))
    ? "⚡ Energielabel gevonden in andere data bronnen"
    : null;

  return (
    <div className="mb-8 pt-6 border-t border-slate-200">
      <h4 className="font-medium text-slate-700 mb-4">Gebruikte Data Bronnen</h4>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
        {aiAnalysis.metadata.data_sources.map((source, index) => (
          <div key={index} className="bg-slate-50 p-3 rounded-lg">
            <div className="font-medium text-slate-800">{source}</div>
          </div>
        ))}
        {energyLabelNote && (
          <div className="bg-blue-50 p-3 rounded-lg">
            <div className="text-blue-700 text-xs">{energyLabelNote}</div>
          </div>
        )}
      </div>
    </div>
  );
}

// Component for error display
function ErrorSection({ errors }) {
  return (
    <div className="mt-6 pt-6 border-t border-slate-200">
      <h4 className="font-medium text-slate-700 mb-3">Waarschuwingen</h4>
      <div className="space-y-2">
        {Object.entries(errors).map(([key, error]) => error && (
          <div key={key} className="flex items-center space-x-2 text-amber-700 bg-amber-50 p-3 rounded-lg">
            <AlertTriangle className="w-4 h-4" />
            <span className="capitalize">{key}:</span>
            <span>{error}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Advanced recursive data renderer with proper TypeScript-like handling
function DataRenderer({ data, depth = 0, path = '', onCopy }) {
  const [isCollapsed, setIsCollapsed] = useState(depth > 2);

  const formatKey = useCallback((key) => {
    return key
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .replace(/_/g, ' ')
      .replace(/([a-z])([A-Z])/g, '$1 $2');
  }, []);

  const formatValue = useCallback((value) => {
    if (typeof value === 'number' && value > 1000 && value < 1000000000) {
      return new Intl.NumberFormat('nl-NL', {
        style: 'currency',
        currency: 'EUR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(value);
    }
    if (typeof value === 'string' && value.match(/^\d{4}-\d{2}-\d{2}/)) {
      return new Date(value).toLocaleDateString('nl-NL');
    }
    return value;
  }, []);

  const copyToClipboard = useCallback((content) => {
    navigator.clipboard.writeText(JSON.stringify(content, null, 2));
    if (onCopy) onCopy();
  }, [onCopy]);

  if (data === null || data === undefined) {
    return <span className="text-slate-400 text-sm italic">Niet beschikbaar</span>;
  }

  if (Array.isArray(data)) {
    if (data.length === 0) {
      return <span className="text-slate-400 text-sm italic">Lege array</span>;
    }

    return (
      <div className="space-y-2">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="flex items-center space-x-1 text-xs text-slate-500 hover:text-slate-700"
          >
            {isCollapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            <span>{data.length} items</span>
          </button>
          <button
            onClick={() => copyToClipboard(data)}
            className="text-xs text-slate-400 hover:text-slate-600"
          >
            <Copy className="w-3 h-3" />
          </button>
        </div>
        {!isCollapsed && (
          <div className="ml-4 space-y-2 border-l-2 border-slate-200 pl-3">
            {data.slice(0, 10).map((item, index) => (
              <div key={index}>
                <div className="text-xs text-slate-400 mb-1">#{index + 1}</div>
                <DataRenderer
                  data={item}
                  depth={depth + 1}
                  path={`${path}[${index}]`}
                  onCopy={onCopy}
                />
              </div>
            ))}
            {data.length > 10 && (
              <div className="text-xs text-slate-400 italic">
                ... en {data.length - 10} meer items
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  if (typeof data === 'object') {
    const entries = Object.entries(data);
    const importantKeys = entries.filter(([key]) =>
      !key.startsWith('_') &&
      !key.toLowerCase().includes('id') &&
      !key.toLowerCase().includes('timestamp')
    );
    const metaKeys = entries.filter(([key]) =>
      key.startsWith('_') ||
      key.toLowerCase().includes('id') ||
      key.toLowerCase().includes('timestamp')
    );

    return (
      <div className="space-y-3">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="flex items-center space-x-1 text-xs text-slate-500 hover:text-slate-700"
          >
            {isCollapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            <span>{entries.length} eigenschappen</span>
          </button>
          <button
            onClick={() => copyToClipboard(data)}
            className="text-xs text-slate-400 hover:text-slate-600"
          >
            <Copy className="w-3 h-3" />
          </button>
        </div>

        {!isCollapsed && (
          <div className="ml-4 space-y-3 border-l-2 border-slate-200 pl-4">
            {/* Important data first */}
            {importantKeys.map(([key, value]) => (
              <div key={key}>
                <div className="flex items-start justify-between mb-1">
                  <span className={`${depth === 0 ? 'font-semibold text-slate-800' : 'font-medium text-slate-700'} text-sm`}>
                    {formatKey(key)}:
                  </span>
                </div>
                <div className="ml-2">
                  <DataRenderer
                    data={value}
                    depth={depth + 1}
                    path={`${path}.${key}`}
                    onCopy={onCopy}
                  />
                </div>
              </div>
            ))}

            {/* Meta data collapsed by default */}
            {metaKeys.length > 0 && (
              <details className="text-xs">
                <summary className="text-slate-400 cursor-pointer hover:text-slate-600">
                  Metadata ({metaKeys.length} items)
                </summary>
                <div className="mt-2 ml-2 space-y-2">
                  {metaKeys.map(([key, value]) => (
                    <div key={key}>
                      <span className="text-slate-500">{formatKey(key)}:</span>
                      <div className="ml-2">
                        <DataRenderer
                          data={value}
                          depth={depth + 2}
                          path={`${path}.${key}`}
                          onCopy={onCopy}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </details>
            )}
          </div>
        )}
      </div>
    );
  }

  // Primitive values with enhanced formatting
  const displayValue = formatValue(data);
  const isLongText = typeof data === 'string' && data.length > 100;
  const [showFullText, setShowFullText] = useState(false);

  return (
    <div className="flex items-start space-x-2">
      <span className={`${depth === 0 ? 'text-slate-800 font-medium' : 'text-slate-600'} text-sm break-all`}>
        {isLongText && !showFullText
          ? `${String(displayValue).substring(0, 100)}...`
          : String(displayValue)
        }
      </span>
      {isLongText && (
        <button
          onClick={() => setShowFullText(!showFullText)}
          className="text-xs text-blue-500 hover:text-blue-700 flex-shrink-0"
        >
          {showFullText ? 'Minder' : 'Meer'}
        </button>
      )}
      <button
        onClick={() => copyToClipboard(data)}
        className="text-xs text-slate-300 hover:text-slate-500 flex-shrink-0"
      >
        <Copy className="w-3 h-3" />
      </button>
    </div>
  );
}

// Complete API Data Viewer with advanced features
function CompleteAPIDataViewer({ apiData, formatCurrency, errors }) {
  const [expandedSections, setExpandedSections] = useState({
    locationData: false,
    referenceData: false,
    wozData: false,
    energyLabel: false
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [showOnlyWithData, setShowOnlyWithData] = useState(false); // Changed default to false
  const [copyFeedback, setCopyFeedback] = useState('');

  const toggleSection = useCallback((section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  }, []);

  const toggleAllSections = useCallback((expand) => {
    setExpandedSections(prev =>
      Object.keys(prev).reduce((acc, key) => ({ ...acc, [key]: expand }), {})
    );
  }, []);

  const handleCopy = useCallback(() => {
    setCopyFeedback('Gekopieerd!');
    setTimeout(() => setCopyFeedback(''), 2000);
  }, []);

  const exportData = useCallback(() => {
    const dataToExport = {
      timestamp: new Date().toISOString(),
      apiData,
      errors: Object.keys(errors).filter(key => errors[key]).length > 0 ? errors : undefined
    };

    const dataStr = JSON.stringify(dataToExport, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `dido-analytics-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();

    URL.revokeObjectURL(url);
  }, [apiData, errors]);

  const dataCategories = useMemo(() => [
    {
      key: 'locationData',
      title: 'Altum Locatie Data',
      icon: '📍',
      color: 'blue',
      data: apiData.locationData,
      priority: 'high'
    },
    {
      key: 'referenceData',
      title: 'Altum Referentie Data',
      icon: '🏠',
      color: 'purple',
      data: apiData.referenceData,
      priority: 'high'
    },
    {
      key: 'wozData',
      title: 'WOZ Data',
      icon: '💰',
      color: 'green',
      data: apiData.wozData,
      priority: 'high'
    },
    {
      key: 'energyLabel',
      title: 'Energielabel Data',
      icon: '⚡',
      color: 'yellow',
      data: apiData.energyLabel,
      priority: 'medium'
    }
  ].filter(category => {
    const matchesSearch = !searchTerm ||
      category.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      JSON.stringify(category.data || {}).toLowerCase().includes(searchTerm.toLowerCase());
    const hasData = !showOnlyWithData || category.data;
    return matchesSearch && hasData;
  }), [apiData, searchTerm, showOnlyWithData]);

  return (
    <div className="mt-8 pt-6 border-t border-slate-200">
      {/* Header with controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 space-y-4 sm:space-y-0">
        <div>
          <h4 className="font-semibold text-slate-800 text-lg">Complete API Data</h4>
          <p className="text-sm text-slate-500">Volledige technische data van alle API calls</p>
        </div>

        <div className="flex flex-wrap items-center space-x-2 space-y-2 sm:space-y-0">
          {copyFeedback && (
            <div className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded">
              {copyFeedback}
            </div>
          )}

          <div className="flex items-center space-x-2">
            <input
              type="text"
              placeholder="Zoek in data..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="text-xs border border-slate-300 rounded px-2 py-1 w-32"
            />
            <button
              onClick={() => setShowOnlyWithData(!showOnlyWithData)}
              className={`text-xs px-2 py-1 rounded transition-colors ${
                showOnlyWithData
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {showOnlyWithData ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
            </button>
          </div>

          <div className="flex space-x-2">
            <button
              onClick={() => toggleAllSections(true)}
              className="text-xs bg-slate-100 text-slate-600 px-3 py-1 rounded hover:bg-slate-200 transition-colors"
            >
              Alles Uitklappen
            </button>
            <button
              onClick={() => toggleAllSections(false)}
              className="text-xs bg-slate-100 text-slate-600 px-3 py-1 rounded hover:bg-slate-200 transition-colors"
            >
              Alles Inklappen
            </button>
            <button
              onClick={exportData}
              className="text-xs bg-blue-100 text-blue-600 px-3 py-1 rounded hover:bg-blue-200 transition-colors flex items-center space-x-1"
            >
              <Download className="w-3 h-3" />
              <span>Export</span>
            </button>
          </div>
        </div>
      </div>

      {/* Data categories */}
      <div className="space-y-4">
        {dataCategories.map(category => (
          <DataCategoryCard
            key={category.key}
            category={category}
            isExpanded={expandedSections[category.key]}
            onToggle={() => toggleSection(category.key)}
            onCopy={handleCopy}
            error={errors[category.key.replace('Data', '')]}
          />
        ))}

        {dataCategories.length === 0 && (
          <div className="text-center py-12 text-slate-500">
            <div className="text-4xl mb-4">🔍</div>
            <div className="font-medium mb-2">Geen data gevonden</div>
            <div className="text-sm">
              {searchTerm ? 'Pas je zoekterm aan of' : ''}
              {showOnlyWithData ? ' schakel "Toon alles" in.' : ' er is geen data beschikbaar.'}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Individual data category card
function DataCategoryCard({ category, isExpanded, onToggle, onCopy, error }) {
  const hasData = Boolean(category.data);
  const dataSize = category.data ? JSON.stringify(category.data).length : 0;

  // DEBUG LOG
  console.log(`=== ${category.title} CARD DEBUG ===`);
  console.log('hasData:', hasData);
  console.log('category.data:', category.data);
  console.log('dataSize:', dataSize);
  console.log('error:', error);

  return (
    <div className="bg-white border border-slate-200 rounded-lg overflow-hidden hover:shadow-sm transition-shadow">
      <button
        onClick={onToggle}
        className="w-full px-4 py-3 bg-gradient-to-r from-slate-50 to-slate-50 hover:from-slate-100 hover:to-slate-100 transition-colors flex items-center justify-between"
      >
        <div className="flex items-center space-x-3">
          <span className="text-xl">{category.icon}</span>
          <div className="text-left">
            <div className="font-medium text-slate-800">{category.title}</div>
            <div className="text-xs text-slate-500 flex items-center space-x-2">
              <span className={`px-2 py-0.5 rounded-full ${
                hasData
                  ? 'bg-green-100 text-green-700'
                  : 'bg-red-100 text-red-700'
              }`}>
                {hasData ? 'Data beschikbaar' : 'Geen data'}
              </span>
              {hasData && (
                <span>{(dataSize / 1024).toFixed(1)}kb data</span>
              )}
              {error && (
                <span className="text-red-600">• Fout: {error}</span>
              )}
              {/* DEBUG INFO */}
              <span className="text-blue-600 text-xs">DEBUG: {category.data ? typeof category.data : 'null/undefined'}</span>
            </div>
          </div>
        </div>

        <div className={`transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
          <ChevronDown className="w-4 h-4 text-slate-500" />
        </div>
      </button>

      {isExpanded && (
        <div className="p-4 border-t border-slate-200 bg-slate-25 max-h-96 overflow-y-auto">
          {hasData ? (
            <div>
              <div className="text-xs bg-yellow-100 p-2 rounded mb-2">
                <strong>DEBUG RAW DATA:</strong><br/>
                <pre className="text-xs overflow-auto">{JSON.stringify(category.data, null, 2).substring(0, 500)}...</pre>
              </div>
              <DataRenderer
                data={category.data}
                onCopy={onCopy}
              />
            </div>
          ) : (
            <div className="text-center py-8 text-slate-500">
              <div className="text-2xl mb-2">📋</div>
              <div className="font-medium">Geen data beschikbaar</div>
              <div className="text-sm">Deze API heeft geen data geretourneerd</div>
              <div className="text-xs bg-red-100 p-2 rounded mt-2">
                <strong>DEBUG:</strong><br/>
                category.data = {JSON.stringify(category.data)}<br/>
                typeof = {typeof category.data}
              </div>
              {error && (
                <div className="mt-2 text-sm text-red-600 bg-red-50 p-2 rounded">
                  Fout: {error}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
import React, { useState } from 'react';
import { Building2, MapPin, DollarSign, Zap, Brain, Loader2, CheckCircle, AlertTriangle, Sparkles } from 'lucide-react';


export default function RealEstateAnalyzer() {
  const [step, setStep] = useState(1); // 1: Address, 2: Data Fetching, 3: AI Analysis
  const [addressData, setAddressData] = useState({
    street: '',
    streetNumber: '',
    addition: '', // For letters/additions like "A", "1", "bis", etc.
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

  // Fill with default address
  const fillDefaultAddress = () => {
    setAddressData(defaultAddress);
  };

  // Step 1: Handle address input
  const handleAddressSubmit = () => {
    if (addressData.street && addressData.streetNumber && addressData.city && addressData.postalCode) {
      setStep(2);
      fetchAllData();
    }
  };

  const handleInputChange = (field, value) => {
    setAddressData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Step 2: Fetch all API data
  const fetchAllData = async () => {
    await Promise.all([
      fetchLocationData(),
      fetchReferenceData(),
      fetchWOZData(),
      fetchEnergyLabel()
    ]);
  };

  const fetchLocationData = async () => {
    setLoadingState(prev => ({ ...prev, location: true }));
    try {
      const response = await fetch('/api/altum-location', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(addressData)
      });
      const result = await response.json();
      if (result.success) {
        setApiData(prev => ({ ...prev, locationData: result.data }));
      } else {
        setErrors(prev => ({ ...prev, location: result.error }));
      }
    } catch (error) {
      setErrors(prev => ({ ...prev, location: error.message }));
    } finally {
      setLoadingState(prev => ({ ...prev, location: false }));
    }
  };

  const fetchReferenceData = async () => {
    setLoadingState(prev => ({ ...prev, reference: true }));
    try {
      const response = await fetch('/api/altum-reference', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(addressData)
      });
      const result = await response.json();
      if (result.success) {
        setApiData(prev => ({ ...prev, referenceData: result.data }));
      } else {
        setErrors(prev => ({ ...prev, reference: result.error }));
      }
    } catch (error) {
      setErrors(prev => ({ ...prev, reference: error.message }));
    } finally {
      setLoadingState(prev => ({ ...prev, reference: false }));
    }
  };

  const fetchWOZData = async () => {
    setLoadingState(prev => ({ ...prev, woz: true }));
    try {
      const response = await fetch('/api/altum-woz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(addressData)
      });
      const result = await response.json();
      if (result.success) {
        setApiData(prev => ({ ...prev, wozData: result.data }));
      } else {
        setErrors(prev => ({ ...prev, woz: result.error }));
      }
    } catch (error) {
      setErrors(prev => ({ ...prev, woz: error.message }));
    } finally {
      setLoadingState(prev => ({ ...prev, woz: false }));
    }
  };

  const fetchEnergyLabel = async () => {
    setLoadingState(prev => ({ ...prev, energy: true }));
    try {
      // Parse the address properly for energy label API
      const baseHuisnummer = addressData.streetNumber.match(/^\d+/)?.[0];
      let huisletter = null;
      let huisnummertoevoeging = null;

      // Check if addition exists
      if (addressData.addition && addressData.addition.trim()) {
        const addition = addressData.addition.trim();
        // If it's a single letter, it's a huisletter
        if (addition.match(/^[A-Z]$/i)) {
          huisletter = addition.toUpperCase();
        } else {
          // Otherwise, it's a toevoeging
          huisnummertoevoeging = addition;
        }
      }

      const requestData = {
        postcode: addressData.postalCode.replace(/\s/g, ''),
        huisnummer: baseHuisnummer
      };

      if (huisletter) {
        requestData.huisletter = huisletter;
      }
      if (huisnummertoevoeging) {
        requestData.huisnummertoevoeging = huisnummertoevoeging;
      }

      const response = await fetch('/api/energy-label', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData)
      });
      const result = await response.json();
      if (result.success) {
        setApiData(prev => ({ ...prev, energyLabel: result.data }));
      } else {
        setErrors(prev => ({ ...prev, energy: result.error }));
      }
    } catch (error) {
      setErrors(prev => ({ ...prev, energy: error.message }));
    } finally {
      setLoadingState(prev => ({ ...prev, energy: false }));
    }
  };

  // Step 3: Send to AI for analysis
  const runAIAnalysis = async () => {
    setLoadingState(prev => ({ ...prev, ai: true }));
    setStep(3);
    try {
      // TODO: Replace with actual AI service call
      // For now, simulate AI analysis
      setTimeout(() => {
        setAiAnalysis({
          investmentScore: 7.8,
          estimatedRentYield: 4.2,
          marketAnalysis: "This property shows strong investment potential based on location data and comparable properties in the area.",
          riskFactors: ["Energy efficiency could be improved", "Market competition moderate"],
          recommendations: ["Consider renovation for energy improvement", "Market timing is favorable"]
        });
        setLoadingState(prev => ({ ...prev, ai: false }));
      }, 3000);
    } catch (error) {
      setErrors(prev => ({ ...prev, ai: error.message }));
      setLoadingState(prev => ({ ...prev, ai: false }));
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('nl-NL', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  // Check if form is valid
  const isFormValid = addressData.street && addressData.streetNumber && addressData.city && addressData.postalCode;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-slate-200/60">
        <div className="max-w-6xl mx-auto px-6 py-4">
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

                {/* Demo Button */}
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

            {/* API Status Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Location Data */}
              <div className="bg-white rounded-lg border border-slate-200 p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <MapPin className="w-5 h-5 text-blue-600" />
                    <span className="font-medium">Locatie Data</span>
                  </div>
                  {loadingState.location ? (
                    <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                  ) : apiData.locationData ? (
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  ) : errors.location ? (
                    <AlertTriangle className="w-4 h-4 text-red-600" />
                  ) : null}
                </div>
                {apiData.locationData && (
                  <div className="text-sm text-slate-600">
                    <div>Buurt: {apiData.locationData.neighborhood || 'N/A'}</div>
                    <div>Type: {apiData.locationData.property_type || 'N/A'}</div>
                  </div>
                )}
                {errors.location && (
                  <div className="text-sm text-red-600">{errors.location}</div>
                )}
              </div>

              {/* Reference Data */}
              <div className="bg-white rounded-lg border border-slate-200 p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <Building2 className="w-5 h-5 text-purple-600" />
                    <span className="font-medium">Referentie</span>
                  </div>
                  {loadingState.reference ? (
                    <Loader2 className="w-4 h-4 animate-spin text-purple-600" />
                  ) : apiData.referenceData ? (
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  ) : errors.reference ? (
                    <AlertTriangle className="w-4 h-4 text-red-600" />
                  ) : null}
                </div>
                {apiData.referenceData && (
                  <div className="text-sm text-slate-600">
                    <div>Vergelijkbare: {apiData.referenceData.comparable_count || 0}</div>
                    <div>Gem. prijs: {apiData.referenceData.avg_price ? formatCurrency(apiData.referenceData.avg_price) : 'N/A'}</div>
                  </div>
                )}
                {errors.reference && (
                  <div className="text-sm text-red-600">{errors.reference}</div>
                )}
              </div>

              {/* WOZ Data */}
              <div className="bg-white rounded-lg border border-slate-200 p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <DollarSign className="w-5 h-5 text-green-600" />
                    <span className="font-medium">WOZ Waarde</span>
                  </div>
                  {loadingState.woz ? (
                    <Loader2 className="w-4 h-4 animate-spin text-green-600" />
                  ) : apiData.wozData ? (
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  ) : errors.woz ? (
                    <AlertTriangle className="w-4 h-4 text-red-600" />
                  ) : null}
                </div>
                {apiData.wozData && (
                  <div className="text-sm text-slate-600">
                    <div>WOZ: {apiData.wozData.woz_value ? formatCurrency(apiData.wozData.woz_value) : 'N/A'}</div>
                    <div>Jaar: {apiData.wozData.woz_year || 'N/A'}</div>
                  </div>
                )}
                {errors.woz && (
                  <div className="text-sm text-red-600">{errors.woz}</div>
                )}
              </div>

              {/* Energy Label */}
              <div className="bg-white rounded-lg border border-slate-200 p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <Zap className="w-5 h-5 text-yellow-600" />
                    <span className="font-medium">Energielabel</span>
                  </div>
                  {loadingState.energy ? (
                    <Loader2 className="w-4 h-4 animate-spin text-yellow-600" />
                  ) : apiData.energyLabel ? (
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  ) : errors.energy ? (
                    <AlertTriangle className="w-4 h-4 text-red-600" />
                  ) : null}
                </div>
                {apiData.energyLabel && (
                  <div className="text-sm text-slate-600">
                    <div>Label: {apiData.energyLabel.energy_class || 'N/A'}</div>
                    <div>Oppervlakte: {apiData.energyLabel.floor_area ? `${apiData.energyLabel.floor_area} m²` : 'N/A'}</div>
                  </div>
                )}
                {errors.energy && (
                  <div className="text-sm text-red-600">{errors.energy}</div>
                )}
              </div>
            </div>

            {/* Continue to AI Analysis */}
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
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Key Metrics */}
                  <div className="lg:col-span-1">
                    <h3 className="text-lg font-bold text-slate-800 mb-4">Belangrijkste Cijfers</h3>
                    <div className="space-y-4">
                      <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-lg">
                        <div className="text-sm text-slate-600">Investment Score</div>
                        <div className="text-2xl font-bold text-blue-600">{aiAnalysis.investmentScore}/10</div>
                      </div>
                      <div className="bg-gradient-to-r from-green-50 to-green-100 p-4 rounded-lg">
                        <div className="text-sm text-slate-600">Geschat Huurrendement</div>
                        <div className="text-2xl font-bold text-green-600">{aiAnalysis.estimatedRentYield}%</div>
                      </div>
                    </div>
                  </div>

                  {/* Analysis Details */}
                  <div className="lg:col-span-2">
                    <h3 className="text-lg font-bold text-slate-800 mb-4">Analyse Details</h3>
                    <div className="space-y-6">
                      <div>
                        <h4 className="font-medium text-slate-700 mb-2">Marktanalyse</h4>
                        <p className="text-slate-600">{aiAnalysis.marketAnalysis}</p>
                      </div>
                      <div>
                        <h4 className="font-medium text-slate-700 mb-2">Risicofactoren</h4>
                        <ul className="space-y-1">
                          {aiAnalysis.riskFactors.map((risk, index) => (
                            <li key={index} className="flex items-center space-x-2 text-slate-600">
                              <div className="w-2 h-2 bg-amber-400 rounded-full"></div>
                              <span>{risk}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-medium text-slate-700 mb-2">Aanbevelingen</h4>
                        <ul className="space-y-1">
                          {aiAnalysis.recommendations.map((rec, index) => (
                            <li key={index} className="flex items-center space-x-2 text-slate-600">
                              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                              <span>{rec}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Used Statistics */}
                <div className="mt-8 pt-8 border-t border-slate-200">
                  <h3 className="text-lg font-bold text-slate-800 mb-4">Gebruikte Statistieken</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                    {apiData.locationData && (
                      <div className="bg-slate-50 p-3 rounded">
                        <div className="font-medium">Locatie Data</div>
                        <div className="text-slate-600">Buurt, type woning</div>
                      </div>
                    )}
                    {apiData.referenceData && (
                      <div className="bg-slate-50 p-3 rounded">
                        <div className="font-medium">Referentiewoningen</div>
                        <div className="text-slate-600">Vergelijkbare verkopen</div>
                      </div>
                    )}
                    {apiData.wozData && (
                      <div className="bg-slate-50 p-3 rounded">
                        <div className="font-medium">WOZ Waardering</div>
                        <div className="text-slate-600">{formatCurrency(apiData.wozData.woz_value)}</div>
                      </div>
                    )}
                    {apiData.energyLabel && (
                      <div className="bg-slate-50 p-3 rounded">
                        <div className="font-medium">Energielabel</div>
                        <div className="text-slate-600">Klasse {apiData.energyLabel.energy_class}</div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Reset Button */}
                <div className="mt-8 text-center">
                  <button
                    onClick={() => {
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
                    }}
                    className="bg-slate-600 text-white py-3 px-8 rounded-lg hover:bg-slate-700 transition-colors font-medium shadow-lg shadow-slate-500/25"
                  >
                    Nieuwe Analyse Starten
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
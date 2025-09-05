// components/StepComponents.js
import React, { useState, useCallback } from 'react';
import {
  MapPin,
  Building2,
  DollarSign,
  Zap,
  Brain,
  Loader2,
  CheckCircle,
  AlertTriangle,
  Sparkles,
  Search,
  Home
} from 'lucide-react';

// Import area components from separate file
import { AreaDataFetchingStep } from './AreaComponents';

// Address Form Component with Tab System
export function AddressForm({
  addressData,
  onInputChange,
  onSubmit,
  isFormValid,
  // New props for tab system
  analysisMode = 'individual',
  onAnalysisModeChange,
  postalCodeData,
  onPostalCodeChange,
  onPostalCodeSubmit,
  isPostalCodeValid
}) {
  const defaultAddress = {
    street: 'Westerstraat',
    streetNumber: '1',
    addition: '1',
    city: 'Amsterdam',
    postalCode: '1234AB'
  };

  const fillDefaultAddress = useCallback(() => {
    Object.entries(defaultAddress).forEach(([key, value]) => {
      onInputChange(key, value);
    });
  }, [onInputChange]);

  const fillDefaultPostalCode = useCallback(() => {
    onPostalCodeChange('1015MN');
  }, [onPostalCodeChange]);

  // Tab configuration
  const tabs = [
    {
      id: 'individual',
      label: 'Individueel Pand',
      icon: Home,
      description: 'Analyseer één specifiek pand'
    },
    {
      id: 'area',
      label: 'Gebied Analyse',
      icon: Search,
      description: 'Analyseer alle panden in een postcode'
    }
  ];

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-8">
        {/* Tab Navigation */}
        <div className="mb-8">
          <div className="flex space-x-1 bg-slate-100 p-1 rounded-lg">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = analysisMode === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => onAnalysisModeChange(tab.id)}
                  className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-md font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-slate-600 hover:text-slate-800'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-sm">{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Tab Description */}
          <div className="mt-4 text-center">
            <p className="text-slate-600 text-sm">
              {tabs.find(tab => tab.id === analysisMode)?.description}
            </p>
          </div>
        </div>

        {/* Individual Property Form */}
        {analysisMode === 'individual' && (
          <>
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <MapPin className="w-8 h-8 text-blue-600" />
              </div>
              <h2 className="text-2xl font-bold text-slate-800 mb-2">Voer het adres in</h2>
              <p className="text-slate-600 mb-4">Start je analyse door het adres van de woning in te voeren</p>
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
                    onChange={(e) => onInputChange('street', e.target.value)}
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
                    onChange={(e) => onInputChange('streetNumber', e.target.value)}
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
                    onChange={(e) => onInputChange('addition', e.target.value)}
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
                    onChange={(e) => onInputChange('city', e.target.value)}
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
                    onChange={(e) => onInputChange('postalCode', e.target.value)}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="Bijv. 1012 NP"
                  />
                </div>
              </div>
              <button
                onClick={onSubmit}
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
          </>
        )}

        {/* Area Analysis Form */}
        {analysisMode === 'area' && (
          <>
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-slate-800 mb-2">Voer de postcode in</h2>
              <p className="text-slate-600 mb-4">Analyseer alle beschikbare panden in een postcode gebied</p>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Postcode
                </label>
                <input
                  type="text"
                  value={postalCodeData || ''}
                  onChange={(e) => onPostalCodeChange(e.target.value.toUpperCase())}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors text-center text-lg font-mono"
                  placeholder="Bijv. 1015MN"
                  maxLength={6}
                />
                <p className="text-sm text-slate-500 mt-2 text-center">
                  Voer een geldige Nederlandse postcode in (bijv. 1015MN)
                </p>
              </div>

              <button
                onClick={onPostalCodeSubmit}
                disabled={!isPostalCodeValid}
                className={`w-full py-3 px-6 rounded-lg font-medium transition-all duration-200 ${
                  isPostalCodeValid
                    ? 'bg-green-600 text-white hover:bg-green-700 shadow-lg shadow-green-500/25'
                    : 'bg-slate-300 text-slate-500 cursor-not-allowed'
                }`}
              >
                Start Gebied Analyse →
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// Updated Data Fetching Step - now routes to correct component
export function DataFetchingStep({
  addressData,
  loadingState,
  apiData,
  errors,
  formatCurrency,
  onRunAIAnalysis,
  // New props for area analysis
  analysisMode = 'individual',
  postalCode = ''
}) {
  // Route to appropriate component based on analysis mode
  if (analysisMode === 'area') {
    return (
      <AreaDataFetchingStep
        postalCode={postalCode}
        loadingState={loadingState}
        areaData={apiData}
        errors={errors}
        formatCurrency={formatCurrency}
        onRunAIAnalysis={onRunAIAnalysis}
      />
    );
  }

  // Individual property analysis (existing)
  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Data verzamelen</h2>
        <p className="text-slate-600">
          {addressData.street} {addressData.streetNumber}
          {addressData.addition && `-${addressData.addition}`}, {addressData.city}
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
          onClick={onRunAIAnalysis}
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
  );
}

// Simple AI Analysis Step Component (fallback)
export function AIAnalysisStep({
  loadingState,
  aiAnalysis,
  apiData,
  errors,
  formatCurrency,
  resetAnalysis
}) {
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
              <span>{new Date().toLocaleDateString('nl-NL')}</span>
              <span>•</span>
              <span>Analyse compleet</span>
            </div>
          </div>
          <div className="prose prose-slate max-w-none mb-8">
            <div className="bg-slate-50 p-6 rounded-lg">
              <div className="whitespace-pre-wrap text-slate-800 leading-relaxed">
                {aiAnalysis.raw_analysis}
              </div>
            </div>
          </div>
          {/* Only show significant errors */}
          {Object.values(errors).filter(error => error && !error.includes('energielabel')).length > 0 && (
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

// API Status Grid Component
export function APIStatusGrid({ loadingState, apiData, errors, formatCurrency }) {
  const apiConfigs = [
    {
      key: 'location',
      dataKey: 'locationData',
      icon: MapPin,
      title: 'Locatie Data',
      color: 'blue',
      extractInfo: (data) => data ? [
        `Type: ${data.property_type || data.raw_data?.HouseType || 'N/A'}`,
        `Bouwjaar: ${data.build_year || data.raw_data?.BuildYear || 'N/A'}`,
        `Oppervlakte: ${data.inner_surface_area ? `${data.inner_surface_area} m²` :
          (data.raw_data?.InnerSurfaceArea ? `${data.raw_data.InnerSurfaceArea} m²` : 'N/A')}`
      ] : null
    },
    {
      key: 'reference',
      dataKey: 'referenceData',
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
      dataKey: 'wozData',
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
      dataKey: 'energyLabel',
      icon: Zap,
      title: 'Energielabel',
      color: 'yellow',
      extractInfo: (data) => data ? [
        `Label: ${data.energy_class || 'N/A'}`,
        `Oppervlakte: ${data.floor_area ? `${data.floor_area} m²` : 'N/A'}`
      ] : ['Geen direct energielabel', 'Mogelijk beschikbaar via andere bronnen']
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
          </div>
        );
      })}
    </div>
  );
}

// Error Section - Only for significant errors
export function ErrorSection({ errors }) {
  const significantErrors = Object.entries(errors).filter(([key, error]) =>
    error && !error.toLowerCase().includes('energielabel')
  );

  if (significantErrors.length === 0) return null;

  return (
    <div className="mt-6 pt-6 border-t border-slate-200">
      <h4 className="font-medium text-slate-700 mb-3">Waarschuwingen</h4>
      <div className="space-y-2">
        {significantErrors.map(([key, error]) => (
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
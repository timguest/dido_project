import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Database, MapPin, TrendingUp, Users, DollarSign, Activity, AlertCircle, CheckCircle2, Info } from 'lucide-react';

const Step3CBSData = ({ addressData, bagData, onComplete, onBack, initialData }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [cbsData, setCbsData] = useState(initialData || null);
  const [debugInfo, setDebugInfo] = useState(null);

  // Auto-fetch CBS data when component mounts
  useEffect(() => {
    if (!cbsData && addressData?.municipality) {
      fetchCBSData();
    }
  }, [addressData?.municipality]);

  const fetchCBSData = async () => {
    if (!addressData?.municipality) {
      setError('Gemeente informatie ontbreekt uit vorige stap');
      return;
    }

    setLoading(true);
    setError(null);
    setDebugInfo(null);

    try {
      console.log('=== REAL CBS DATA FETCH ===');
      console.log('Municipality:', addressData.municipality);

      // Get REAL CBS data from multiple tables
      const cbsResult = await fetchRealCBSData(addressData.municipality);

      if (cbsResult.success) {
        setCbsData(cbsResult.data);
        setDebugInfo(cbsResult.debug);
        console.log('SUCCESS: Real CBS data retrieved');
      } else {
        throw new Error(cbsResult.error || 'Failed to fetch CBS data');
      }

    } catch (err) {
      console.error('CBS fetch error:', err);
      setError(`CBS data ophalen mislukt: ${err.message}`);

      // Show CORS info to user
      setDebugInfo({
        error: err.message,
        municipality: addressData.municipality,
        timestamp: new Date().toISOString(),
        corsInfo: 'Browser CORS blocks direct CBS API calls. Use server-side proxy for production.',
        realApiUrls: [
          `https://opendata.cbs.nl/ODataApi/odata4/83765NED/Observations?$filter=contains(RegioS,'${addressData.municipality}')`,
          `https://opendata.cbs.nl/ODataApi/odata4/85927ENG/Observations?$filter=contains(RegioS,'${addressData.municipality}')`,
          `https://opendata.cbs.nl/ODataApi/odata4/85036NED/Observations?$filter=contains(RegioS,'${addressData.municipality}')`
        ]
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchRealCBSData = async (municipality) => {
    console.log('Calling server-side CBS API for:', municipality);

    try {
      // Call our server-side API that handles CORS and real CBS data
      const response = await fetch(`/api/cbs-data?municipality=${encodeURIComponent(municipality)}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Server API failed: ${response.status}`);
      }

      const result = await response.json();
      console.log('Server-side CBS API result:', result);

      if (result.success) {
        return {
          success: true,
          data: result.data,
          debug: {
            ...result.debug,
            method: 'Server-side CBS API (Real Data)',
            corsResolved: true
          }
        };
      } else {
        throw new Error(result.error || 'Server-side CBS API failed');
      }
    } catch (err) {
      console.error('Server-side CBS API error:', err);
      return {
        success: false,
        error: `Server-side CBS API failed: ${err.message}`,
        debug: {
          municipality,
          serverError: err.message,
          solution: 'Check server-side API implementation and CBS API availability',
          timestamp: new Date().toISOString()
        }
      };
    }
  };



  const handleContinue = () => {
    if (cbsData) {
      onComplete(cbsData);
    }
  };

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-6 py-4">
        <div className="flex items-center space-x-3">
          <Database className="w-6 h-6 text-white" />
          <div>
            <h2 className="text-xl font-bold text-white">CBS Demografische Data</h2>
            <p className="text-green-100 text-sm">ECHTE data uit CBS APIs - Inkomen & Bevolkingsdichtheid</p>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Address Info */}
        <div className="mb-6 p-4 bg-slate-50 rounded-lg">
          <div className="flex items-center space-x-2 mb-2">
            <MapPin className="w-4 h-4 text-slate-500" />
            <span className="font-medium text-slate-700">Gemeente:</span>
            <span className="text-slate-900">{addressData?.municipality || 'Niet beschikbaar'}</span>
          </div>
          {bagData?.oppervlakte && (
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-4 h-4 text-slate-500" />
              <span className="font-medium text-slate-700">Oppervlakte pand:</span>
              <span className="text-slate-900">{bagData.oppervlakte} m²</span>
            </div>
          )}
        </div>

        {/* Server-Side API Info */}
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center space-x-2 mb-2">
            <Info className="w-5 h-5 text-blue-600" />
            <span className="text-blue-800 font-medium">Server-Side CBS API</span>
          </div>
          <p className="text-blue-700 text-sm">
            Calling server-side API route at <code className="bg-blue-100 px-1 rounded">/api/cbs-data</code> which makes REAL CBS API calls zonder CORS restrictions.
          </p>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-8">
            <div className="inline-flex items-center space-x-2">
              <Activity className="w-5 h-5 text-green-600 animate-spin" />
              <span className="text-slate-600">Echte CBS data ophalen...</span>
            </div>
          </div>
        )}

        {/* Error State with Real API URLs */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <AlertCircle className="w-5 h-5 text-red-500" />
              <span className="text-red-700 font-medium">CORS Error - Echte APIs geblokkeerd</span>
            </div>
            <p className="text-red-600 text-sm mb-3">{error}</p>

            {debugInfo?.realApiUrls && (
              <div className="bg-white p-3 rounded border">
                <h4 className="font-medium text-red-800 mb-2">Echte CBS API URLs (gebruik server-side):</h4>
                {debugInfo.realApiUrls.map((url, i) => (
                  <div key={i} className="text-xs text-red-600 mb-1 break-all font-mono">
                    {url}
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={fetchCBSData}
              className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 transition-colors"
            >
              Opnieuw proberen
            </button>
          </div>
        )}

        {/* Success - Show REAL CBS Data */}
        {cbsData && (
          <div className="space-y-6">
            <div className="flex items-center space-x-2 text-green-700 mb-4">
              <CheckCircle2 className="w-5 h-5" />
              <span className="font-medium">ECHTE CBS data succesvol opgehaald</span>
            </div>

            {/* Key Demographics - REAL DATA */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Population Density - REAL */}
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center space-x-2 mb-2">
                  <Users className="w-5 h-5 text-blue-600" />
                  <h3 className="font-semibold text-blue-900">Bevolkingsdichtheid (ECHT)</h3>
                </div>
                <div className="text-2xl font-bold text-blue-800">
                  {cbsData.bevolkingsDichtheid ?
                    `${cbsData.bevolkingsDichtheid.toLocaleString('nl-NL')} inwoners/km²` :
                    'Niet beschikbaar'
                  }
                </div>
                {cbsData.aantalInwoners && (
                  <div className="text-sm text-blue-600 mt-1">
                    Totaal: {cbsData.aantalInwoners.toLocaleString('nl-NL')} inwoners
                  </div>
                )}
                <div className="text-xs text-blue-500 mt-2">
                  Bron: {cbsData.dataSources?.demographics || 'Niet beschikbaar'}
                </div>
              </div>

              {/* Average Income - REAL */}
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center space-x-2 mb-2">
                  <DollarSign className="w-5 h-5 text-green-600" />
                  <h3 className="font-semibold text-green-900">Gemiddeld Inkomen (ECHT)</h3>
                </div>
                <div className="text-2xl font-bold text-green-800">
                  {cbsData.gemiddeldInkomenPerInwoner ?
                    `€${cbsData.gemiddeldInkomenPerInwoner.toLocaleString('nl-NL')}` :
                    cbsData.gemiddeldHuishoudinkomen ?
                    `€${cbsData.gemiddeldHuishoudinkomen.toLocaleString('nl-NL')}` :
                    'Niet beschikbaar'
                  }
                </div>
                <div className="text-sm text-green-600 mt-1">
                  {cbsData.gemiddeldInkomenPerInwoner ? 'Per inwoner per jaar' :
                   cbsData.gemiddeldHuishoudinkomen ? 'Per huishouden per jaar' : ''}
                </div>
                <div className="text-xs text-green-500 mt-2">
                  Bron: {cbsData.dataSources?.income || 'Niet beschikbaar'}
                </div>
              </div>
            </div>

            {/* WOZ Information - REAL */}
            {cbsData.wozWaarde && (
              <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                <h3 className="font-semibold text-purple-800 mb-3">WOZ Waarde (ECHT)</h3>
                <div className="grid md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-purple-600">WOZ Waarde:</span>
                    <div className="font-semibold">€{cbsData.wozWaarde.toLocaleString('nl-NL')}</div>
                  </div>
                  {cbsData.wozPerM2 && (
                    <div>
                      <span className="text-purple-600">Per m²:</span>
                      <div className="font-semibold">€{cbsData.wozPerM2.toLocaleString('nl-NL')}/m²</div>
                    </div>
                  )}
                  {cbsData.wozPeriode && (
                    <div>
                      <span className="text-purple-600">Periode:</span>
                      <div className="font-semibold">{cbsData.wozPeriode}</div>
                    </div>
                  )}
                </div>
                <div className="text-xs text-purple-500 mt-2">
                  Bron: {cbsData.dataSources?.woz || 'Niet beschikbaar'}
                </div>
              </div>
            )}

            {/* Real Data Sources */}
            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
              <h3 className="font-semibold text-slate-800 mb-3">Echte CBS Data Bronnen</h3>
              <div className="space-y-2 text-sm">
                {Object.entries(cbsData.dataSources || {}).map(([key, value]) =>
                  value && (
                    <div key={key} className="flex justify-between items-center">
                      <span className="text-slate-600 capitalize">{key}:</span>
                      <span className="font-medium text-slate-800">{value}</span>
                    </div>
                  )
                )}
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between mt-8 pt-6 border-t border-slate-200">
          <button
            onClick={onBack}
            className="flex items-center space-x-2 px-6 py-2 text-slate-600 hover:text-slate-800 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Terug</span>
          </button>

          <button
            onClick={handleContinue}
            disabled={!cbsData}
            className="flex items-center space-x-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors"
          >
            <span>Volgende Stap</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Debug Info - Show REAL API URLS */}
        {debugInfo && process.env.NODE_ENV === 'development' && (
          <div className="mt-6 p-4 bg-gray-100 rounded-lg">
            <h3 className="font-semibold text-gray-800 mb-2">Debug: Echte CBS API URLs</h3>
            <pre className="text-xs text-gray-700 overflow-auto max-h-40">
              {JSON.stringify(debugInfo, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};

export default Step3CBSData;
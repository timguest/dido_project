import React, { useState, useEffect } from 'react';
import { ChevronLeft, Zap, DollarSign, Loader2, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';

export default function Step4WOZEPData({
  addressData,
  bagData,
  onComplete,
  onBack,
  initialData
}) {
  const [loadingEP, setLoadingEP] = useState(false);
  const [loadingWOZ, setLoadingWOZ] = useState(false);
  const [epData, setEpData] = useState(initialData?.ep || null);
  const [wozData, setWozData] = useState(initialData?.woz || null);
  const [error, setError] = useState(null);

  // Auto-fetch data when component mounts
  useEffect(() => {
    if (addressData && !epData && !wozData) {
      fetchEnergyLabel();
      fetchWOZData();
    }
  }, [addressData]);

  const fetchEnergyLabel = async () => {
    if (!addressData) return;

    setLoadingEP(true);
    setError(null);

    try {
      console.log('🔍 Fetching energy label for:', addressData);

      // Parse address like Python code does
      const streetNumber = addressData.streetNumber || '';
      console.log('🏠 Original streetNumber:', streetNumber);

      // Simple parsing - just extract the number
      let huisnummer = streetNumber.match(/^\d+/)?.[0];
      let huisletter = streetNumber.match(/^\d+([A-Z])$/)?.[1];
      let huisnummertoevoeging = streetNumber.match(/^\d+[A-Z]?[-\s]+(.+)$/)?.[1];

      console.log('🔍 Parsed components:', { huisnummer, huisletter, huisnummertoevoeging });

      const requestData = {
        postcode: addressData.postalCode?.replace(/\s/g, ''),
        huisnummer: huisnummer
      };

      // Only add if they actually exist and are not just digits
      if (huisletter && huisletter.length === 1) {
        requestData.huisletter = huisletter;
      }
      if (huisnummertoevoeging && huisnummertoevoeging.trim()) {
        requestData.huisnummertoevoeging = huisnummertoevoeging.trim();
      }

      console.log('📋 Energy Label Request data:', requestData);

      const response = await fetch('/api/energy-label', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      console.log('📡 Energy Label Response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();

      if (result.success && result.data) {
        setEpData(result.data);
      } else {
        setEpData({
          address: `${addressData.street} ${addressData.streetNumber}, ${addressData.city}`,
          energy_class: null,
          error: 'Geen energielabel gevonden'
        });
      }

    } catch (err) {
      console.error('Energy label fetch error:', err);
      setError(`Fout bij ophalen energielabel: ${err.message}`);
      setEpData({
        address: `${addressData.street} ${addressData.streetNumber}, ${addressData.city}`,
        energy_class: null,
        error: err.message
      });
    } finally {
      setLoadingEP(false);
    }
  };

  const fetchWOZData = async () => {
    if (!addressData) return;

    setLoadingWOZ(true);
    setError(null);

    try {
      console.log('💰 Fetching WOZ data for:', addressData);

      // Parse address components for WOZ API
      const streetNumber = addressData.streetNumber || '';
      console.log('🏠 Original streetNumber:', streetNumber);

      // For WOZ API, we only need the basic house number (like Python code)
      let huisnummer = streetNumber.match(/^\d+/)?.[0];

      if (!huisnummer) {
        throw new Error('Geen geldig huisnummer gevonden');
      }

      console.log('🔍 Parsed for WOZ:', { huisnummer });

      const requestData = {
        postcode: addressData.postalCode?.replace(/\s/g, ''), // Remove spaces like Python
        housenumber: huisnummer // Use 'housenumber' to match API expectation
      };

      console.log('📋 WOZ Request data:', requestData);

      const response = await fetch('/api/woz-value', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      console.log('📡 WOZ Response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('WOZ API Error:', errorData);
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('📄 WOZ result:', result);

      if (result.success && result.data) {
        setWozData(result.data);
        console.log('✅ WOZ data successfully set:', result.data);
      } else {
        setWozData({
          address: `${addressData.street} ${addressData.streetNumber}, ${addressData.city}`,
          woz_value: null,
          error: result.message || 'Geen WOZ-waarde gevonden'
        });
      }

    } catch (err) {
      console.error('❌ WOZ fetch error:', err);
      setError(`Fout bij ophalen WOZ-waarde: ${err.message}`);
      setWozData({
        address: `${addressData.street} ${addressData.streetNumber}, ${addressData.city}`,
        woz_value: null,
        error: err.message
      });
    } finally {
      setLoadingWOZ(false);
    }
  };

  const handleContinue = () => {
    // Can continue if we have at least energy label data OR WOZ data
    if (epData || wozData) {
      onComplete({
        ep: epData,
        woz: wozData
      });
    }
  };

  // Helper function to format WOZ value
  const formatWOZValue = (value) => {
    if (!value) return null;
    return new Intl.NumberFormat('nl-NL', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg border border-slate-200">
      {/* Header */}
      <div className="border-b border-slate-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-800 mb-2">
              WOZ & Energielabel Data
            </h2>
            <p className="text-slate-600">
              Waardering en energielabel voor {addressData?.street} {addressData?.streetNumber}, {addressData?.city}
            </p>
          </div>
          <button
            onClick={onBack}
            className="flex items-center space-x-2 px-4 py-2 text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Terug</span>
          </button>
        </div>
      </div>

      <div className="p-6 space-y-8">
        {/* WOZ Section - Moved to top for priority */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-800">WOZ Waardering</h3>
                <p className="text-sm text-slate-500">Waardering Onroerende Zaken (Altum AI)</p>
              </div>
            </div>
            <button
              onClick={fetchWOZData}
              disabled={loadingWOZ}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400 transition-colors"
            >
              {loadingWOZ ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
              <span>{loadingWOZ ? 'Ophalen...' : 'Vernieuwen'}</span>
            </button>
          </div>

          <div className="bg-slate-50 rounded-lg p-6">
            {loadingWOZ ? (
              <div className="flex items-center justify-center space-x-3 py-8">
                <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                <span className="text-slate-600">WOZ-waarde ophalen via Altum AI...</span>
              </div>
            ) : wozData ? (
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  {wozData.woz_value ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-amber-500" />
                  )}
                  <span className="font-medium">
                    {wozData.woz_value
                      ? `WOZ-waarde gevonden: ${formatWOZValue(wozData.woz_value)}`
                      : 'Geen WOZ-waarde gevonden'
                    }
                  </span>
                </div>

                {wozData.woz_value && (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-slate-500">WOZ-waarde:</span>
                      <div className="font-semibold text-xl text-blue-600">
                        {formatWOZValue(wozData.woz_value)}
                      </div>
                    </div>
                    {wozData.woz_year && (
                      <div>
                        <span className="text-slate-500">Waardepeildatum:</span>
                        <div className="font-medium">{wozData.woz_year}</div>
                      </div>
                    )}
                    {wozData.woz_date && (
                      <div>
                        <span className="text-slate-500">Datum:</span>
                        <div className="font-medium">{new Date(wozData.woz_date).toLocaleDateString('nl-NL')}</div>
                      </div>
                    )}
                    {wozData.surface_area && (
                      <div>
                        <span className="text-slate-500">Oppervlakte:</span>
                        <div className="font-medium">{wozData.surface_area} m²</div>
                      </div>
                    )}
                    {wozData.building_year && (
                      <div>
                        <span className="text-slate-500">Bouwjaar:</span>
                        <div className="font-medium">{wozData.building_year}</div>
                      </div>
                    )}
                    {wozData.property_type && (
                      <div>
                        <span className="text-slate-500">Type:</span>
                        <div className="font-medium">{wozData.property_type}</div>
                      </div>
                    )}
                  </div>
                )}

                {wozData.error && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                    <div className="flex items-center space-x-2 text-amber-800">
                      <AlertCircle className="w-4 h-4" />
                      <span className="text-sm font-medium">Waarschuwing</span>
                    </div>
                    <p className="text-amber-700 text-sm mt-1">{wozData.error}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-slate-500">
                Klik op "Vernieuwen" om de WOZ-waarde op te vragen via Altum AI
              </div>
            )}
          </div>
        </div>

        {/* Energy Label Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Zap className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-800">Energielabel</h3>
                <p className="text-sm text-slate-500">EP-Online registratie</p>
              </div>
            </div>
            <button
              onClick={fetchEnergyLabel}
              disabled={loadingEP}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-green-400 transition-colors"
            >
              {loadingEP ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
              <span>{loadingEP ? 'Ophalen...' : 'Vernieuwen'}</span>
            </button>
          </div>

          <div className="bg-slate-50 rounded-lg p-6">
            {loadingEP ? (
              <div className="flex items-center justify-center space-x-3 py-8">
                <Loader2 className="w-6 h-6 animate-spin text-green-600" />
                <span className="text-slate-600">Energielabel ophalen...</span>
              </div>
            ) : epData ? (
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  {epData.energy_class ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-amber-500" />
                  )}
                  <span className="font-medium">
                    {epData.energy_class ? `Energielabel gevonden: ${epData.energy_class}` : 'Geen energielabel gevonden'}
                  </span>
                </div>

                {epData.energy_class && (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-slate-500">Energieklasse:</span>
                      <div className="font-semibold text-xl text-green-600">{epData.energy_class}</div>
                    </div>
                    {epData.building_type && (
                      <div>
                        <span className="text-slate-500">Gebouwtype:</span>
                        <div className="font-medium">{epData.building_type}</div>
                      </div>
                    )}
                    {epData.construction_year && (
                      <div>
                        <span className="text-slate-500">Bouwjaar:</span>
                        <div className="font-medium">{epData.construction_year}</div>
                      </div>
                    )}
                    {epData.floor_area && (
                      <div>
                        <span className="text-slate-500">Gebruiksoppervlakte:</span>
                        <div className="font-medium">{epData.floor_area} m²</div>
                      </div>
                    )}
                    {epData.registration_date && (
                      <div>
                        <span className="text-slate-500">Registratiedatum:</span>
                        <div className="font-medium">{new Date(epData.registration_date).toLocaleDateString('nl-NL')}</div>
                      </div>
                    )}
                  </div>
                )}

                {epData.error && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                    <div className="flex items-center space-x-2 text-amber-800">
                      <AlertCircle className="w-4 h-4" />
                      <span className="text-sm font-medium">Waarschuwing</span>
                    </div>
                    <p className="text-amber-700 text-sm mt-1">{epData.error}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-slate-500">
                Klik op "Vernieuwen" om het energielabel op te vragen
              </div>
            )}
          </div>
        </div>

        {/* Global Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center space-x-2 text-red-800">
              <AlertCircle className="w-5 h-5" />
              <span className="font-medium">Fout opgetreden:</span>
            </div>
            <p className="text-red-600 mt-1">{error}</p>
          </div>
        )}

        {/* Continue Button */}
        <div className="flex justify-between pt-6 border-t border-slate-200">
          <div className="text-sm text-slate-500">
            {(epData || wozData) ? (
              <span className="text-green-600 font-medium">✓ Data beschikbaar - je kunt verder naar de analyse</span>
            ) : (
              <span>Haal minimaal één van de waarderingen op om verder te gaan</span>
            )}
          </div>

          <button
            onClick={handleContinue}
            disabled={!epData && !wozData}
            className={`px-6 py-3 rounded-lg font-medium transition-colors ${
              (epData || wozData)
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-slate-300 text-slate-500 cursor-not-allowed'
            }`}
          >
            Verder naar Analyse →
          </button>
        </div>
      </div>
    </div>
  );
}
import React, { useState, useEffect } from 'react';
import { Database, ArrowRight, ArrowLeft, CheckCircle, AlertCircle, Loader2, Building2, MapPin, Home } from 'lucide-react';

export default function Step2BAGData({ addressData, onComplete, onBack, initialData }) {
  const [loading, setLoading] = useState(false);
  const [bagData, setBagData] = useState(initialData || null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (addressData && !bagData) {
      fetchBAGData();
    }
  }, [addressData]);

  const fetchBAGData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Clean postcode (remove spaces and make uppercase)
      const cleanPostcode = addressData.postalCode.replace(/\s/g, '').toUpperCase();

      console.log('Fetching BAG data for:', {
        postcode: cleanPostcode,
        huisnummer: addressData.streetNumber
      });

      // Get address information
      const addressParams = new URLSearchParams({
        postcode: cleanPostcode,
        huisnummer: addressData.streetNumber,
        exacteMatch: 'true'
      });

      const addressResponse = await fetch(`https://api.bag.kadaster.nl/lvbag/individuelebevragingen/v2/adressen?${addressParams}`, {
        headers: {
          'X-Api-Key': 'l7ea6ef1303ad54c5daab1e4add04777f7',
          'Accept': 'application/hal+json',
          'Accept-Crs': 'epsg:28992'
        }
      });

      if (!addressResponse.ok) {
        throw new Error(`BAG API Error: ${addressResponse.status}`);
      }

      const addressResult = await addressResponse.json();

      if (!addressResult._embedded?.adressen?.length) {
        throw new Error('Geen adres gevonden in BAG database');
      }

      const address = addressResult._embedded.adressen[0];

      // Get detailed object information for surface area, usage purpose, and coordinates
      if (!address.adresseerbaarObjectIdentificatie) {
        throw new Error('Geen verblijfsobject ID gevonden');
      }

      const detailedResponse = await fetch(
        `https://api.bag.kadaster.nl/lvbag/individuelebevragingen/v2/adresseerbareobjecten/${address.adresseerbaarObjectIdentificatie}`,
        {
          headers: {
            'X-Api-Key': 'l7ea6ef1303ad54c5daab1e4add04777f7',
            'Accept': 'application/hal+json',
            'Accept-Crs': 'epsg:28992'
          }
        }
      );

      if (!detailedResponse.ok) {
        throw new Error(`Kan objectdetails niet ophalen: ${detailedResponse.status}`);
      }

      const detailedData = await detailedResponse.json();
      console.log('BAG Detailed Response:', detailedData);

      // Parse only the essential data
      const simplifiedData = parseEssentialBAGData(detailedData);
      console.log('Simplified BAG data:', simplifiedData);

      setBagData(simplifiedData);

    } catch (err) {
      console.error('BAG API Error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const parseEssentialBAGData = (detailedData) => {
    const obj = detailedData?.verblijfsobject?.verblijfsobject;

    if (!obj) {
      throw new Error('Geen verblijfsobject data gevonden');
    }

    // Extract coordinates
    let coordinates = null;
    if (obj.geometrie?.punt?.coordinates) {
      const coords = obj.geometrie.punt.coordinates;
      if (coords.length >= 2) {
        coordinates = {
          x: coords[0], // RD coordinates
          y: coords[1],
          latitude: coords[1], // Note: for RD these need conversion to WGS84
          longitude: coords[0]
        };
      }
    }

    // Extract surface area
    const oppervlakte = obj.oppervlakte;

    // Extract usage purposes
    const gebruiksdoelen = obj.gebruiksdoelen || [];

    return {
      oppervlakte,
      gebruiksdoelen,
      coordinates,
      // Keep original address for reference
      address: `${addressData.street} ${addressData.streetNumber}, ${addressData.postalCode} ${addressData.city}`
    };
  };



  const handleContinue = () => {
    console.log('Step 2 - Essential BAG data completed:', bagData);
    onComplete(bagData);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-medium mb-6">
          <Database className="w-4 h-4 mr-2" />
          Stap 2: BAG Verificatie
        </div>
        <h2 className="text-4xl font-bold text-slate-800 mb-4">
          Pand Eigenschappen
        </h2>
        <p className="text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
          Oppervlakte, gebruiksdoel en coördinaten ophalen uit BAG
        </p>
      </div>

      {/* Address Summary */}
      <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-white/20 shadow-lg">
        <h3 className="text-lg font-semibold text-slate-800 mb-3 flex items-center">
          <MapPin className="w-5 h-5 mr-2 text-blue-600" />
          Adres
        </h3>
        <p className="text-slate-600">
          {addressData?.street} {addressData?.streetNumber}, {addressData?.postalCode} {addressData?.city}
        </p>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="bg-white/80 backdrop-blur-sm rounded-xl p-8 border border-white/20 shadow-lg text-center">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-800 mb-2">BAG Data Ophalen...</h3>
          <p className="text-slate-600">Oppervlakte, gebruiksdoel en coördinaten worden opgehaald</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6">
          <div className="flex items-start">
            <AlertCircle className="w-6 h-6 text-red-600 mr-3 mt-0.5" />
            <div>
              <h3 className="text-lg font-semibold text-red-800 mb-2">Fout bij BAG Data</h3>
              <p className="text-red-700 mb-4">{error}</p>
              <button
                onClick={fetchBAGData}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Opnieuw Proberen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success State - Essential BAG Data Display */}
      {bagData && (
        <div className="space-y-6">
          {/* Success Message */}
          <div className="bg-green-50 border border-green-200 rounded-xl p-6">
            <div className="flex items-center">
              <CheckCircle className="w-6 h-6 text-green-600 mr-3" />
              <div>
                <h3 className="text-lg font-semibold text-green-800">BAG Data Opgehaald</h3>
                <p className="text-green-700">Essentiële pandgegevens zijn verzameld.</p>
              </div>
            </div>
          </div>

          {/* Essential Data Cards */}
          <div className="grid md:grid-cols-3 gap-6">
            {/* Surface Area */}
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-white/20 shadow-lg">
              <div className="flex items-center mb-4">
                <Home className="w-6 h-6 text-green-600 mr-3" />
                <h3 className="text-lg font-semibold text-slate-800">Oppervlakte</h3>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-slate-800 mb-2">
                  {bagData.oppervlakte ? `${bagData.oppervlakte} m²` : '?'}
                </div>
                <div className="text-sm text-slate-500">Gebruiksoppervlakte</div>
              </div>
            </div>

            {/* Usage Purpose */}
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-white/20 shadow-lg">
              <div className="flex items-center mb-4">
                <Building2 className="w-6 h-6 text-blue-600 mr-3" />
                <h3 className="text-lg font-semibold text-slate-800">Gebruiksdoel</h3>
              </div>
              <div className="space-y-2">
                {bagData.gebruiksdoelen && bagData.gebruiksdoelen.length > 0 ? (
                  bagData.gebruiksdoelen.map((purpose, index) => (
                    <div key={index} className="bg-blue-100 text-blue-800 px-3 py-2 rounded-lg text-sm font-medium">
                      {purpose}
                    </div>
                  ))
                ) : (
                  <div className="text-slate-500 text-sm">Niet beschikbaar</div>
                )}
              </div>
            </div>

            {/* Coordinates */}
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-white/20 shadow-lg">
              <div className="flex items-center mb-4">
                <MapPin className="w-6 h-6 text-purple-600 mr-3" />
                <h3 className="text-lg font-semibold text-slate-800">Coördinaten</h3>
              </div>
              <div className="space-y-2 text-sm">
                {bagData.coordinates ? (
                  <>
                    <div className="flex justify-between">
                      <span className="text-slate-500">X (RD):</span>
                      <span className="font-mono font-medium">{bagData.coordinates.x?.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Y (RD):</span>
                      <span className="font-mono font-medium">{bagData.coordinates.y?.toFixed(2)}</span>
                    </div>
                  </>
                ) : (
                  <div className="text-slate-500">Niet beschikbaar</div>
                )}
              </div>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex justify-between items-center">
            <button
              onClick={onBack}
              className="px-6 py-3 rounded-lg font-semibold text-slate-600 border border-slate-300 hover:bg-slate-50 transition-all duration-200 flex items-center space-x-2"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Terug</span>
            </button>
            <button
              onClick={handleContinue}
              disabled={!bagData}
              className={`px-8 py-4 rounded-lg font-semibold transition-all duration-300 flex items-center space-x-3 ${
                bagData
                  ? 'text-white bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 transform hover:scale-105 shadow-lg shadow-green-500/25'
                  : 'text-slate-400 bg-slate-200 cursor-not-allowed'
              }`}
            >
              <span>Ga verder naar CBS Data</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Manual Start Button */}
      {!loading && !bagData && !error && (
        <div className="bg-white/80 backdrop-blur-sm rounded-xl p-8 border border-white/20 shadow-lg text-center">
          <Database className="w-12 h-12 text-blue-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-800 mb-2">BAG Data Ophalen</h3>
          <p className="text-slate-600 mb-6">Haal oppervlakte, gebruiksdoel en coördinaten op.</p>
          <button
            onClick={fetchBAGData}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Start BAG API Call
          </button>
        </div>
      )}
    </div>
  );
}
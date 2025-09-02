// pages/Step1AddressInput.js
import React, { useState } from 'react';
import { MapPin, ArrowRight, Calculator, TrendingUp, Shield, Building2 } from 'lucide-react';

export default function Step1AddressInput({ onComplete, initialData }) {
  const [formData, setFormData] = useState({
    street: initialData?.street || '',
    streetNumber: initialData?.streetNumber || '',
    city: initialData?.city || '',
    postalCode: initialData?.postalCode || '',
    municipality: initialData?.municipality || ''
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = () => {
    console.log('Step 1 - Address data collected:', formData);
    onComplete(formData);
  };

  const isFormValid = formData.street && formData.streetNumber && formData.city && formData.postalCode && formData.municipality;

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="text-center">
        <div className="inline-flex items-center px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-medium mb-6">
          <Calculator className="w-4 h-4 mr-2" />
          Stap 1: Adres Invoer
        </div>
        <h2 className="text-4xl font-bold text-slate-800 mb-4">
          Begin uw investering analyse
        </h2>
        <p className="text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
          Voer het adres in van het pand dat u wilt analyseren. We verzamelen
          vervolgens alle benodigde data voor een complete financiële evaluatie.
        </p>
      </div>

      {/* Features Preview */}
      <div className="grid md:grid-cols-3 gap-6">
        <div className="bg-white/70 backdrop-blur-sm rounded-xl p-6 border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300">
          <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center mb-4">
            <MapPin className="w-6 h-6 text-white" />
          </div>
          <h3 className="text-lg font-semibold text-slate-800 mb-2">BAG Verificatie</h3>
          <p className="text-slate-600 text-sm">Officiële pand- en adresgegevens uit de Basisregistratie</p>
        </div>

        <div className="bg-white/70 backdrop-blur-sm rounded-xl p-6 border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300">
          <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center mb-4">
            <TrendingUp className="w-6 h-6 text-white" />
          </div>
          <h3 className="text-lg font-semibold text-slate-800 mb-2">Buurt Analyse</h3>
          <p className="text-slate-600 text-sm">CBS data voor demografische en markt informatie</p>
        </div>

        <div className="bg-white/70 backdrop-blur-sm rounded-xl p-6 border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300">
          <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center mb-4">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <h3 className="text-lg font-semibold text-slate-800 mb-2">Financiële Analyse</h3>
          <p className="text-slate-600 text-sm">WOZ waardering en Monte Carlo simulaties</p>
        </div>
      </div>

      {/* Address Form */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/20 overflow-hidden">
        <div className="bg-gradient-to-r from-slate-800 to-slate-700 px-8 py-6">
          <h3 className="text-2xl font-bold text-white mb-2">Pand Adres Invoer</h3>
          <p className="text-slate-300">Voer het exacte adres in voor de meest nauwkeurige analyse</p>
        </div>

        <div className="p-8">
          {/* Quick Test Address Selector */}
          <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <label className="text-sm font-medium text-blue-800 mb-2 block">
              🧪 Test Adressen (voor snelle testing):
            </label>
            <select
              onChange={(e) => {
                if (e.target.value) {
                  const [street, streetNumber, postcode, city, municipality] = e.target.value.split('|');
                  setFormData({
                    street: street.trim(),
                    streetNumber: streetNumber.trim(),
                    postalCode: postcode.trim(),
                    city: city.trim(),
                    municipality: municipality.trim()
                  });
                }
              }}
              className="w-full px-3 py-2 rounded-lg border border-blue-300 focus:ring-2 focus:ring-blue-500 text-sm"
            >
              <option value="">Selecteer test adres...</option>
              <option value="Outerlant|14|1921 WK|Akersloot|Castricum">Outerlant 14 - 1921 WK Akersloot (gemeente Castricum)</option>
              <option value="Binnenhof|14|2513 AA|Den Haag|Den Haag">Binnenhof 14 - 2513 AA Den Haag (gemeente Den Haag)</option>
              <option value="Kalverstraat|1|1012 PB|Amsterdam|Amsterdam">Kalverstraat 1 - 1012 PB Amsterdam (gemeente Amsterdam)</option>
              <option value="Dam|12|1012 NP|Amsterdam|Amsterdam">Dam 12 - 1012 NP Amsterdam (gemeente Amsterdam)</option>
            </select>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-8">
            {/* Street Name */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 flex items-center">
                <MapPin className="w-4 h-4 mr-2 text-slate-500" />
                Straatnaam
              </label>
              <input
                type="text"
                name="street"
                value={formData.street}
                onChange={handleInputChange}
                placeholder="bijv. Kalverstraat"
                className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white/60 backdrop-blur-sm"
              />
            </div>

            {/* Street Number */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 flex items-center">
                <Building2 className="w-4 h-4 mr-2 text-slate-500" />
                Huisnummer
              </label>
              <input
                type="text"
                name="streetNumber"
                value={formData.streetNumber}
                onChange={handleInputChange}
                placeholder="bijv. 123A"
                className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white/60 backdrop-blur-sm"
              />
            </div>

            {/* Postal Code */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 flex items-center">
                <MapPin className="w-4 h-4 mr-2 text-slate-500" />
                Postcode
              </label>
              <input
                type="text"
                name="postalCode"
                value={formData.postalCode}
                onChange={handleInputChange}
                placeholder="bijv. 1012 AB"
                className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white/60 backdrop-blur-sm"
              />
            </div>

            {/* City */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 flex items-center">
                <MapPin className="w-4 h-4 mr-2 text-slate-500" />
                Plaats
              </label>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleInputChange}
                placeholder="bijv. Amsterdam"
                className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white/60 backdrop-blur-sm"
              />
            </div>

            {/* Municipality - spans full width */}
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium text-slate-700 flex items-center">
                <Building2 className="w-4 h-4 mr-2 text-slate-500" />
                Gemeente
              </label>
              <input
                type="text"
                name="municipality"
                value={formData.municipality}
                onChange={handleInputChange}
                placeholder="bijv. Amsterdam"
                className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white/60 backdrop-blur-sm"
              />
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-center">
            <button
              onClick={handleSubmit}
              disabled={!isFormValid}
              className={`
                px-8 py-4 rounded-lg font-semibold text-white transition-all duration-300
                flex items-center space-x-3 transform hover:scale-105 shadow-lg
                ${isFormValid
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-blue-500/25'
                  : 'bg-slate-400 cursor-not-allowed'
                }
              `}
            >
              <span>Ga verder naar BAG Data</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
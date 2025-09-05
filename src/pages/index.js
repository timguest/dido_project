import React, { useState, useCallback, useMemo } from 'react';
import { Building2 } from 'lucide-react';
import { AddressForm, DataFetchingStep, AIAnalysisStep } from '../components/StepComponents';
import { useAPIData } from '../hooks/useAPIData';

export default function RealEstateAnalyzer() {
  const [step, setStep] = useState(1);
  const [addressData, setAddressData] = useState({
    street: '',
    streetNumber: '',
    addition: '',
    city: '',
    postalCode: ''
  });
  const [analysisMode, setAnalysisMode] = useState('individual');
  const [postalCodeData, setPostalCodeData] = useState('');

  const {
    apiData,
    loadingState,
    errors,
    aiAnalysis,
    fetchData,
    runAnalysis,
    resetAll
  } = useAPIData(addressData, setStep, analysisMode, postalCodeData);

  // Move validation BEFORE it's used in callbacks
  const isFormValid = useMemo(() =>
    addressData.street && addressData.streetNumber && addressData.city && addressData.postalCode,
    [addressData]
  );

  const isPostalCodeValid = useMemo(() => {
    const dutchPostalCodeRegex = /^[1-9][0-9]{3}[A-Z]{2}$/;
    return dutchPostalCodeRegex.test(postalCodeData);
  }, [postalCodeData]);

  // Now callbacks can safely use the validation variables
  const handleAddressSubmit = useCallback(() => {
    if (isFormValid) {
      setStep(2);
      fetchData();
    }
  }, [isFormValid, fetchData]);

  const handlePostalCodeSubmit = useCallback(() => {
    if (isPostalCodeValid) {
      setStep(2);
      fetchData();
    }
  }, [isPostalCodeValid, fetchData]);

  const handleInputChange = useCallback((field, value) => {
    setAddressData(prev => ({ ...prev, [field]: value }));
  }, []);

  const formatCurrency = useCallback((value) => {
    if (!value || isNaN(value)) return value;
    return new Intl.NumberFormat('nl-NL', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  }, []);

  const resetToStep1 = useCallback(() => {
    resetAll();
    setAddressData({
      street: '',
      streetNumber: '',
      addition: '',
      city: '',
      postalCode: ''
    });
    setPostalCodeData('');
    setAnalysisMode('individual');
    setStep(1);
  }, [resetAll]);

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
                  Analytics
                </h1>
                <p className="text-sm text-slate-500">Real Estate Investment Analyzer</p>
              </div>
            </div>
            {step > 1 && (
              <button
                onClick={resetToStep1}
                className="text-sm bg-slate-100 text-slate-600 px-3 py-2 rounded-lg hover:bg-slate-200 transition-colors"
              >
                Nieuwe Analyse
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {step === 1 && (
          <AddressForm
            addressData={addressData}
            onInputChange={handleInputChange}
            onSubmit={handleAddressSubmit}
            isFormValid={isFormValid}
            analysisMode={analysisMode}
            onAnalysisModeChange={setAnalysisMode}
            postalCodeData={postalCodeData}
            onPostalCodeChange={setPostalCodeData}
            onPostalCodeSubmit={handlePostalCodeSubmit}
            isPostalCodeValid={isPostalCodeValid}
          />
        )}

        {step === 2 && (
          <DataFetchingStep
            addressData={addressData}
            loadingState={loadingState}
            apiData={apiData}
            errors={errors}
            formatCurrency={formatCurrency}
            onRunAIAnalysis={runAnalysis}
            analysisMode={analysisMode}
            postalCode={postalCodeData}
          />
        )}

        {step === 3 && (
          <AIAnalysisStep
            loadingState={loadingState}
            aiAnalysis={aiAnalysis}
            apiData={apiData}
            errors={errors}
            formatCurrency={formatCurrency}
            resetAnalysis={resetToStep1}
          />
        )}
      </div>
    </div>
  );
}
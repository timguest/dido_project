import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Building2 } from 'lucide-react';
import { AddressForm, DataFetchingStep, AIAnalysisStep } from '../components/StepComponents';
import LoginForm from '../components/LoginForm';
import { useAPIData } from '../hooks/useAPIData';

export default function RealEstateAnalyzer() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [loginError, setLoginError] = useState('');
  const [step, setStep] = useState(1);
  const [addressData, setAddressData] = useState({
    street: '',
    streetNumber: '',
    addition: '',
    city: '',
    postalCode: ''
  });

  const {
    apiData,
    loadingState,
    errors,
    aiAnalysis,
    fetchAllData,
    runAIAnalysis,
    resetAnalysis
  } = useAPIData(addressData, setStep);

  // Check if user is already authenticated on component mount
  useEffect(() => {
    const token = localStorage.getItem('dido_auth_token');
    if (token) {
      // In a real app, you'd validate the token with the server
      // For MVP, we'll just check if it exists and is not expired
      try {
        const tokenData = Buffer.from(token, 'base64').toString();
        const [username, timestamp] = tokenData.split(':');
        const tokenAge = Date.now() - parseInt(timestamp);

        // Token expires after 24 hours (86400000 ms)
        if (tokenAge < 86400000) {
          setIsAuthenticated(true);
        } else {
          localStorage.removeItem('dido_auth_token');
        }
      } catch (error) {
        localStorage.removeItem('dido_auth_token');
      }
    }
    setAuthLoading(false);
  }, []);

  const handleLogin = useCallback(async (credentials) => {
    setLoginError('');

    try {
      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      const data = await response.json();

      if (data.success) {
        localStorage.setItem('dido_auth_token', data.token);
        setIsAuthenticated(true);
        setLoginError('');
      } else {
        setLoginError(data.message || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      setLoginError('Er is een fout opgetreden. Probeer het opnieuw.');
    }
  }, []);

  const handleLogout = useCallback(() => {
    localStorage.removeItem('dido_auth_token');
    setIsAuthenticated(false);
    resetAnalysis();
    setAddressData({
      street: '',
      streetNumber: '',
      addition: '',
      city: '',
      postalCode: ''
    });
  }, [resetAnalysis]);

  const handleAddressSubmit = useCallback(() => {
    if (addressData.street && addressData.streetNumber && addressData.city && addressData.postalCode) {
      setStep(2);
      fetchAllData();
    }
  }, [addressData, fetchAllData]);

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

  const isFormValid = useMemo(() =>
    addressData.street && addressData.streetNumber && addressData.city && addressData.postalCode,
    [addressData]
  );

  const resetToStep1 = useCallback(() => {
    resetAnalysis();
    setAddressData({
      street: '',
      streetNumber: '',
      addition: '',
      city: '',
      postalCode: ''
    });
  }, [resetAnalysis]);

  // Show loading spinner while checking authentication
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show login form if not authenticated
  if (!isAuthenticated) {
    return <LoginForm onLogin={handleLogin} error={loginError} />;
  }

  // Main application (only shown when authenticated)
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
            <div className="flex items-center space-x-3">
              {step > 1 && (
                <button
                  onClick={resetToStep1}
                  className="text-sm bg-slate-100 text-slate-600 px-3 py-2 rounded-lg hover:bg-slate-200 transition-colors"
                >
                  Nieuwe Analyse
                </button>
              )}
              <button
                onClick={handleLogout}
                className="text-sm bg-red-100 text-red-600 px-3 py-2 rounded-lg hover:bg-red-200 transition-colors"
              >
                Uitloggen
              </button>
            </div>
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
          />
        )}

        {step === 2 && (
          <DataFetchingStep
            addressData={addressData}
            loadingState={loadingState}
            apiData={apiData}
            errors={errors}
            formatCurrency={formatCurrency}
            onRunAIAnalysis={runAIAnalysis}
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
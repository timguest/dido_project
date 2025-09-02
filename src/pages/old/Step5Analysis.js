import React, { useState, useEffect } from 'react';
import { ChevronLeft, Calculator, TrendingUp, Euro, BarChart3, PieChart, AlertTriangle, CheckCircle, Download, RefreshCw } from 'lucide-react';

export default function Step5Analysis({
  allData,
  onComplete,
  onBack,
  initialData
}) {
  // Smart defaults based on collected data
  const getSmartDefaults = () => {
    const bagData = allData.bagData;
    const cbsData = allData.cbsData;
    const wozData = allData.wozData;
    const epData = allData.epData;

    // Base purchase price from WOZ or fallback
    const purchasePrice = wozData?.woz_value || 400000;

    // Smart rent estimation based on area data
    const surfaceArea = bagData?.gebruiksoppervlakte || wozData?.surface_area || 80;
    const averageRentPerM2 = cbsData?.average_income ? Math.min(cbsData.average_income / 12 * 0.3 / surfaceArea, 25) : 20; // Max 30% income, max €25/m²
    const estimatedRent = Math.round(surfaceArea * averageRentPerM2);

    // Maintenance based on building age and energy label
    const buildingYear = bagData?.bouwjaar || wozData?.building_year || 1990;
    const buildingAge = new Date().getFullYear() - buildingYear;
    let maintenanceBase = surfaceArea * 15; // €15/m² base

    // Adjust for age
    if (buildingAge > 30) maintenanceBase *= 1.4;
    else if (buildingAge > 15) maintenanceBase *= 1.2;

    // Adjust for energy label
    const energyLabel = epData?.energy_class;
    if (energyLabel && ['F', 'G'].includes(energyLabel)) maintenanceBase *= 1.3;
    else if (energyLabel && ['D', 'E'].includes(energyLabel)) maintenanceBase *= 1.1;

    // Property appreciation based on area market
    const marketAppreciation = cbsData?.average_house_value ?
      (cbsData.average_house_value > 500000 ? 4 : cbsData.average_house_value > 300000 ? 3.5 : 3) : 3;

    return {
      purchasePrice,
      monthlyRent: estimatedRent,
      yearlyMaintenance: Math.round(maintenanceBase),
      propertyAppreciation: marketAppreciation,
      downPayment: 20,
      interestRate: 4.5,
      vveContribution: 150,
      managementCosts: 50,
      rentIncrease: 2
    };
  };

  const [userInputs, setUserInputs] = useState({
    ...getSmartDefaults(),
    ...initialData?.inputs
  });

  const [analysisResults, setAnalysisResults] = useState(initialData?.results || null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Calculate loan amount
  const loanAmount = userInputs.purchasePrice * (1 - userInputs.downPayment / 100);
  const ownInvestment = userInputs.purchasePrice * (userInputs.downPayment / 100);

  // Real-time basic calculations
  const monthlyInterest = (loanAmount * userInputs.interestRate / 100) / 12;
  const monthlyPrincipal = loanAmount / (30 * 12); // 30 year mortgage
  const monthlyMortgage = monthlyInterest + monthlyPrincipal;
  const monthlyIncome = userInputs.monthlyRent;
  const monthlyExpenses = monthlyMortgage + userInputs.vveContribution + userInputs.managementCosts + (userInputs.yearlyMaintenance / 12);
  const monthlyCashflow = monthlyIncome - monthlyExpenses;
  const grossYield = (userInputs.monthlyRent * 12 / userInputs.purchasePrice) * 100;
  const netYield = (monthlyCashflow * 12 / ownInvestment) * 100;

  useEffect(() => {
    // Auto-run analysis when component mounts with existing data
    if (allData && !analysisResults) {
      runAnalysis();
    }
  }, [allData]);

  const runAnalysis = () => {
    setIsAnalyzing(true);
    // Simulate analysis delay
    setTimeout(() => {
      const results = calculateProjection();
      setAnalysisResults(results);
      setIsAnalyzing(false);
    }, 2000);
  };

  const calculateProjection = () => {
    const years = 10;
    const projections = [];
    let currentRent = userInputs.monthlyRent * 12;
    let currentPropertyValue = userInputs.purchasePrice;
    let remainingLoan = loanAmount;

    for (let year = 1; year <= years; year++) {
      // Update values
      currentRent *= (1 + userInputs.rentIncrease / 100);
      currentPropertyValue *= (1 + userInputs.propertyAppreciation / 100);

      // Annual calculations
      const annualMortgage = monthlyMortgage * 12;
      const annualInterest = remainingLoan * userInputs.interestRate / 100;
      const annualPrincipal = annualMortgage - annualInterest;
      remainingLoan = Math.max(0, remainingLoan - annualPrincipal);

      const totalExpenses = annualMortgage + userInputs.yearlyMaintenance + (userInputs.vveContribution * 12) + (userInputs.managementCosts * 12);
      const netCashflow = currentRent - totalExpenses;
      const equity = currentPropertyValue - remainingLoan;

      projections.push({
        year,
        rent: currentRent,
        propertyValue: currentPropertyValue,
        netCashflow,
        equity,
        remainingLoan,
        totalReturn: equity - ownInvestment + (netCashflow * year)
      });
    }

    // Calculate scenarios
    const scenarios = calculateScenarios();

    return {
      projections,
      scenarios,
      summary: {
        totalCashflow10Year: projections.reduce((sum, year) => sum + year.netCashflow, 0),
        propertyAppreciation10Year: projections[9].propertyValue - userInputs.purchasePrice,
        totalReturn10Year: projections[9].totalReturn,
        averageAnnualReturn: (projections[9].totalReturn / ownInvestment / 10) * 100
      }
    };
  };

  const calculateScenarios = () => {
    const scenarios = [
      {
        name: 'Pessimistisch',
        rentIncrease: 0.5,
        propertyAppreciation: 0.5,
        maintenanceMultiplier: 1.5,
        color: 'red'
      },
      {
        name: 'Realistisch',
        rentIncrease: userInputs.rentIncrease,
        propertyAppreciation: userInputs.propertyAppreciation,
        maintenanceMultiplier: 1,
        color: 'blue'
      },
      {
        name: 'Optimistisch',
        rentIncrease: userInputs.rentIncrease + 1,
        propertyAppreciation: userInputs.propertyAppreciation + 2,
        maintenanceMultiplier: 0.8,
        color: 'green'
      }
    ];

    return scenarios.map(scenario => {
      let totalReturn = 0;
      let currentRent = userInputs.monthlyRent * 12;
      let currentValue = userInputs.purchasePrice;

      for (let year = 1; year <= 10; year++) {
        currentRent *= (1 + scenario.rentIncrease / 100);
        currentValue *= (1 + scenario.propertyAppreciation / 100);
        const yearlyExpenses = (monthlyMortgage * 12) + (userInputs.yearlyMaintenance * scenario.maintenanceMultiplier) +
                              (userInputs.vveContribution * 12) + (userInputs.managementCosts * 12);
        const yearlyCashflow = currentRent - yearlyExpenses;
        totalReturn += yearlyCashflow;
      }

      const propertyGain = currentValue - userInputs.purchasePrice;
      const finalReturn = totalReturn + propertyGain;
      const annualizedReturn = (finalReturn / ownInvestment / 10) * 100;

      return {
        ...scenario,
        totalReturn: finalReturn,
        annualizedReturn,
        finalPropertyValue: currentValue
      };
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('nl-NL', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatPercentage = (percent) => {
    return `${percent.toFixed(1)}%`;
  };

  const handleInputChange = (field, value) => {
    setUserInputs(prev => ({
      ...prev,
      [field]: parseFloat(value) || 0
    }));
  };

  const handleComplete = () => {
    onComplete({
      inputs: userInputs,
      results: analysisResults
    });
  };

  return (
    <div className="max-w-6xl mx-auto bg-white rounded-xl shadow-lg border border-slate-200">
      {/* Header */}
      <div className="border-b border-slate-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-800 mb-2">
              Financiële Analyse
            </h2>
            <p className="text-slate-600">
              Investeringsanalyse voor {allData.address?.street} {allData.address?.streetNumber}, {allData.address?.city}
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
        {/* Input Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Financial Parameters */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-800 flex items-center">
                <Calculator className="w-5 h-5 mr-2 text-blue-600" />
                Financiële Parameters
              </h3>
              <button
                onClick={() => setUserInputs(prev => ({ ...getSmartDefaults(), ...prev }))}
                className="text-xs px-3 py-1 bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200 transition-colors"
              >
                🧠 Smart Defaults
              </button>
            </div>

            {/* Data Sources Summary */}
            <div className="bg-slate-50 rounded-lg p-4 text-sm">
              <h4 className="font-medium text-slate-700 mb-2">📊 Gebruikte Data:</h4>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {allData.bagData?.gebruiksoppervlakte && (
                  <div className="text-slate-600">
                    📏 Oppervlakte: {allData.bagData.gebruiksoppervlakte}m²
                  </div>
                )}
                {allData.bagData?.bouwjaar && (
                  <div className="text-slate-600">
                    🏗️ Bouwjaar: {allData.bagData.bouwjaar}
                  </div>
                )}
                {allData.cbsData?.average_house_value && (
                  <div className="text-slate-600">
                    🏠 Gem. waarde buurt: {formatCurrency(allData.cbsData.average_house_value)}
                  </div>
                )}
                {allData.cbsData?.average_income && (
                  <div className="text-slate-600">
                    💰 Gem. inkomen buurt: {formatCurrency(allData.cbsData.average_income)}
                  </div>
                )}
                {allData.epData?.energy_class && (
                  <div className="text-slate-600">
                    ⚡ Energielabel: {allData.epData.energy_class}
                  </div>
                )}
                {allData.wozData?.woz_value && (
                  <div className="text-slate-600">
                    📋 WOZ: {formatCurrency(allData.wozData.woz_value)}
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Aankoopprijs
                  </label>
                  <div className="relative">
                    <Euro className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="number"
                      value={userInputs.purchasePrice}
                      onChange={(e) => handleInputChange('purchasePrice', e.target.value)}
                      className="w-full pl-10 pr-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  {allData.wozData?.woz_value && (
                    <p className="text-xs text-slate-500 mt-1">
                      WOZ: {formatCurrency(allData.wozData.woz_value)}
                      {userInputs.purchasePrice !== allData.wozData.woz_value && (
                        <span className={`ml-1 ${userInputs.purchasePrice > allData.wozData.woz_value ? 'text-red-600' : 'text-green-600'}`}>
                          ({userInputs.purchasePrice > allData.wozData.woz_value ? '+' : ''}
                          {formatPercentage((userInputs.purchasePrice - allData.wozData.woz_value) / allData.wozData.woz_value * 100)})
                        </span>
                      )}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Eigen inbreng (%)
                  </label>
                  <input
                    type="number"
                    value={userInputs.downPayment}
                    onChange={(e) => handleInputChange('downPayment', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Hypotheekrente (%)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={userInputs.interestRate}
                    onChange={(e) => handleInputChange('interestRate', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Maandhuur (€)
                  </label>
                  <input
                    type="number"
                    value={userInputs.monthlyRent}
                    onChange={(e) => handleInputChange('monthlyRent', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  {allData.bagData?.gebruiksoppervlakte && (
                    <p className="text-xs text-slate-500 mt-1">
                      €{(userInputs.monthlyRent / allData.bagData.gebruiksoppervlakte).toFixed(1)}/m²
                      ({allData.bagData.gebruiksoppervlakte}m²)
                      {allData.cbsData?.average_income && (
                        <span className="ml-1">
                          • {formatPercentage((userInputs.monthlyRent * 12) / allData.cbsData.average_income * 100)} van gem. inkomen
                        </span>
                      )}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Onderhoud/jaar (€)
                  </label>
                  <input
                    type="number"
                    value={userInputs.yearlyMaintenance}
                    onChange={(e) => handleInputChange('yearlyMaintenance', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  {allData.bagData?.gebruiksoppervlakte && (
                    <p className="text-xs text-slate-500 mt-1">
                      €{(userInputs.yearlyMaintenance / allData.bagData.gebruiksoppervlakte).toFixed(0)}/m²
                      {allData.bagData?.bouwjaar && (
                        <span className="ml-1">
                          • {new Date().getFullYear() - allData.bagData.bouwjaar} jaar oud
                          {allData.epData?.energy_class && ` • Label ${allData.epData.energy_class}`}
                        </span>
                      )}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    VvE/maand (€)
                  </label>
                  <input
                    type="number"
                    value={userInputs.vveContribution}
                    onChange={(e) => handleInputChange('vveContribution', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Beheer/maand (€)
                  </label>
                  <input
                    type="number"
                    value={userInputs.managementCosts}
                    onChange={(e) => handleInputChange('managementCosts', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Waardegroei/jaar (%)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={userInputs.propertyAppreciation}
                    onChange={(e) => handleInputChange('propertyAppreciation', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  {allData.cbsData?.average_house_value && (
                    <p className="text-xs text-slate-500 mt-1">
                      Gem. buurtwaarde: {formatCurrency(allData.cbsData.average_house_value)}
                      {allData.cbsData.average_house_value > 500000 && ' (premium gebied)'}
                      {allData.cbsData.average_house_value < 300000 && ' (betaalbare markt)'}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Huurverhoging/jaar (%)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={userInputs.rentIncrease}
                    onChange={(e) => handleInputChange('rentIncrease', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-slate-800 flex items-center">
              <TrendingUp className="w-5 h-5 mr-2 text-green-600" />
              Directe Indicators
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="text-sm text-blue-600 font-medium">Bruto Rendement</div>
                <div className="text-2xl font-bold text-blue-800">{formatPercentage(grossYield)}</div>
              </div>
              <div className="bg-green-50 rounded-lg p-4">
                <div className="text-sm text-green-600 font-medium">Netto Rendement</div>
                <div className="text-2xl font-bold text-green-800">{formatPercentage(netYield)}</div>
              </div>
              <div className="bg-slate-50 rounded-lg p-4">
                <div className="text-sm text-slate-600 font-medium">Maandelijkse Cashflow</div>
                <div className={`text-2xl font-bold ${monthlyCashflow >= 0 ? 'text-green-800' : 'text-red-800'}`}>
                  {formatCurrency(monthlyCashflow)}
                </div>
              </div>
              <div className="bg-purple-50 rounded-lg p-4">
                <div className="text-sm text-purple-600 font-medium">Eigen Inbreng</div>
                <div className="text-2xl font-bold text-purple-800">{formatCurrency(ownInvestment)}</div>
              </div>
            </div>

            {/* Analysis Button */}
            <button
              onClick={runAnalysis}
              disabled={isAnalyzing}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:bg-blue-400 transition-colors flex items-center justify-center space-x-2"
            >
              {isAnalyzing ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  <span>Analyseren...</span>
                </>
              ) : (
                <>
                  <BarChart3 className="w-5 h-5" />
                  <span>Start 10-jaars Analyse</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Results Section */}
        {analysisResults && (
          <div className="border-t border-slate-200 pt-8 space-y-8">
            <h3 className="text-xl font-bold text-slate-800">Analyse Resultaten</h3>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg p-4">
                <div className="text-sm opacity-90">Totaal Rendement (10 jaar)</div>
                <div className="text-2xl font-bold">{formatCurrency(analysisResults.summary.totalReturn10Year)}</div>
                <div className="text-sm opacity-90">{formatPercentage(analysisResults.summary.averageAnnualReturn)} per jaar</div>
              </div>
              <div className="bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg p-4">
                <div className="text-sm opacity-90">Cashflow (10 jaar)</div>
                <div className="text-2xl font-bold">{formatCurrency(analysisResults.summary.totalCashflow10Year)}</div>
                <div className="text-sm opacity-90">Cumulatief</div>
              </div>
              <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg p-4">
                <div className="text-sm opacity-90">Waardegroei</div>
                <div className="text-2xl font-bold">{formatCurrency(analysisResults.summary.propertyAppreciation10Year)}</div>
                <div className="text-sm opacity-90">10 jaar</div>
              </div>
              <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg p-4">
                <div className="text-sm opacity-90">Eindwaarde Pand</div>
                <div className="text-2xl font-bold">{formatCurrency(analysisResults.projections[9].propertyValue)}</div>
                <div className="text-sm opacity-90">Na 10 jaar</div>
              </div>
            </div>

            {/* Scenario Analysis */}
            <div>
              <h4 className="text-lg font-semibold text-slate-800 mb-4">Scenario Analyse</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {analysisResults.scenarios.map((scenario, index) => (
                  <div key={index} className="border-2 border-slate-200 bg-slate-50 rounded-lg p-4">
                    <div className="font-semibold mb-2 text-slate-800">{scenario.name}</div>
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="text-slate-600">Jaarlijks rendement:</span>
                        <div className="font-bold text-slate-700">{formatPercentage(scenario.annualizedReturn)}</div>
                      </div>
                      <div>
                        <span className="text-slate-600">Totaal rendement:</span>
                        <div className="font-bold text-slate-700">{formatCurrency(scenario.totalReturn)}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between pt-6 border-t border-slate-200">
          <div className="text-sm text-slate-500">
            {analysisResults ? (
              <span className="text-green-600 font-medium">✓ Analyse compleet</span>
            ) : (
              <span>Klik op "Start Analyse" om de berekeningen uit te voeren</span>
            )}
          </div>
          <div className="flex space-x-3">
            {analysisResults && (
              <button
                onClick={() => alert('PDF export komt in volgende versie!')}
                className="flex items-center space-x-2 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>Export PDF</span>
              </button>
            )}
            <button
              onClick={handleComplete}
              disabled={!analysisResults}
              className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                analysisResults
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-slate-300 text-slate-500 cursor-not-allowed'
              }`}
            >
              Analyse Voltooien ✓
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
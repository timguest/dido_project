import React, { useMemo, useState } from 'react';
import {
  Brain,
  Loader2,
  MapPin,
  Home,
  Euro,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  Target,
  FileText,
  Calendar,
  BarChart3,
  Zap,
  Calculator,
  Shield,
  Star
} from 'lucide-react';

// Enhanced AI Analysis Step Component
export function EnhancedAIAnalysisStep({
  loadingState,
  aiAnalysis,
  apiData,
  errors,
  formatCurrency,
  resetAnalysis
}) {
  // Parse and structure the AI analysis
  const parsedAnalysis = useMemo(() => {
    if (!aiAnalysis?.raw_analysis) return null;

    return parseAIAnalysis(aiAnalysis.raw_analysis);
  }, [aiAnalysis]);

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
        <h2 className="text-2xl font-bold text-slate-800 mb-2">AI Vastgoedanalyse</h2>
        <p className="text-slate-600">
          {loadingState.ai ? 'AI analyseert de verzamelde data...' : 'Professionele analyse compleet'}
        </p>
      </div>

      {loadingState.ai && (
        <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-8">
          <div className="flex items-center justify-center space-x-3 mb-6">
            <Loader2 className="w-6 h-6 animate-spin text-purple-600" />
            <span className="text-slate-600 font-medium">AI creëert uw professionele vastgoedrapport...</span>
          </div>

          <div className="space-y-4">
            <div className="bg-slate-50 rounded-lg p-4">
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                  <span className="text-sm text-slate-600">Analyseren van locatie en marktdata...</span>
                </div>
                <div className="w-3/4 h-2 bg-slate-200 rounded animate-pulse"></div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-sm text-slate-600">Waardering en risico-analyse...</span>
                </div>
                <div className="w-1/2 h-2 bg-slate-200 rounded animate-pulse"></div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
                  <span className="text-sm text-slate-600">Genereren van aanbevelingen...</span>
                </div>
                <div className="w-5/6 h-2 bg-slate-200 rounded animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {aiAnalysis && parsedAnalysis && (
        <div className="space-y-6">
          {/* Executive Summary */}
          <ExecutiveSummaryCard summary={parsedAnalysis.executiveSummary} />

          {/* Key Metrics Grid */}
          <KeyMetricsGrid
            apiData={apiData}
            valuation={parsedAnalysis.valuation}
            formatCurrency={formatCurrency}
          />

          {/* Property Overview */}
          <PropertyOverviewCard
            propertyData={parsedAnalysis.propertyData}
            apiData={apiData}
            formatCurrency={formatCurrency}
          />

          {/* Market Valuation */}
          {parsedAnalysis.valuation && (
            <MarketValuationCard
              valuation={parsedAnalysis.valuation}
              formatCurrency={formatCurrency}
            />
          )}

          {/* Location Analysis */}
          {parsedAnalysis.location && (
            <LocationAnalysisCard location={parsedAnalysis.location} />
          )}

          {/* Risks & Opportunities */}
          <RisksOpportunitiesCard
            risks={parsedAnalysis.risks}
            opportunities={parsedAnalysis.opportunities}
          />

          {/* Recommendations */}
          {parsedAnalysis.recommendations && (
            <RecommendationsCard recommendations={parsedAnalysis.recommendations} />
          )}

          {/* Full Analysis (Collapsible) */}
          <FullAnalysisCard rawAnalysis={aiAnalysis.raw_analysis} />

          {/* Analysis Metadata */}
          <AnalysisMetadata metadata={aiAnalysis.metadata} />

          {/* Action Buttons */}
          <div className="flex justify-center space-x-4 pt-6">
            <button
              onClick={resetAnalysis}
              className="bg-slate-600 text-white py-3 px-8 rounded-lg hover:bg-slate-700 transition-colors font-medium shadow-lg"
            >
              Nieuwe Analyse Starten
            </button>
            <button
              onClick={() => window.print()}
              className="bg-blue-600 text-white py-3 px-8 rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-lg"
            >
              Rapport Printen
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Executive Summary Card
function ExecutiveSummaryCard({ summary }) {
  return (
    <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl shadow-xl p-8 text-white">
      <div className="flex items-center space-x-3 mb-6">
        <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
          <Star className="w-5 h-5" />
        </div>
        <h3 className="text-2xl font-bold">Executive Summary</h3>
      </div>
      <div className="space-y-4">
        {summary.map((point, index) => (
          <div key={index} className="flex items-start space-x-3">
            <CheckCircle className="w-5 h-5 mt-1 flex-shrink-0 text-white/80" />
            <p className="text-white/90 leading-relaxed">{point}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// Key Metrics Grid
function KeyMetricsGrid({ apiData, valuation, formatCurrency }) {
  const metrics = [
    {
      label: 'WOZ Waarde',
      value: apiData?.wozData ? formatCurrency(apiData.wozData.currentWozValue) : 'N/A',
      icon: Euro,
      color: 'green',
      trend: '+5.2%'
    },
    {
      label: 'Oppervlakte',
      value: apiData?.locationData?.inner_surface_area ? `${apiData.locationData.inner_surface_area} m²` : 'N/A',
      icon: Home,
      color: 'blue'
    },
    {
      label: 'Energielabel',
      value: apiData?.energyLabel?.energy_class || 'E (geschat)',
      icon: Zap,
      color: 'yellow'
    },
    {
      label: 'Marktwaarde (schatting)',
      value: valuation?.extractedPrice || 'Zie analyse',
      icon: Calculator,
      color: 'purple'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {metrics.map((metric, index) => {
        const Icon = metric.icon;
        return (
          <div key={index} className="bg-white rounded-xl shadow-lg border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-3">
              <Icon className={`w-6 h-6 text-${metric.color}-600`} />
              {metric.trend && (
                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                  {metric.trend}
                </span>
              )}
            </div>
            <div className="text-2xl font-bold text-slate-800 mb-1">{metric.value}</div>
            <div className="text-sm text-slate-500">{metric.label}</div>
          </div>
        );
      })}
    </div>
  );
}

// Property Overview Card
function PropertyOverviewCard({ propertyData, apiData, formatCurrency }) {
  const getDisplayValue = (value, fallback = 'N/A') => value || fallback;

  return (
    <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-6">
      <div className="flex items-center space-x-3 mb-6">
        <Home className="w-6 h-6 text-blue-600" />
        <h3 className="text-xl font-bold text-slate-800">Object Details</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="space-y-4">
          <h4 className="font-medium text-slate-700 border-b border-slate-200 pb-2">Basis Informatie</h4>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-slate-500">Type:</span>
              <span className="font-medium text-slate-800">
                {getDisplayValue(apiData?.locationData?.property_type || apiData?.locationData?.raw_data?.HouseType)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Bouwjaar:</span>
              <span className="font-medium text-slate-800">
                {getDisplayValue(apiData?.locationData?.build_year || apiData?.locationData?.raw_data?.BuildYear)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Kamers:</span>
              <span className="font-medium text-slate-800">
                {getDisplayValue(apiData?.locationData?.number_of_rooms || apiData?.locationData?.raw_data?.NumberOfRooms)}
              </span>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h4 className="font-medium text-slate-700 border-b border-slate-200 pb-2">Oppervlaktes</h4>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-slate-500">Wonen:</span>
              <span className="font-medium text-slate-800">
                {apiData?.locationData?.inner_surface_area
                  ? `${apiData.locationData.inner_surface_area} m²`
                  : apiData?.locationData?.raw_data?.InnerSurfaceArea
                    ? `${apiData.locationData.raw_data.InnerSurfaceArea} m²`
                    : 'N/A'
                }
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Perceel:</span>
              <span className="font-medium text-slate-800">
                {apiData?.wozData?.outerSurfaceArea ? `${apiData.wozData.outerSurfaceArea} m²` : 'N/A'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Inhoud:</span>
              <span className="font-medium text-slate-800">
                {getDisplayValue(apiData?.locationData?.volume || apiData?.locationData?.raw_data?.Volume, 'N/A')}
              </span>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h4 className="font-medium text-slate-700 border-b border-slate-200 pb-2">Waardering</h4>
          <div className="space-y-3">
            {apiData?.wozData && (
              <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                <div className="text-sm text-green-700 mb-1">WOZ Waarde</div>
                <div className="text-lg font-bold text-green-800">
                  {formatCurrency(apiData.wozData.currentWozValue) || 'N/A'}
                </div>
                <div className="text-xs text-green-600">
                  Peildatum: {apiData.wozData.valuationDate || 'N/A'}
                </div>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-slate-500">Energielabel:</span>
              <span className={`font-medium px-2 py-1 rounded text-sm ${
                apiData?.energyLabel?.energy_class === 'A' ? 'bg-green-100 text-green-800' :
                apiData?.energyLabel?.energy_class === 'B' ? 'bg-blue-100 text-blue-800' :
                apiData?.energyLabel?.energy_class === 'C' ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800'
              }`}>
                {getDisplayValue(apiData?.energyLabel?.energy_class, 'E (geschat)')}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Market Valuation Card
function MarketValuationCard({ valuation, formatCurrency }) {
  return (
    <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-6">
      <div className="flex items-center space-x-3 mb-6">
        <BarChart3 className="w-6 h-6 text-green-600" />
        <h3 className="text-xl font-bold text-slate-800">Marktwaarde Analyse</h3>
      </div>

      <div className="space-y-6">
        {valuation.range && (
          <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-6 border border-green-200">
            <div className="text-center">
              <div className="text-sm text-slate-600 mb-2">Geschatte Marktwaarde</div>
              <div className="text-3xl font-bold text-slate-800">{valuation.range}</div>
              {valuation.confidence && (
                <div className="text-sm text-slate-500 mt-2">Betrouwbaarheid: {valuation.confidence}</div>
              )}
            </div>
          </div>
        )}

        {valuation.factors && valuation.factors.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium text-slate-700">Waardebepalende Factoren:</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {valuation.factors.map((factor, index) => (
                <div key={index} className="flex items-start space-x-2 p-3 bg-slate-50 rounded-lg">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-slate-600 text-sm">{factor}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {valuation.methodology && (
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <h4 className="font-medium text-blue-800 mb-2">Methodologie:</h4>
            <p className="text-blue-700 text-sm">{valuation.methodology}</p>
          </div>
        )}
      </div>
    </div>
  );
}

// Location Analysis Card
function LocationAnalysisCard({ location }) {
  return (
    <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-6">
      <div className="flex items-center space-x-3 mb-6">
        <MapPin className="w-6 h-6 text-purple-600" />
        <h3 className="text-xl font-bold text-slate-800">Locatie Analyse</h3>
      </div>

      <div className="space-y-6">
        {location.summary && (
          <div className="p-4 bg-slate-50 rounded-lg">
            <p className="text-slate-700 leading-relaxed">{location.summary}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {location.strengths && location.strengths.length > 0 && (
            <div>
              <h4 className="font-medium text-green-700 mb-3 flex items-center space-x-2">
                <CheckCircle className="w-4 h-4" />
                <span>Sterke Punten</span>
              </h4>
              <div className="space-y-2">
                {location.strengths.map((strength, index) => (
                  <div key={index} className="flex items-start space-x-2 p-3 bg-green-50 rounded-lg border border-green-200">
                    <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-700 text-sm">{strength}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {location.considerations && location.considerations.length > 0 && (
            <div>
              <h4 className="font-medium text-amber-700 mb-3 flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4" />
                <span>Aandachtspunten</span>
              </h4>
              <div className="space-y-2">
                {location.considerations.map((consideration, index) => (
                  <div key={index} className="flex items-start space-x-2 p-3 bg-amber-50 rounded-lg border border-amber-200">
                    <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-700 text-sm">{consideration}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Risks & Opportunities Card
function RisksOpportunitiesCard({ risks, opportunities }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {risks && risks.length > 0 && (
        <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-6">
          <div className="flex items-center space-x-3 mb-6">
            <Shield className="w-6 h-6 text-red-600" />
            <h3 className="text-xl font-bold text-slate-800">Risico Analysis</h3>
          </div>
          <div className="space-y-3">
            {risks.map((risk, index) => (
              <div key={index} className="flex items-start space-x-3 p-4 bg-red-50 rounded-lg border border-red-200">
                <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h5 className="font-medium text-red-800 mb-1">Risico {index + 1}</h5>
                  <p className="text-slate-700 text-sm">{risk}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {opportunities && opportunities.length > 0 && (
        <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-6">
          <div className="flex items-center space-x-3 mb-6">
            <TrendingUp className="w-6 h-6 text-green-600" />
            <h3 className="text-xl font-bold text-slate-800">Kansen & Potentieel</h3>
          </div>
          <div className="space-y-3">
            {opportunities.map((opportunity, index) => (
              <div key={index} className="flex items-start space-x-3 p-4 bg-green-50 rounded-lg border border-green-200">
                <TrendingUp className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h5 className="font-medium text-green-800 mb-1">Kans {index + 1}</h5>
                  <p className="text-slate-700 text-sm">{opportunity}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Recommendations Card
function RecommendationsCard({ recommendations }) {
  return (
    <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-6">
      <div className="flex items-center space-x-3 mb-6">
        <Target className="w-6 h-6 text-blue-600" />
        <h3 className="text-xl font-bold text-slate-800">Strategische Aanbevelingen</h3>
      </div>
      <div className="space-y-4">
        {recommendations.map((rec, index) => (
          <div key={index} className="flex items-start space-x-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
              {index + 1}
            </div>
            <div className="flex-1">
              <h5 className="font-medium text-blue-800 mb-2">
                {rec.title || `Aanbeveling ${index + 1}`}
              </h5>
              <p className="text-slate-700 text-sm leading-relaxed">
                {rec.description || rec}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Full Analysis Card (Collapsible)
function FullAnalysisCard({ rawAnalysis }) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-6">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between w-full text-left hover:bg-slate-50 -m-2 p-2 rounded-lg transition-colors"
      >
        <div className="flex items-center space-x-3">
          <FileText className="w-6 h-6 text-slate-600" />
          <h3 className="text-xl font-bold text-slate-800">Volledige AI Analyse</h3>
        </div>
        <div className={`transform transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}>
          <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {isExpanded && (
        <div className="mt-6">
          <div className="bg-slate-50 p-6 rounded-lg border border-slate-200 max-h-96 overflow-y-auto">
            <div className="whitespace-pre-wrap text-slate-800 leading-relaxed text-sm">
              {rawAnalysis}
            </div>
          </div>
          <div className="mt-4 flex justify-center">
            <button
              onClick={() => {
                navigator.clipboard.writeText(rawAnalysis);
                alert('Analyse gekopieerd naar klembord!');
              }}
              className="text-sm bg-slate-100 text-slate-600 px-4 py-2 rounded-lg hover:bg-slate-200 transition-colors"
            >
              Kopieer Volledige Tekst
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Analysis Metadata Card
function AnalysisMetadata({ metadata }) {
  return (
    <div className="bg-slate-50 rounded-xl border border-slate-200 p-6">
      <div className="flex items-center space-x-3 mb-4">
        <Calendar className="w-5 h-5 text-slate-500" />
        <h4 className="font-medium text-slate-700">Analyse Metadata</h4>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg">
          <div className="text-sm text-slate-500 mb-1">AI Model</div>
          <div className="font-medium text-slate-700">{metadata.model_used}</div>
        </div>
        <div className="bg-white p-4 rounded-lg">
          <div className="text-sm text-slate-500 mb-1">Analyse Datum</div>
          <div className="font-medium text-slate-700">
            {new Date(metadata.analysis_timestamp).toLocaleDateString('nl-NL', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg">
          <div className="text-sm text-slate-500 mb-1">Data Bronnen</div>
          <div className="font-medium text-slate-700">{metadata.data_sources.length} bronnen gebruikt</div>
          <div className="text-xs text-slate-500 mt-1">
            {metadata.data_sources.join(', ')}
          </div>
        </div>
      </div>
    </div>
  );
}

// Parser function for AI analysis
function parseAIAnalysis(rawText) {
  const analysis = {
    executiveSummary: [],
    propertyData: {},
    valuation: {},
    location: {},
    risks: [],
    opportunities: [],
    recommendations: []
  };

  // Split text into lines and process
  const lines = rawText.split('\n');
  let currentSection = null;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Detect sections based on common patterns
    if (trimmed.match(/samenvatting|executive|conclusie/i)) {
      currentSection = 'executiveSummary';
    } else if (trimmed.match(/marktwaarde|waarde.*schatting|waardering/i)) {
      currentSection = 'valuation';
      // Extract price range if found
      const priceMatches = trimmed.match(/€\s*[\d.,]+/g);
      if (priceMatches) {
        analysis.valuation.range = priceMatches.join(' - ');
        analysis.valuation.extractedPrice = priceMatches[0];
      }
    } else if (trimmed.match(/locatie|ligging|gebied|buurt/i)) {
      currentSection = 'location';
    } else if (trimmed.match(/risico|gevaar|nadeel|aandacht|probleem/i)) {
      currentSection = 'risks';
    } else if (trimmed.match(/kans|potentieel|mogelijkheid|voordeel/i)) {
      currentSection = 'opportunities';
    } else if (trimmed.match(/aanbevel|advies|suggestie|strategie/i)) {
      currentSection = 'recommendations';
    }

    // Add content to current section (skip obvious headers)
    if (currentSection && trimmed.length > 15 && !trimmed.includes('**') && !trimmed.includes('###')) {
      // Clean the text
      const cleanText = trimmed.replace(/^[-•*]\s*/, '').trim();

      if (cleanText.length > 10) {
        switch (currentSection) {
          case 'executiveSummary':
            if (!analysis.executiveSummary.some(item => item.includes(cleanText.substring(0, 20)))) {
              analysis.executiveSummary.push(cleanText);
            }
            break;
          case 'risks':
            if (cleanText.match(/risico|probleem|aandacht|negatief/i)) {
              analysis.risks.push(cleanText);
            }
            break;
          case 'opportunities':
            if (cleanText.match(/kans|potentieel|positief|voordeel/i)) {
              analysis.opportunities.push(cleanText);
            }
            break;
          case 'recommendations':
            if (cleanText.match(/aanbevel|advies|moet|zou/i)) {
              analysis.recommendations.push(cleanText);
            }
            break;
          case 'valuation':
            if (!analysis.valuation.factors) analysis.valuation.factors = [];
            if (cleanText.match(/factor|beïnvloe|waarde/i)) {
              analysis.valuation.factors.push(cleanText);
            }
            break;
          case 'location':
            if (!analysis.location.summary) {
              analysis.location.summary = cleanText;
            }
            if (cleanText.match(/positief|goed|sterk|voordeel/i)) {
              if (!analysis.location.strengths) analysis.location.strengths = [];
              analysis.location.strengths.push(cleanText);
            }
            if (cleanText.match(/aandacht|probleem|zwak|nadeel/i)) {
              if (!analysis.location.considerations) analysis.location.considerations = [];
              analysis.location.considerations.push(cleanText);
            }
            break;
        }
      }
    }
  }

  // Provide fallback content if parsing didn't find much
  if (analysis.executiveSummary.length === 0) {
    analysis.executiveSummary = [
      "Professionele vastgoedanalyse uitgevoerd met AI-ondersteuning",
      "Alle beschikbare databronnen geanalyseerd en beoordeeld",
      "Marktconform waardering en risico-assessment opgesteld",
      "Strategische aanbevelingen voor investering of aankoop ontwikkeld"
    ];
  }

  // Limit arrays to prevent overcrowding
  analysis.risks = analysis.risks.slice(0, 5);
  analysis.opportunities = analysis.opportunities.slice(0, 5);
  analysis.recommendations = analysis.recommendations.slice(0, 6);
  if (analysis.valuation.factors) {
    analysis.valuation.factors = analysis.valuation.factors.slice(0, 6);
  }

  return analysis;
}
// components/AreaComponents.js
import React from 'react';
import {
  Search,
  Zap,
  Building2,
  DollarSign,
  TrendingUp,
  Eye,
  BarChart3,
  Calendar,
  Loader2,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';

// Area Data Fetching Step Component
export function AreaDataFetchingStep({
  postalCode,
  loadingState,
  areaData,
  errors,
  formatCurrency,
  onRunAIAnalysis
}) {
  const isLoading = loadingState.autosearch || loadingState.energyLabels;
  const hasProperties = areaData.properties && areaData.properties.length > 0;

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Gebied Analyse</h2>
        <p className="text-slate-600">
          Postcode {postalCode} - {hasProperties ? `${areaData.properties.length} panden gevonden` : 'Zoeken naar panden...'}
        </p>
      </div>

      <AreaStatusGrid
        loadingState={loadingState}
        areaData={areaData}
        errors={errors}
      />

      {hasProperties && (
        <PropertiesGrid
          properties={areaData.properties}
          energyLabels={areaData.energyLabels}
          formatCurrency={formatCurrency}
        />
      )}

      <div className="text-center">
        <button
          onClick={onRunAIAnalysis}
          disabled={isLoading || !hasProperties}
          className={`py-3 px-8 rounded-lg font-medium transition-all duration-200 ${
            isLoading || !hasProperties
              ? 'bg-slate-400 text-white cursor-not-allowed'
              : 'bg-green-600 text-white hover:bg-green-700 shadow-lg shadow-green-500/25'
          }`}
        >
          {isLoading ? 'Data ophalen...' : hasProperties ? 'Start AI Gebied Analyse →' : 'Wachten op data...'}
        </button>
      </div>
    </div>
  );
}

// Area Status Grid Component
export function AreaStatusGrid({ loadingState, areaData, errors }) {
  const statusItems = [
    {
      key: 'autosearch',
      icon: Search,
      title: 'Panden Zoeken',
      color: 'green',
      isLoading: loadingState.autosearch,
      hasData: areaData.properties && areaData.properties.length > 0,
      hasError: errors.autosearch,
      info: areaData.properties ? [
        `${areaData.properties.length} panden gevonden`,
        `${areaData.statistics?.properties_with_price || 0} met prijs info`
      ] : null
    },
    {
      key: 'energyLabels',
      icon: Zap,
      title: 'Energielabels',
      color: 'yellow',
      isLoading: loadingState.energyLabels,
      hasData: Object.keys(areaData.energyLabels || {}).length > 0,
      hasError: errors.energyLabels,
      info: areaData.energyLabels ? [
        `${Object.values(areaData.energyLabels).filter(label => label).length} labels gevonden`,
        `Van ${Object.keys(areaData.energyLabels).length} panden`
      ] : null
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {statusItems.map(item => {
        const Icon = item.icon;
        return (
          <div key={item.key} className="bg-white rounded-lg border border-slate-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <Icon className={`w-5 h-5 text-${item.color}-600`} />
                <span className="font-medium">{item.title}</span>
              </div>
              {item.isLoading ? (
                <Loader2 className={`w-4 h-4 animate-spin text-${item.color}-600`} />
              ) : item.hasData ? (
                <CheckCircle className="w-4 h-4 text-green-600" />
              ) : item.hasError ? (
                <AlertTriangle className="w-4 h-4 text-red-600" />
              ) : (
                <div className="w-4 h-4 rounded-full bg-slate-300"></div>
              )}
            </div>
            {item.info && (
              <div className="text-sm text-slate-600 space-y-1">
                {item.info.map((line, index) => (
                  <div key={index}>{line}</div>
                ))}
              </div>
            )}
            {item.hasError && (
              <div className="text-sm text-red-600">{item.hasError}</div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// Area Statistics Component
export function AreaStatistics({ statistics, formatCurrency }) {
  if (!statistics) return null;

  const statCards = [
    {
      label: 'Totaal Panden',
      value: statistics.total_properties,
      icon: Building2,
      color: 'blue'
    },
    {
      label: 'Met Prijs Info',
      value: statistics.properties_with_price,
      icon: DollarSign,
      color: 'green'
    },
    {
      label: 'Gemiddelde Prijs',
      value: statistics.average_price ? formatCurrency(statistics.average_price) : 'N/A',
      icon: TrendingUp,
      color: 'purple'
    },
    {
      label: 'Beschikbaar',
      value: statistics.available_properties,
      icon: Eye,
      color: 'orange'
    }
  ];

  return (
    <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-6">
      <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
        <BarChart3 className="w-5 h-5 mr-2 text-slate-600" />
        Gebied Statistieken
      </h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map(stat => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="text-center">
              <div className={`w-12 h-12 bg-${stat.color}-100 rounded-lg flex items-center justify-center mx-auto mb-2`}>
                <Icon className={`w-6 h-6 text-${stat.color}-600`} />
              </div>
              <div className="text-lg font-bold text-slate-800">{stat.value}</div>
              <div className="text-sm text-slate-600">{stat.label}</div>
            </div>
          );
        })}
      </div>

      {statistics.price_range && (
        <div className="mt-4 pt-4 border-t border-slate-200">
          <div className="text-sm text-slate-600 text-center">
            Prijsrange: {formatCurrency(statistics.price_range.min)} - {formatCurrency(statistics.price_range.max)}
          </div>
        </div>
      )}
    </div>
  );
}

// Properties Grid Component - Shows ALL properties
export function PropertiesGrid({ properties, energyLabels, formatCurrency }) {
  return (
    <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-6">
      <h3 className="text-lg font-bold text-slate-800 mb-4">
        Alle Gevonden Panden ({properties.length})
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {properties.map(property => (
          <PropertyCard
            key={property.bagid}
            property={property}
            energyLabel={energyLabels[property.bagid]}
            formatCurrency={formatCurrency}
          />
        ))}
      </div>
    </div>
  );
}

// Individual Property Card Component
export function PropertyCard({ property, energyLabel, formatCurrency }) {
  const getEnergyClassColor = (energyClass) => {
    if (!energyClass) return 'bg-slate-100 text-slate-600';
    const colorMap = {
      'A++': 'bg-green-600 text-white',
      'A+': 'bg-green-600 text-white',
      'A': 'bg-green-500 text-white',
      'B': 'bg-lime-500 text-white',
      'C': 'bg-yellow-500 text-white',
      'D': 'bg-orange-500 text-white',
      'E': 'bg-red-500 text-white',
      'F': 'bg-red-600 text-white',
      'G': 'bg-red-700 text-white'
    };
    return colorMap[energyClass.toUpperCase()] || 'bg-slate-100 text-slate-600';
  };

  return (
    <div className="border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      {/* Property Image */}
      {property.image && (
        <div className="mb-3">
          <img
            src={property.image}
            alt={property.formatted_address}
            className="w-full h-32 object-cover rounded-md"
            onError={(e) => {
              e.target.style.display = 'none';
            }}
          />
        </div>
      )}

      {/* Address */}
      <div className="mb-2">
        <h4 className="font-medium text-slate-800 text-sm">
          {property.formatted_address}
        </h4>
        <p className="text-xs text-slate-500">{property.city}</p>
      </div>

      {/* Price */}
      <div className="mb-2">
        {property.asking_price ? (
          <div className="text-sm font-bold text-green-600">
            {property.formatted_price}
          </div>
        ) : (
          <div className="text-xs text-slate-400">Geen prijs info</div>
        )}
      </div>

      {/* Status and Energy Label */}
      <div className="flex items-center justify-between">
        {/* Status */}
        <div className="text-xs">
          {property.market_status && (
            <span className={`px-2 py-1 rounded-full text-xs ${
              property.is_available ? 'bg-green-100 text-green-700' :
              property.is_sold ? 'bg-blue-100 text-blue-700' :
              'bg-slate-100 text-slate-600'
            }`}>
              {property.market_status}
            </span>
          )}
        </div>

        {/* Energy Label */}
        <div className="text-xs">
          {energyLabel?.energy_class ? (
            <span className={`px-2 py-1 rounded-full text-xs font-bold ${getEnergyClassColor(energyLabel.energy_class)}`}>
              {energyLabel.energy_class}
            </span>
          ) : (
            <span className="px-2 py-1 rounded-full text-xs bg-slate-100 text-slate-500">
              Geen label
            </span>
          )}
        </div>
      </div>

      {/* Date Listed */}
      {property.date_listed && (
        <div className="mt-2 text-xs text-slate-400 flex items-center">
          <Calendar className="w-3 h-3 mr-1" />
          {property.formatted_date}
        </div>
      )}
    </div>
  );
}
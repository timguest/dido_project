import React, { useState, useCallback, useMemo } from 'react';
import {
  ChevronDown,
  ChevronRight,
  Eye,
  EyeOff,
  Copy,
  Download,
  AlertTriangle
} from 'lucide-react';

// Advanced recursive data renderer
export function DataRenderer({ data, depth = 0, path = '', onCopy, maxDepth = 5 }) {
  const [isCollapsed, setIsCollapsed] = useState(depth > 1);
  const [showFullText, setShowFullText] = useState(false);

  // Move all hooks to the top before any early returns
  const formatKey = useCallback((key) => {
    return key
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .replace(/_/g, ' ')
      .replace(/([a-z])([A-Z])/g, '$1 $2');
  }, []);

  const formatValue = useCallback((value) => {
    // Handle different number formats that might be currency
    if (typeof value === 'number') {
      if (value > 10000 && value < 10000000) {
        try {
          return new Intl.NumberFormat('nl-NL', {
            style: 'currency',
            currency: 'EUR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
          }).format(value);
        } catch {
          return value.toLocaleString('nl-NL');
        }
      }
      return value.toLocaleString('nl-NL');
    }
    // Handle dates
    if (typeof value === 'string') {
      if (value.match(/^\d{4}-\d{2}-\d{2}/)) {
        try {
          return new Date(value).toLocaleDateString('nl-NL');
        } catch {
          return value;
        }
      }
    }
    return value;
  }, []);

  const copyToClipboard = useCallback((content) => {
    try {
      const textContent = typeof content === 'string' ? content : JSON.stringify(content, null, 2);
      navigator.clipboard.writeText(textContent);
      if (onCopy) onCopy(`Copied ${path || 'data'}`);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  }, [onCopy, path]);

  // Safety check for max depth to prevent infinite recursion
  if (depth > maxDepth) {
    return <span className="text-slate-400 text-xs italic">Max depth reached...</span>;
  }

  // Handle null/undefined
  if (data === null || data === undefined) {
    return (
      <div className="flex items-center space-x-2">
        <span className="text-slate-400 text-sm italic">
          {data === null ? 'null' : 'undefined'}
        </span>
      </div>
    );
  }

  // Handle arrays
  if (Array.isArray(data)) {
    if (data.length === 0) {
      return <span className="text-slate-400 text-sm italic">Empty array []</span>;
    }

    return (
      <div className="space-y-2">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="flex items-center space-x-1 text-xs text-slate-500 hover:text-slate-700 transition-colors"
          >
            {isCollapsed ?
              <ChevronRight className="w-3 h-3" /> :
              <ChevronDown className="w-3 h-3" />
            }
            <span className="font-medium">Array ({data.length} items)</span>
          </button>
          <button
            onClick={() => copyToClipboard(data)}
            className="text-xs text-slate-400 hover:text-slate-600 transition-colors"
            title="Copy array to clipboard"
          >
            <Copy className="w-3 h-3" />
          </button>
        </div>
        {!isCollapsed && (
          <div className="ml-4 space-y-3 border-l-2 border-slate-200 pl-4">
            {data.slice(0, 20).map((item, index) => (
              <div key={index} className="space-y-1">
                <div className="text-xs text-slate-400 font-mono">
                  [{index}]
                </div>
                <DataRenderer
                  data={item}
                  depth={depth + 1}
                  path={`${path}[${index}]`}
                  onCopy={onCopy}
                  maxDepth={maxDepth}
                />
              </div>
            ))}
            {data.length > 20 && (
              <div className="text-xs text-slate-400 italic bg-slate-50 p-2 rounded">
                ... and {data.length - 20} more items (showing first 20)
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // Handle objects
  if (typeof data === 'object') {
    const entries = Object.entries(data);
    if (entries.length === 0) {
      return <span className="text-slate-400 text-sm italic">Empty object {}</span>;
    }

    return (
      <div className="space-y-3">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="flex items-center space-x-1 text-xs text-slate-500 hover:text-slate-700 transition-colors"
          >
            {isCollapsed ?
              <ChevronRight className="w-3 h-3" /> :
              <ChevronDown className="w-3 h-3" />
            }
            <span className="font-medium">Object ({entries.length} properties)</span>
          </button>
          <button
            onClick={() => copyToClipboard(data)}
            className="text-xs text-slate-400 hover:text-slate-600 transition-colors"
            title="Copy object to clipboard"
          >
            <Copy className="w-3 h-3" />
          </button>
        </div>
        {!isCollapsed && (
          <div className="ml-4 space-y-4 border-l-2 border-slate-200 pl-4">
            {entries.map(([key, value]) => (
              <div key={key} className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className={`font-medium ${
                    depth === 0 ? 'text-slate-800 text-base' : 'text-slate-700 text-sm'
                  }`}>
                    {formatKey(key)}
                  </span>
                  <button
                    onClick={() => copyToClipboard(value)}
                    className="text-xs text-slate-300 hover:text-slate-500 transition-colors"
                    title={`Copy ${key} value`}
                  >
                    <Copy className="w-3 h-3" />
                  </button>
                </div>
                <div className="ml-2">
                  <DataRenderer
                    data={value}
                    depth={depth + 1}
                    path={path ? `${path}.${key}` : key}
                    onCopy={onCopy}
                    maxDepth={maxDepth}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Handle primitive values (string, number, boolean)
  const displayValue = formatValue(data);
  const isLongText = typeof data === 'string' && data.length > 150;

  return (
    <div className="flex items-start space-x-2 group">
      <div className={`${
        depth === 0 ? 'text-slate-800 font-medium text-base' : 'text-slate-600 text-sm'
      } break-words min-w-0 flex-1`}>
        {isLongText && !showFullText ? (
          <span>
            {String(displayValue).substring(0, 150)}
            <span className="text-slate-400">...</span>
          </span>
        ) : (
          <span className={typeof data === 'string' ? 'font-mono' : ''}>
            {String(displayValue)}
          </span>
        )}
        {/* Show data type for debugging */}
        <span className="text-xs text-slate-400 ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
          ({typeof data})
        </span>
      </div>
      <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {isLongText && (
          <button
            onClick={() => setShowFullText(!showFullText)}
            className="text-xs text-blue-500 hover:text-blue-700 transition-colors"
          >
            {showFullText ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
          </button>
        )}
        <button
          onClick={() => copyToClipboard(data)}
          className="text-xs text-slate-300 hover:text-slate-500 transition-colors"
          title="Copy value"
        >
          <Copy className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}

// Complete API Data Viewer with advanced features
export function CompleteAPIDataViewer({ apiData, formatCurrency, errors }) {
  const [expandedSections, setExpandedSections] = useState({
    locationData: false,
    referenceData: false,
    wozData: false,
    energyLabel: false
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [showOnlyWithData, setShowOnlyWithData] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState('');

  const toggleSection = useCallback((section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  }, []);

  const toggleAllSections = useCallback((expand) => {
    setExpandedSections(prev =>
      Object.keys(prev).reduce((acc, key) => ({ ...acc, [key]: expand }), {})
    );
  }, []);

  const handleCopy = useCallback(() => {
    setCopyFeedback('Gekopieerd!');
    setTimeout(() => setCopyFeedback(''), 2000);
  }, []);

  const exportData = useCallback(() => {
    const dataToExport = {
      timestamp: new Date().toISOString(),
      apiData,
      errors: Object.keys(errors).filter(key => errors[key]).length > 0 ? errors : undefined
    };
    const dataStr = JSON.stringify(dataToExport, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `dido-analytics-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }, [apiData, errors]);

  const dataCategories = useMemo(() => [
    {
      key: 'locationData',
      title: 'Altum Locatie Data',
      icon: '📍',
      color: 'blue',
      data: apiData.locationData,
      priority: 'high'
    },
    {
      key: 'referenceData',
      title: 'Altum Referentie Data',
      icon: '🏠',
      color: 'purple',
      data: apiData.referenceData,
      priority: 'high'
    },
    {
      key: 'wozData',
      title: 'WOZ Data',
      icon: '💰',
      color: 'green',
      data: apiData.wozData,
      priority: 'high'
    },
    {
      key: 'energyLabel',
      title: 'Energielabel Data',
      icon: '⚡',
      color: 'yellow',
      data: apiData.energyLabel,
      priority: 'medium'
    }
  ].filter(category => {
    const matchesSearch = !searchTerm ||
      category.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      JSON.stringify(category.data || {}).toLowerCase().includes(searchTerm.toLowerCase());
    const hasData = !showOnlyWithData || category.data;
    return matchesSearch && hasData;
  }), [apiData, searchTerm, showOnlyWithData]);

  return (
    <div className="mt-8 pt-6 border-t border-slate-200">
      {/* Header with controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 space-y-4 sm:space-y-0">
        <div>
          <h4 className="font-semibold text-slate-800 text-lg">Complete API Data</h4>
          <p className="text-sm text-slate-500">Volledige technische data van alle API calls</p>
        </div>
        <div className="flex flex-wrap items-center space-x-2 space-y-2 sm:space-y-0">
          {copyFeedback && (
            <div className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded">
              {copyFeedback}
            </div>
          )}
          <div className="flex items-center space-x-2">
            <input
              type="text"
              placeholder="Zoek in data..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="text-xs border border-slate-300 rounded px-2 py-1 w-32"
            />
            <button
              onClick={() => setShowOnlyWithData(!showOnlyWithData)}
              className={`text-xs px-2 py-1 rounded transition-colors ${
                showOnlyWithData
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {showOnlyWithData ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
            </button>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => toggleAllSections(true)}
              className="text-xs bg-slate-100 text-slate-600 px-3 py-1 rounded hover:bg-slate-200 transition-colors"
            >
              Alles Uitklappen
            </button>
            <button
              onClick={() => toggleAllSections(false)}
              className="text-xs bg-slate-100 text-slate-600 px-3 py-1 rounded hover:bg-slate-200 transition-colors"
            >
              Alles Inklappen
            </button>
            <button
              onClick={exportData}
              className="text-xs bg-blue-100 text-blue-600 px-3 py-1 rounded hover:bg-blue-200 transition-colors flex items-center space-x-1"
            >
              <Download className="w-3 h-3" />
              <span>Export</span>
            </button>
          </div>
        </div>
      </div>

      {/* Data categories */}
      <div className="space-y-4">
        {dataCategories.map(category => (
          <DataCategoryCard
            key={category.key}
            category={category}
            isExpanded={expandedSections[category.key]}
            onToggle={() => toggleSection(category.key)}
            onCopy={handleCopy}
            error={errors[category.key.replace('Data', '')]}
          />
        ))}
        {dataCategories.length === 0 && (
          <div className="text-center py-12 text-slate-500">
            <div className="text-4xl mb-4">🔍</div>
            <div className="font-medium mb-2">Geen data gevonden</div>
            <div className="text-sm">
              {searchTerm ? 'Pas je zoekterm aan of' : ''}
              {showOnlyWithData ? ' schakel "Toon alles" in.' : ' er is geen data beschikbaar.'}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Individual data category card
export function DataCategoryCard({ category, isExpanded, onToggle, onCopy, error }) {
  const hasData = Boolean(category.data);
  const dataSize = category.data ? JSON.stringify(category.data).length : 0;

  // Enhanced logging for debugging
  console.group(`🔍 ${category.title} Debug Info`);
  console.log('hasData:', hasData);
  console.log('data type:', typeof category.data);
  console.log('data keys:', category.data ? Object.keys(category.data) : 'N/A');
  console.log('first level data:', category.data);
  console.groupEnd();

  return (
    <div className="bg-white border border-slate-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow">
      <button
        onClick={onToggle}
        className="w-full px-6 py-4 bg-gradient-to-r from-slate-50 to-white hover:from-slate-100 hover:to-slate-50 transition-colors flex items-center justify-between"
      >
        <div className="flex items-center space-x-4">
          <span className="text-2xl">{category.icon}</span>
          <div className="text-left">
            <div className="font-semibold text-slate-800 text-lg">{category.title}</div>
            <div className="text-sm text-slate-500 flex items-center space-x-3">
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                hasData
                  ? 'bg-green-100 text-green-700'
                  : 'bg-slate-100 text-slate-500'
              }`}>
                {hasData ? `✓ Data loaded` : '○ No data'}
              </span>
              {hasData && (
                <>
                  <span className="text-xs">
                    {(dataSize / 1024).toFixed(1)}kb
                  </span>
                  <span className="text-xs">
                    {typeof category.data === 'object' && category.data !== null
                      ? Array.isArray(category.data)
                        ? `${category.data.length} items`
                        : `${Object.keys(category.data).length} properties`
                      : typeof category.data
                    }
                  </span>
                </>
              )}
              {error && (
                <span className="text-red-600 text-xs">⚠ {error}</span>
              )}
            </div>
          </div>
        </div>
        <div className={`transform transition-transform duration-200 ${
          isExpanded ? 'rotate-180' : ''
        }`}>
          <ChevronDown className="w-5 h-5 text-slate-400" />
        </div>
      </button>
      {isExpanded && (
        <div className="border-t border-slate-200">
          <div className="p-6 bg-slate-25 max-h-[600px] overflow-y-auto">
            {hasData ? (
              <div className="space-y-4">
                {/* Quick summary for large objects */}
                {typeof category.data === 'object' && category.data !== null && (
                  <div className="bg-blue-50 p-4 rounded-lg mb-4">
                    <h5 className="font-medium text-blue-800 mb-2">Data Summary</h5>
                    <div className="text-sm text-blue-700 space-y-1">
                      <div>Type: {Array.isArray(category.data) ? 'Array' : 'Object'}</div>
                      <div>Size: {(dataSize / 1024).toFixed(1)}kb</div>
                      {Array.isArray(category.data) && (
                        <div>Items: {category.data.length}</div>
                      )}
                      {!Array.isArray(category.data) && (
                        <div>Properties: {Object.keys(category.data).length}</div>
                      )}
                    </div>
                  </div>
                )}
                {/* Render the actual data */}
                <DataRenderer
                  data={category.data}
                  onCopy={onCopy}
                  maxDepth={6}
                />
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="text-6xl mb-4 opacity-50">📭</div>
                <div className="font-medium text-slate-600 mb-2">No Data Available</div>
                <div className="text-sm text-slate-500 mb-4">
                  This API endpoint did not return any data for the requested address.
                </div>
                {/* Debug info */}
                <details className="text-left">
                  <summary className="text-xs text-slate-400 cursor-pointer hover:text-slate-600 mb-2">
                    Debug Information
                  </summary>
                  <div className="text-xs bg-slate-100 p-3 rounded font-mono text-left space-y-1">
                    <div><strong>Raw value:</strong> {JSON.stringify(category.data)}</div>
                    <div><strong>Type:</strong> {typeof category.data}</div>
                    <div><strong>Is null:</strong> {category.data === null ? 'Yes' : 'No'}</div>
                    <div><strong>Is undefined:</strong> {category.data === undefined ? 'Yes' : 'No'}</div>
                    {error && <div><strong>Error:</strong> {error}</div>}
                  </div>
                </details>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
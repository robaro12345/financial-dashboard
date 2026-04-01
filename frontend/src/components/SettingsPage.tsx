import { useState, useEffect } from 'react';
import { addCompany } from '../api/client';

const SECTORS = [
  'IT',
  'Banking',
  'Energy',
  'FMCG',
  'Auto',
  'Pharma',
  'Telecom',
  'Infrastructure',
  'Finance',
  'Technology',
  'Healthcare',
  'Consumer Goods',
  'Industrial',
  'Real Estate',
  'Other'
];

function SettingsPage() {
  // API Key State
  const [apiKey, setApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [apiKeySaved, setApiKeySaved] = useState(false);
  
  // Add Stock State
  const [symbol, setSymbol] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [sector, setSector] = useState('IT');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Load API key from localStorage on mount
  useEffect(() => {
    const savedKey = localStorage.getItem('alphaVantageApiKey');
    if (savedKey) {
      setApiKey(savedKey);
      setApiKeySaved(true);
    }
  }, []);

  const handleSaveApiKey = () => {
    if (!apiKey.trim()) {
      setMessage({ type: 'error', text: 'Please enter an API key' });
      return;
    }
    
    localStorage.setItem('alphaVantageApiKey', apiKey.trim());
    setApiKeySaved(true);
    setMessage({ type: 'success', text: 'API key saved successfully!' });
    setTimeout(() => setMessage(null), 3000);
  };

  const handleClearApiKey = () => {
    localStorage.removeItem('alphaVantageApiKey');
    setApiKey('');
    setApiKeySaved(false);
    setMessage({ type: 'success', text: 'API key cleared' });
    setTimeout(() => setMessage(null), 3000);
  };

  const handleAddStock = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!symbol.trim() || !companyName.trim()) {
      setMessage({ type: 'error', text: 'Please fill in all required fields' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      await addCompany({
        symbol: symbol.trim().toUpperCase(),
        name: companyName.trim(),
        sector: sector
      });
      
      setMessage({ type: 'success', text: `Successfully added ${symbol.toUpperCase()}!` });
      
      // Reset form
      setSymbol('');
      setCompanyName('');
      setSector('IT');
      
      // Reload companies list
      setTimeout(() => {
        window.location.reload();
      }, 1500);
      
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || error.message || 'Failed to add stock';
      setMessage({ type: 'error', text: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  const getMaskedKey = (key: string) => {
    if (!key || key.length < 8) return key;
    return `${key.substring(0, 4)}${'*'.repeat(key.length - 8)}${key.substring(key.length - 4)}`;
  };

  return (
    <div className="flex-1 w-full overflow-auto bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="container mx-auto max-w-6xl p-4 sm:p-6 lg:p-8">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-800 mb-6 sm:mb-8 flex items-center gap-3">
          ⚙️ Settings
        </h1>

        {/* Message Display */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg ${
            message.type === 'success' 
              ? 'bg-green-100 text-green-800 border border-green-300' 
              : 'bg-red-100 text-red-800 border border-red-300'
          }`}>
            {message.text}
          </div>
        )}

        {/* API Key Section */}
        <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 mb-6 sm:mb-8 border border-gray-200">
          <h2 className="text-xl sm:text-2xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
            🔑 Alpha Vantage API Key
          </h2>
          <p className="text-gray-600 mb-4 text-xs sm:text-sm">
            Enter your Alpha Vantage API key to fetch stock data. Get a free key at{' '}
            <a 
              href="https://www.alphavantage.co/support/#api-key" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              alphavantage.co
            </a>
          </p>

          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="flex-1 relative">
                <input
                  type={showApiKey ? 'text' : 'password'}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Enter your API key"
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                />
              </div>
              <button
                type="button"
                onClick={() => setShowApiKey(!showApiKey)}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors text-xl sm:text-2xl"
              >
                {showApiKey ? '🙈' : '👁️'}
              </button>
            </div>

            {apiKeySaved && (
              <p className="text-xs sm:text-sm text-green-600 flex items-center gap-2">
                ✅ Current key: {getMaskedKey(apiKey)}
              </p>
            )}

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleSaveApiKey}
                className="px-4 sm:px-6 py-2 sm:py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold shadow-md hover:shadow-lg text-sm sm:text-base"
              >
                💾 Save API Key
              </button>
              {apiKeySaved && (
                <button
                  onClick={handleClearApiKey}
                  className="px-4 sm:px-6 py-2 sm:py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-semibold shadow-md hover:shadow-lg text-sm sm:text-base"
                >
                  🗑️ Clear
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Add Stock Section */}
        <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 border border-gray-200">
          <h2 className="text-xl sm:text-2xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
            📈 Add New Stock
          </h2>
          <p className="text-gray-600 mb-6 text-xs sm:text-sm">
            Add a new stock symbol to track. Make sure to use the correct format (e.g., AAPL for Apple, TCS.BSE for Indian stocks on BSE).
          </p>

          <form onSubmit={handleAddStock} className="space-y-4">
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                Stock Symbol <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={symbol}
                onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                placeholder="e.g., AAPL, TCS.BSE, GOOGL"
                className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Use exchange suffix for non-US stocks (e.g., .BSE for Bombay Stock Exchange)
              </p>
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                Company Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="e.g., Apple Inc., Tata Consultancy Services"
                className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                required
              />
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                Sector <span className="text-red-500">*</span>
              </label>
              <select
                value={sector}
                onChange={(e) => setSector(e.target.value)}
                className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-sm sm:text-base"
                required
              >
                {SECTORS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-semibold shadow-md hover:shadow-lg transition-all text-sm sm:text-base ${
                loading
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white'
              }`}
            >
              {loading ? '⏳ Adding Stock...' : '➕ Add Stock'}
            </button>
          </form>

          <div className="mt-6 p-3 sm:p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-xs sm:text-sm text-blue-800">
              <strong>Note:</strong> After adding a new stock, you'll need to refresh data using the "Refresh Data" button 
              in the dashboard to fetch historical prices for the new symbol.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SettingsPage;

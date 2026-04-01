import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getCompanies } from '../api/client';
import { useStockContext } from '../contexts/StockContext';

const SidebarComponent: React.FC<{ onClose?: () => void }> = ({ onClose }) => {
  const { selectedSymbol, setSelectedSymbol, sectorFilter, setSectorFilter } = useStockContext();
  const [searchQuery, setSearchQuery] = useState('');

  const { data: companies, isLoading, error } = useQuery({
    queryKey: ['companies'],
    queryFn: getCompanies,
  });

  const sectors = ['IT', 'Banking', 'Energy', 'FMCG', 'Auto', 'Pharma', 'Telecom'];

  const filteredCompanies = useMemo(() => {
    return companies?.filter((company) => {
      const matchesSearch = company.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            company.symbol.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesSector = !sectorFilter || company.sector === sectorFilter;
      return matchesSearch && matchesSector;
    });
  }, [companies, searchQuery, sectorFilter]);

  const handleStockSelect = (symbol: string) => {
    setSelectedSymbol(symbol);
    onClose?.(); // Close sidebar on mobile after selection
  };

  if (isLoading) {
    return (
      <div className="w-full lg:w-80 bg-white border-r border-gray-200 p-4 lg:p-4">
        <div className="animate-pulse space-y-4">
          <div className="h-10 bg-gray-200 rounded"></div>
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-12 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full lg:w-80 bg-white border-r border-gray-200 p-4">
        <div className="text-red-600">Error loading companies</div>
      </div>
    );
  }

  return (
    <div className="w-full lg:w-80 bg-white border-r border-gray-200 flex flex-col h-full lg:h-screen">
      {/* Mobile Header with Close Button */}
      <div className="lg:hidden flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
        <h2 className="text-lg font-bold text-gray-800">Select Stock</h2>
        <button
          onClick={onClose}
          className="p-1 text-gray-500 hover:text-gray-700 transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Header */}
      <div className="p-3 sm:p-4 border-b border-gray-200">
        <h2 className="hidden lg:block text-xl font-bold text-gray-800 mb-4">Stock Dashboard</h2>
        
        <input
          type="text"
          placeholder="Search stocks..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Sector Filter */}
      <div className="p-3 sm:p-4 border-b border-gray-200">
        <div className="flex flex-wrap gap-1 sm:gap-2">
          <button
            onClick={() => setSectorFilter(null)}
            className={`px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium transition-colors ${
              !sectorFilter
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            All
          </button>
          {sectors.map((sector) => (
            <button
              key={sector}
              onClick={() => setSectorFilter(sector)}
              className={`px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium transition-colors ${
                sectorFilter === sector
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {sector}
            </button>
          ))}
        </div>
      </div>

      {/* Stock List */}
      <div className="flex-1 overflow-y-auto p-2 sm:p-2">
        {filteredCompanies?.length === 0 ? (
          <div className="text-center text-gray-500 py-8 text-sm sm:text-base">No stocks found</div>
        ) : (
          <div className="space-y-1">
            {filteredCompanies?.map((company) => (
              <button
                key={company.symbol}
                onClick={() => handleStockSelect(company.symbol)}
                className={`w-full text-left px-3 sm:px-4 py-2 sm:py-3 rounded-lg transition-colors ${
                  selectedSymbol === company.symbol
                    ? 'bg-blue-50 border-l-4 border-blue-600'
                    : 'hover:bg-gray-50'
                }`}
              >
                <div className="font-semibold text-gray-900 text-sm sm:text-base">{company.symbol}</div>
                <div className="text-xs sm:text-sm text-gray-600 truncate">{company.name}</div>
                <div className="text-xs text-gray-500 mt-1">{company.sector}</div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export const Sidebar = React.memo(SidebarComponent);

import React from 'react';
import { useStockContext } from '../contexts/StockContext';
import { useQuery } from '@tanstack/react-query';
import { getStockData } from '../api/client';

export const StockHeader: React.FC = () => {
  const { selectedSymbol } = useStockContext();

  const { data, isLoading } = useQuery({
    queryKey: ['stockData', selectedSymbol, 7],
    queryFn: () => getStockData(selectedSymbol!, 7),
    enabled: !!selectedSymbol,
  });

  if (!selectedSymbol) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="bg-white shadow-lg rounded-xl p-6 animate-pulse border border-gray-200">
        <div className="h-8 bg-gradient-to-r from-gray-200 to-gray-300 rounded w-1/3 mb-4"></div>
        <div className="h-12 bg-gradient-to-r from-gray-200 to-gray-300 rounded w-1/4 mb-4"></div>
        <div className="h-6 bg-gradient-to-r from-gray-200 to-gray-300 rounded w-1/2"></div>
      </div>
    );
  }

  // Handle both array and nested object response formats for compatibility
  const stockDataArray = Array.isArray(data) ? data : (data as any)?.data || [];
  const latestData = stockDataArray[0];
  const dailyReturn = latestData?.daily_return ?? 0;
  const isPositive = dailyReturn >= 0;

  return (
    <div className="bg-gradient-to-br from-white to-gray-50 shadow-xl rounded-xl p-4 sm:p-6 border border-gray-200 transform transition-all duration-300 hover:shadow-2xl">
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 sm:gap-3 mb-2">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              {selectedSymbol}
            </h2>
            <span className="text-lg sm:text-xl lg:text-2xl">{isPositive ? '🚀' : '📉'}</span>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-baseline gap-2 sm:gap-4">
            <span className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900">
              ₹{latestData?.close.toFixed(2)}
            </span>
            <span
              className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-sm sm:text-base font-bold shadow-md transform transition-all hover:scale-105 inline-block w-fit ${
                isPositive
                  ? 'bg-gradient-to-r from-green-400 to-emerald-500 text-white'
                  : 'bg-gradient-to-r from-red-400 to-rose-500 text-white'
              }`}
            >
              {isPositive ? '▲ +' : '▼ '}
              {(dailyReturn * 100).toFixed(2)}%
            </span>
          </div>
        </div>
        
        {latestData && (
          <div className="bg-blue-50 p-3 sm:p-4 rounded-lg border border-blue-200 w-full lg:w-auto lg:text-right">
            <div className="text-xs sm:text-sm text-blue-600 font-semibold mb-1">Last Updated</div>
            <div className="text-gray-900 font-bold text-sm sm:text-base lg:text-lg">
              {new Date(latestData.date).toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric', 
                year: 'numeric' 
              })}
            </div>
          </div>
        )}
      </div>
      
      {latestData && (
        <div className="mt-4 sm:mt-6 grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 pt-4 sm:pt-6 border-t-2 border-gray-200">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-3 sm:p-4 rounded-lg border border-blue-200 transform transition-all hover:scale-105">
            <div className="text-xs sm:text-sm text-blue-600 font-semibold mb-1">Open</div>
            <div className="text-base sm:text-lg lg:text-xl font-bold text-gray-900">₹{latestData.open.toFixed(2)}</div>
          </div>
          <div className="bg-gradient-to-br from-green-50 to-green-100 p-3 sm:p-4 rounded-lg border border-green-200 transform transition-all hover:scale-105">
            <div className="text-xs sm:text-sm text-green-600 font-semibold mb-1">High</div>
            <div className="text-base sm:text-lg lg:text-xl font-bold text-gray-900">₹{latestData.high.toFixed(2)}</div>
          </div>
          <div className="bg-gradient-to-br from-red-50 to-red-100 p-3 sm:p-4 rounded-lg border border-red-200 transform transition-all hover:scale-105">
            <div className="text-xs sm:text-sm text-red-600 font-semibold mb-1">Low</div>
            <div className="text-base sm:text-lg lg:text-xl font-bold text-gray-900">₹{latestData.low.toFixed(2)}</div>
          </div>
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-3 sm:p-4 rounded-lg border border-purple-200 transform transition-all hover:scale-105">
            <div className="text-xs sm:text-sm text-purple-600 font-semibold mb-1">Volume</div>
            <div className="text-base sm:text-lg lg:text-xl font-bold text-gray-900">
              {(latestData.volume / 1000000).toFixed(2)}M
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

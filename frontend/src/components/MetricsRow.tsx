import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { getStockSummary } from '../api/client';
import { useStockContext } from '../contexts/StockContext';

export const MetricsRow: React.FC = () => {
  const { selectedSymbol } = useStockContext();

  const { data: summary, isLoading } = useQuery({
    queryKey: ['summary', selectedSymbol],
    queryFn: () => getStockSummary(selectedSymbol!),
    enabled: !!selectedSymbol,
  });

  if (!selectedSymbol) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-pulse">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white p-6 rounded-xl border border-gray-200 shadow-lg">
            <div className="h-5 bg-gradient-to-r from-gray-200 to-gray-300 rounded mb-3"></div>
            <div className="h-8 bg-gradient-to-r from-gray-200 to-gray-300 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  if (!summary) {
    return null;
  }

  const getSentimentColor = (label: string) => {
    if (label === 'Bullish') return 'text-green-700 bg-gradient-to-r from-green-100 to-emerald-100 border-green-300';
    if (label === 'Bearish') return 'text-red-700 bg-gradient-to-r from-red-100 to-rose-100 border-red-300';
    return 'text-gray-700 bg-gradient-to-r from-gray-100 to-gray-200 border-gray-300';
  };

  const getSentimentEmoji = (label: string) => {
    if (label === 'Bullish') return '🐂';
    if (label === 'Bearish') return '🐻';
    return '😐';
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 sm:p-5 rounded-xl border-2 border-blue-200 shadow-lg transform transition-all duration-300 hover:scale-105 hover:shadow-xl">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-base sm:text-lg">📈</span>
          <div className="text-xs sm:text-sm text-blue-700 font-bold">52W High</div>
        </div>
        <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">
          ₹{summary.week_52_high?.toFixed(2) ?? 'N/A'}
        </div>
      </div>

      <div className="bg-gradient-to-br from-red-50 to-red-100 p-4 sm:p-5 rounded-xl border-2 border-red-200 shadow-lg transform transition-all duration-300 hover:scale-105 hover:shadow-xl">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-base sm:text-lg">📉</span>
          <div className="text-xs sm:text-sm text-red-700 font-bold">52W Low</div>
        </div>
        <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">
          ₹{summary.week_52_low?.toFixed(2) ?? 'N/A'}
        </div>
      </div>

      <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 sm:p-5 rounded-xl border-2 border-purple-200 shadow-lg transform transition-all duration-300 hover:scale-105 hover:shadow-xl">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-base sm:text-lg">📊</span>
          <div className="text-xs sm:text-sm text-purple-700 font-bold">Volatility</div>
        </div>
        <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">
          {((summary.volatility ?? 0) * 100).toFixed(2)}%
        </div>
      </div>

      <div className="bg-gradient-to-br from-amber-50 to-amber-100 p-4 sm:p-5 rounded-xl border-2 border-amber-200 shadow-lg transform transition-all duration-300 hover:scale-105 hover:shadow-xl">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-base sm:text-lg">🎯</span>
          <div className="text-xs sm:text-sm text-amber-700 font-bold">Sentiment</div>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
          <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">
            {summary.sentiment_score?.toFixed(0) ?? 'N/A'}
          </div>
          <span
            className={`px-2 sm:px-3 py-1 rounded-full text-[10px] sm:text-xs font-bold border-2 shadow-md w-fit ${getSentimentColor(
              summary.sentiment_label ?? 'Neutral'
            )}`}
          >
            {getSentimentEmoji(summary.sentiment_label ?? 'Neutral')} {summary.sentiment_label ?? 'Neutral'}
          </span>
        </div>
      </div>
    </div>
  );
};

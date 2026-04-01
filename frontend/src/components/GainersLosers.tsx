import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { getGainersLosers } from '../api/client';

const GainersLosersComponent: React.FC = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['gainersLosers'],
    queryFn: getGainersLosers,
  });

  if (isLoading) {
    return (
      <div className="flex flex-col w-full h-full min-h-screen">
        <div className="flex-1 overflow-auto bg-gradient-to-br from-gray-50 to-gray-100 p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            <div className="mb-6 sm:mb-8">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2">Top Gainers & Losers</h1>
              <p className="text-sm sm:text-base text-gray-600">Track the best and worst performing stocks today</p>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
              {[1, 2].map((col) => (
                <div key={col} className="bg-white rounded-xl border border-gray-200 shadow-lg overflow-hidden animate-pulse">
                  <div className="h-12 sm:h-16 bg-gray-200"></div>
                  <div className="p-4 sm:p-6 space-y-3 sm:space-y-4">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div key={i} className="h-16 sm:h-20 bg-gray-100 rounded-lg"></div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col w-full h-full min-h-screen">
        <div className="flex-1 overflow-auto bg-gradient-to-br from-gray-50 to-gray-100 p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            <div className="mb-6 sm:mb-8">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2">Top Gainers & Losers</h1>
              <p className="text-sm sm:text-base text-gray-600">Track the best and worst performing stocks today</p>
            </div>
            <div className="bg-white rounded-xl border border-red-200 shadow-lg p-8 sm:p-12 text-center">
              <div className="text-4xl sm:text-5xl lg:text-6xl mb-4">⚠️</div>
              <h3 className="text-lg sm:text-xl font-semibold text-red-600 mb-2">Error Loading Data</h3>
              <p className="text-sm sm:text-base text-gray-600">Unable to fetch gainers and losers. Please try again later.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full h-full min-h-screen">
      <div className="flex-1 overflow-auto bg-gradient-to-br from-gray-50 to-gray-100 p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
              Top Gainers & Losers
            </h1>
            <p className="text-sm sm:text-base text-gray-600">Track the best and worst performing stocks today</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
            {/* Top Gainers */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-lg overflow-hidden transform transition-all duration-300 hover:shadow-2xl hover:scale-[1.02]">
              <div className="bg-gradient-to-r from-green-500 to-emerald-600 px-6 py-5">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">📈</span>
                  <h2 className="text-2xl font-bold text-white">Top Gainers</h2>
                </div>
              </div>
              <div className="divide-y divide-gray-100">
                {data?.gainers.map((stock, index) => (
                  <div
                    key={stock.symbol}
                    className="px-6 py-5 hover:bg-gradient-to-r hover:from-green-50 hover:to-emerald-50 transition-all duration-200 transform hover:translate-x-1"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 text-white font-bold text-lg shadow-md">
                          {index + 1}
                        </div>
                        <div>
                          <div className="font-bold text-gray-900 text-lg">{stock.symbol}</div>
                          <div className="text-sm text-gray-600">{stock.name}</div>
                          <div className="text-xs text-gray-500 mt-1">
                            <span className="inline-block px-2 py-0.5 bg-gray-100 rounded-full">{stock.sector}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-gray-900 text-lg">
                          ₹{stock.current_price.toFixed(2)}
                        </div>
                        <div className="inline-block mt-1 px-3 py-1 bg-green-100 text-green-700 font-bold rounded-full text-sm">
                          +{(stock.daily_return * 100).toFixed(2)}%
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Losers */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-lg overflow-hidden transform transition-all duration-300 hover:shadow-2xl hover:scale-[1.02]">
              <div className="bg-gradient-to-r from-red-500 to-rose-600 px-6 py-5">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">📉</span>
                  <h2 className="text-2xl font-bold text-white">Top Losers</h2>
                </div>
              </div>
              <div className="divide-y divide-gray-100">
                {data?.losers.map((stock, index) => (
                  <div
                    key={stock.symbol}
                    className="px-6 py-5 hover:bg-gradient-to-r hover:from-red-50 hover:to-rose-50 transition-all duration-200 transform hover:translate-x-1"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-red-500 to-rose-600 text-white font-bold text-lg shadow-md">
                          {index + 1}
                        </div>
                        <div>
                          <div className="font-bold text-gray-900 text-lg">{stock.symbol}</div>
                          <div className="text-sm text-gray-600">{stock.name}</div>
                          <div className="text-xs text-gray-500 mt-1">
                            <span className="inline-block px-2 py-0.5 bg-gray-100 rounded-full">{stock.sector}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-gray-900 text-lg">
                          ₹{stock.current_price.toFixed(2)}
                        </div>
                        <div className="inline-block mt-1 px-3 py-1 bg-red-100 text-red-700 font-bold rounded-full text-sm">
                          {(stock.daily_return * 100).toFixed(2)}%
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GainersLosersComponent;

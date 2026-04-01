import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getCompanies, compareStocks } from '../api/client';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

const ComparePageComponent: React.FC = () => {
  const [symbol1, setSymbol1] = useState<string>('');
  const [symbol2, setSymbol2] = useState<string>('');

  const { data: companies } = useQuery({
    queryKey: ['companies'],
    queryFn: getCompanies,
  });

  const { data, isLoading, error } = useQuery({
    queryKey: ['compare', symbol1, symbol2],
    queryFn: () => compareStocks(symbol1, symbol2),
    enabled: !!symbol1 && !!symbol2 && symbol1 !== symbol2,
  });

  const chartData = useMemo(() => {
    if (!data) return [];
    return data.symbol1_data.map((item, index) => ({
      date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      [symbol1]: item.normalized_price,
      [symbol2]: data.symbol2_data[index]?.normalized_price,
    }));
  }, [data, symbol1, symbol2]);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 rounded-lg shadow-xl border border-gray-200">
          <p className="font-bold text-gray-900 mb-2">{payload[0].payload.date}</p>
          <div className="space-y-1">
            {payload.map((entry: any, index: number) => (
              <p key={index} className="text-sm">
                <span className="font-semibold" style={{ color: entry.color }}>
                  {entry.name}:{' '}
                </span>
                <span className="text-gray-900">{entry.value.toFixed(2)}</span>
              </p>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="flex flex-col w-full h-full min-h-screen">
      <div className="flex-1 overflow-auto bg-gradient-to-br from-gray-50 to-gray-100 p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
              Compare Stocks
            </h1>
            <p className="text-sm sm:text-base text-gray-600">Visualize the relative performance of two stocks side by side</p>
          </div>

          <div className="bg-white p-4 sm:p-6 rounded-xl border border-gray-200 shadow-lg mb-6 sm:mb-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              <div className="space-y-2">
                <label className="block text-xs sm:text-sm font-semibold text-gray-700">
                  <span className="flex items-center gap-2">
                    <span className="text-base sm:text-lg">📊</span>
                    First Stock
                  </span>
                </label>
                <select
                  value={symbol1}
                  onChange={(e) => setSymbol1(e.target.value)}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white hover:border-gray-400"
                >
                  <option value="">Select a stock...</option>
                  {companies?.map((company) => (
                    <option key={company.symbol} value={company.symbol}>
                      {company.symbol} - {company.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="block text-xs sm:text-sm font-semibold text-gray-700">
                  <span className="flex items-center gap-2">
                    <span className="text-base sm:text-lg">📈</span>
                    Second Stock
                  </span>
                </label>
                <select
                  value={symbol2}
                  onChange={(e) => setSymbol2(e.target.value)}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all bg-white hover:border-gray-400"
                >
                  <option value="">Select a stock...</option>
                  {companies?.map((company) => (
                    <option key={company.symbol} value={company.symbol}>
                      {company.symbol} - {company.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {!symbol1 || !symbol2 ? (
            <div className="bg-white p-8 sm:p-12 lg:p-16 rounded-xl border-2 border-dashed border-gray-300 text-center">
              <div className="text-4xl sm:text-5xl lg:text-6xl mb-4">🔍</div>
              <p className="text-gray-600 text-base sm:text-lg font-medium">Select two stocks to compare their performance</p>
              <p className="text-gray-500 text-sm mt-2">Choose stocks from the dropdowns above</p>
            </div>
          ) : symbol1 === symbol2 ? (
            <div className="bg-white p-16 rounded-xl border-2 border-red-200 text-center">
              <div className="text-6xl mb-4">⚠️</div>
              <p className="text-red-600 text-lg font-semibold">Please select two different stocks</p>
              <p className="text-gray-600 text-sm mt-2">Comparison requires two distinct stocks</p>
            </div>
          ) : isLoading ? (
            <div className="bg-white p-16 rounded-xl border border-gray-200 shadow-lg">
              <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mb-4"></div>
                <p className="text-gray-600 text-lg font-medium">Loading comparison data...</p>
              </div>
            </div>
          ) : error ? (
            <div className="bg-white p-16 rounded-xl border border-red-200 shadow-lg text-center">
              <div className="text-6xl mb-4">⚠️</div>
              <p className="text-red-600 text-lg font-semibold">Error loading comparison data</p>
              <p className="text-gray-600 text-sm mt-2">Please try again or select different stocks</p>
            </div>
          ) : (
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-lg transform transition-all duration-300 hover:shadow-xl">
              <div className="flex items-center gap-3 mb-6">
                <span className="text-2xl">📉</span>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">
                    Normalized Price Comparison
                  </h3>
                  <p className="text-sm text-gray-600">Both stocks start at base 100</p>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={550}>
                <LineChart data={chartData}>
                  <defs>
                    <linearGradient id="colorSymbol1" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorSymbol2" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" strokeOpacity={0.5} />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 12, fill: '#6b7280' }}
                    stroke="#9ca3af"
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 12, fill: '#6b7280' }}
                    stroke="#9ca3af"
                    domain={['auto', 'auto']}
                    tickLine={false}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend 
                    wrapperStyle={{ paddingTop: '20px' }}
                    iconType="line"
                  />
                  <Line
                    type="monotone"
                    dataKey={symbol1}
                    stroke="#3b82f6"
                    strokeWidth={3}
                    dot={false}
                    activeDot={{ r: 6, fill: '#3b82f6', stroke: '#fff', strokeWidth: 2 }}
                    name={symbol1}
                  />
                  <Line
                    type="monotone"
                    dataKey={symbol2}
                    stroke="#f59e0b"
                    strokeWidth={3}
                    dot={false}
                    activeDot={{ r: 6, fill: '#f59e0b', stroke: '#fff', strokeWidth: 2 }}
                    name={symbol2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ComparePageComponent;

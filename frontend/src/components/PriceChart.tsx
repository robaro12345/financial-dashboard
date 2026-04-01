import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useStockContext } from '../contexts/StockContext';
import { getStockData } from '../api/client';
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

export const PriceChart: React.FC = () => {
  const { selectedSymbol, timeFilter } = useStockContext();

  const { data, isLoading, error } = useQuery({
    queryKey: ['stockData', selectedSymbol, timeFilter],
    queryFn: () => getStockData(selectedSymbol!, timeFilter),
    enabled: !!selectedSymbol,
  });

  if (!selectedSymbol) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-lg">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-2xl">📊</span>
          <h3 className="text-xl font-bold text-gray-900">Price Chart</h3>
        </div>
        <div className="h-96 animate-pulse bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
            <p className="text-gray-600 font-medium">Loading chart data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white p-6 rounded-xl border border-red-200 shadow-lg">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-2xl">📊</span>
          <h3 className="text-xl font-bold text-gray-900">Price Chart</h3>
        </div>
        <div className="h-96 flex items-center justify-center bg-gradient-to-br from-red-50 to-rose-50 rounded-lg">
          <div className="text-center">
            <div className="text-5xl mb-4">⚠️</div>
            <p className="text-red-600 font-semibold text-lg">Error loading chart data</p>
            <p className="text-gray-600 text-sm mt-2">Please try again later</p>
          </div>
        </div>
      </div>
    );
  }

  // Handle both array and nested object response formats for compatibility
  const stockDataArray = Array.isArray(data) ? data : (data as any)?.data || [];
  
  if (!stockDataArray || stockDataArray.length === 0) {
    return (
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-lg">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-2xl">📊</span>
          <h3 className="text-xl font-bold text-gray-900">Price Chart</h3>
        </div>
        <div className="h-96 flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg">
          <div className="text-center">
            <div className="text-5xl mb-4">📭</div>
            <p className="text-gray-600 font-medium">No data available</p>
            <p className="text-gray-500 text-sm mt-2">Try refreshing or selecting a different stock</p>
          </div>
        </div>
      </div>
    );
  }

  const chartData = [...stockDataArray].reverse().map((item) => ({
    date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    close: item.close,
    ma_7: item.ma_7,
    ma_20: item.ma_20,
  }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 rounded-lg shadow-xl border border-gray-200">
          <p className="font-bold text-gray-900 mb-2">{payload[0].payload.date}</p>
          <div className="space-y-1">
            <p className="text-sm">
              <span className="font-semibold text-blue-600">Close: </span>
              <span className="text-gray-900">₹{payload[0].value.toFixed(2)}</span>
            </p>
            {payload[1] && (
              <p className="text-sm">
                <span className="font-semibold text-orange-600">MA7: </span>
                <span className="text-gray-900">₹{payload[1].value.toFixed(2)}</span>
              </p>
            )}
            {payload[2] && (
              <p className="text-sm">
                <span className="font-semibold text-green-600">MA20: </span>
                <span className="text-gray-900">₹{payload[2].value.toFixed(2)}</span>
              </p>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-lg transform transition-all duration-300 hover:shadow-xl">
      <div className="flex items-center gap-3 mb-6">
        <span className="text-2xl">📊</span>
        <h3 className="text-xl font-bold text-gray-900">Price Chart with Moving Averages</h3>
      </div>
      <ResponsiveContainer width="100%" height={450}>
        <LineChart data={chartData}>
          <defs>
            <linearGradient id="colorClose" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
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
            tickFormatter={(value) => `₹${value}`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend 
            wrapperStyle={{ paddingTop: '20px' }}
            iconType="line"
          />
          <Line
            type="monotone"
            dataKey="close"
            stroke="#3b82f6"
            strokeWidth={3}
            dot={false}
            activeDot={{ r: 6, fill: '#3b82f6', stroke: '#fff', strokeWidth: 2 }}
            name="Close Price"
          />
          <Line
            type="monotone"
            dataKey="ma_7"
            stroke="#f97316"
            strokeWidth={2}
            dot={false}
            strokeDasharray="5 5"
            activeDot={{ r: 5, fill: '#f97316', stroke: '#fff', strokeWidth: 2 }}
            name="7-Day MA"
          />
          <Line
            type="monotone"
            dataKey="ma_20"
            stroke="#10b981"
            strokeWidth={2}
            dot={false}
            strokeDasharray="5 5"
            activeDot={{ r: 5, fill: '#10b981', stroke: '#fff', strokeWidth: 2 }}
            name="20-Day MA"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

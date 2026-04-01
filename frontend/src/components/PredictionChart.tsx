import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useStockContext } from '../contexts/StockContext';
import { getStockData, getPrediction } from '../api/client';
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

export const PredictionChart: React.FC = () => {
  const { selectedSymbol } = useStockContext();

  const { data: historicalData } = useQuery({
    queryKey: ['stockData', selectedSymbol, 30],
    queryFn: () => getStockData(selectedSymbol!, 30),
    enabled: !!selectedSymbol,
  });

  const { data: prediction, isLoading, error } = useQuery({
    queryKey: ['prediction', selectedSymbol],
    queryFn: () => getPrediction(selectedSymbol!),
    enabled: !!selectedSymbol,
  });

  if (!selectedSymbol) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-lg">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-2xl">🤖</span>
          <h3 className="text-xl font-bold text-gray-900">AI-Powered 7-Day Forecast</h3>
        </div>
        <div className="h-96 animate-pulse bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mb-4"></div>
            <p className="text-gray-600 font-medium">Generating AI prediction...</p>
            <p className="text-gray-500 text-sm mt-2">Using LSTM neural network</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white p-6 rounded-xl border border-red-200 shadow-lg">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-2xl">🤖</span>
          <h3 className="text-xl font-bold text-gray-900">AI-Powered 7-Day Forecast</h3>
        </div>
        <div className="h-96 flex items-center justify-center bg-gradient-to-br from-red-50 to-rose-50 rounded-lg">
          <div className="text-center">
            <div className="text-5xl mb-4">⚠️</div>
            <p className="text-red-600 font-semibold text-lg">Error loading prediction</p>
            <p className="text-gray-600 text-sm mt-2">ML model might need training</p>
          </div>
        </div>
      </div>
    );
  }

  // Handle both array and nested object response formats for compatibility
  const stockDataArray = Array.isArray(historicalData) ? historicalData : (historicalData as any)?.data || [];
  
  if (!stockDataArray || stockDataArray.length === 0 || !prediction) {
    return (
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-lg">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-2xl">🤖</span>
          <h3 className="text-xl font-bold text-gray-900">AI-Powered 7-Day Forecast</h3>
        </div>
        <div className="h-96 flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg">
          <div className="text-center">
            <div className="text-5xl mb-4">📭</div>
            <p className="text-gray-600 font-medium">No data available for prediction</p>
            <p className="text-gray-500 text-sm mt-2">Ensure historical data exists</p>
          </div>
        </div>
      </div>
    );
  }

  // Prepare historical data (last 14 days)
  const historical = [...stockDataArray]
    .reverse()
    .slice(-14)
    .map((item, index) => ({
      index,
      date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      actual: item.close,
      forecast: null,
    }));

  // Prepare forecast data
  const forecast = prediction.forecast.map((price, index) => ({
    index: historical.length + index,
    date: `Day +${index + 1}`,
    actual: null,
    forecast: price,
  }));

  const chartData = [...historical, ...forecast];

  const getTrendColor = (trend: string) => {
    if (trend === 'Bullish') return 'bg-gradient-to-r from-green-400 to-emerald-500 text-white border-green-300';
    if (trend === 'Bearish') return 'bg-gradient-to-r from-red-400 to-rose-500 text-white border-red-300';
    return 'bg-gradient-to-r from-gray-400 to-gray-500 text-white border-gray-300';
  };

  const getTrendEmoji = (trend: string) => {
    if (trend === 'Bullish') return '🚀';
    if (trend === 'Bearish') return '📉';
    return '➡️';
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 rounded-lg shadow-xl border border-gray-200">
          <p className="font-bold text-gray-900 mb-2">{payload[0].payload.date}</p>
          <div className="space-y-1">
            {payload[0].value && (
              <p className="text-sm">
                <span className="font-semibold text-blue-600">Actual: </span>
                <span className="text-gray-900">₹{payload[0].value.toFixed(2)}</span>
              </p>
            )}
            {payload[1]?.value && (
              <p className="text-sm">
                <span className="font-semibold text-purple-600">Forecast: </span>
                <span className="text-gray-900">₹{payload[1].value.toFixed(2)}</span>
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
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🤖</span>
          <div>
            <h3 className="text-xl font-bold text-gray-900">AI-Powered 7-Day Forecast</h3>
            <p className="text-sm text-gray-600">LSTM Neural Network Prediction</p>
          </div>
        </div>
        <span className={`px-4 py-2 rounded-full text-sm font-bold shadow-md border-2 ${getTrendColor(prediction.trend)}`}>
          {getTrendEmoji(prediction.trend)} {prediction.trend}
        </span>
      </div>
      <ResponsiveContainer width="100%" height={450}>
        <LineChart data={chartData}>
          <defs>
            <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="colorForecast" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.1}/>
              <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
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
            dataKey="actual"
            stroke="#3b82f6"
            strokeWidth={3}
            dot={false}
            activeDot={{ r: 6, fill: '#3b82f6', stroke: '#fff', strokeWidth: 2 }}
            name="Historical Price"
          />
          <Line
            type="monotone"
            dataKey="forecast"
            stroke="#8b5cf6"
            strokeWidth={3}
            strokeDasharray="5 5"
            dot={{ fill: '#8b5cf6', r: 5, stroke: '#fff', strokeWidth: 2 }}
            activeDot={{ r: 7, fill: '#8b5cf6', stroke: '#fff', strokeWidth: 2 }}
            name="AI Forecast"
          />
        </LineChart>
      </ResponsiveContainer>
      <div className="mt-4 p-4 bg-purple-50 rounded-lg border border-purple-200">
        <div className="flex items-start gap-3">
          <span className="text-xl">💡</span>
          <div className="text-sm text-gray-700">
            <p className="font-semibold text-gray-900 mb-1">About this prediction:</p>
            <p className="text-gray-600">
              Generated by an LSTM neural network trained on historical price data. 
              The {prediction.trend.toLowerCase()} trend suggests {
                prediction.trend === 'Bullish' ? 'upward' : 
                prediction.trend === 'Bearish' ? 'downward' : 
                'stable'
              } movement over the next 7 days.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

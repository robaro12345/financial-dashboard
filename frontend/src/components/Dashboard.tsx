import React from 'react';
import { StockHeader } from './StockHeader';
import { TimeFilter } from './TimeFilter';
import { MetricsRow } from './MetricsRow';
import { PriceChart } from './PriceChart';
import { PredictionChart } from './PredictionChart';
import { useStockContext } from '../contexts/StockContext';

export const Dashboard: React.FC = () => {
  const { selectedSymbol } = useStockContext();

  return (
    <div className="flex-1 overflow-auto bg-gradient-to-br from-gray-50 via-blue-50 to-gray-100 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
        <StockHeader />
        
        {selectedSymbol ? (
          <>
            <div className="flex justify-center sm:justify-end">
              <TimeFilter />
            </div>

            <MetricsRow />

            <PriceChart />

            <PredictionChart />
          </>
        ) : (
          <div className="bg-white p-8 sm:p-12 lg:p-16 rounded-xl border-2 border-dashed border-gray-300 text-center">
            <div className="text-4xl sm:text-5xl lg:text-7xl mb-4">📊</div>
            <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-2">Welcome to Stock Dashboard</h3>
            <p className="text-sm sm:text-base lg:text-lg text-gray-600 mb-4 max-w-2xl mx-auto">
              Select a stock from the sidebar to view detailed analytics, charts, and predictions
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4 mt-6 max-w-md mx-auto">
              <div className="bg-blue-50 p-3 sm:p-4 rounded-lg flex-1">
                <div className="text-xl sm:text-2xl mb-2">📈</div>
                <p className="text-xs sm:text-sm text-gray-700 font-medium">Price Charts</p>
              </div>
              <div className="bg-green-50 p-3 sm:p-4 rounded-lg flex-1">
                <div className="text-xl sm:text-2xl mb-2">🤖</div>
                <p className="text-xs sm:text-sm text-gray-700 font-medium">AI Predictions</p>
              </div>
              <div className="bg-purple-50 p-3 sm:p-4 rounded-lg flex-1">
                <div className="text-xl sm:text-2xl mb-2">📊</div>
                <p className="text-xs sm:text-sm text-gray-700 font-medium">Key Metrics</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

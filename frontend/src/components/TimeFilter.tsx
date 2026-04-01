import React from 'react';
import { useStockContext } from '../contexts/StockContext';

export const TimeFilter: React.FC = () => {
  const { timeFilter, setTimeFilter } = useStockContext();

  const options = [
    { label: '30D', value: 30 },
    { label: '90D', value: 90 },
    { label: '1Y', value: 365 },
  ];

  return (
    <div className="flex gap-1 sm:gap-2 bg-gray-100 p-1 rounded-lg inline-flex">
      {options.map((option) => (
        <button
          key={option.value}
          onClick={() => setTimeFilter(option.value)}
          className={`px-3 sm:px-4 lg:px-6 py-1.5 sm:py-2 rounded-md font-medium text-sm sm:text-base transition-all ${
            timeFilter === option.value
              ? 'bg-blue-600 text-white shadow-md'
              : 'bg-transparent text-gray-700 hover:bg-gray-200'
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
};

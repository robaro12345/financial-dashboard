import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getCorrelationMatrix } from '../api/client';

const HeatmapPageComponent: React.FC = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['correlation'],
    queryFn: getCorrelationMatrix,
  });

  const [selectedCell, setSelectedCell] = useState<{row: number, col: number, value: number} | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterThreshold, setFilterThreshold] = useState<number>(0);
  const [showStats, setShowStats] = useState(false);

  // Function to get color based on correlation value
  const getCorrelationColor = (value: number): string => {
    const normalized = (value + 1) / 2;
    
    if (normalized < 0.2) return 'rgb(239, 68, 68)'; // Strong negative
    if (normalized < 0.4) return 'rgb(251, 146, 60)'; // Negative
    if (normalized < 0.6) return 'rgb(254, 243, 199)'; // Neutral
    if (normalized < 0.8) return 'rgb(134, 239, 172)'; // Positive
    return 'rgb(34, 197, 94)'; // Strong positive
  };

  const getTextColor = (value: number): string => {
    const normalized = (value + 1) / 2;
    return normalized < 0.4 || normalized > 0.7 ? '#ffffff' : '#1f2937';
  };

  const getCorrelationLabel = (value: number): string => {
    const abs = Math.abs(value);
    if (abs >= 0.9) return 'Very Strong';
    if (abs >= 0.7) return 'Strong';
    if (abs >= 0.5) return 'Moderate';
    if (abs >= 0.3) return 'Weak';
    return 'Very Weak';
  };

  // Calculate statistics
  const statistics = useMemo(() => {
    if (!data) return null;
    
    const allCorrelations: Array<{stock1: string, stock2: string, value: number}> = [];
    let sum = 0;
    let count = 0;
    
    for (let i = 0; i < data.matrix.length; i++) {
      for (let j = i + 1; j < data.matrix[i].length; j++) {
        const value = data.matrix[i][j];
        allCorrelations.push({
          stock1: data.symbols[i],
          stock2: data.symbols[j],
          value: value
        });
        sum += value;
        count++;
      }
    }
    
    const average = count > 0 ? sum / count : 0;
    const sorted = [...allCorrelations].sort((a, b) => b.value - a.value);
    const strongest = sorted.slice(0, 5);
    const weakest = sorted.slice(-5).reverse();
    
    return { average, strongest, weakest, allCorrelations };
  }, [data]);

  // Filter symbols based on search
  const filteredSymbols = useMemo(() => {
    if (!data || !searchTerm) return data?.symbols || [];
    return data.symbols.filter(s => 
      s.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [data, searchTerm]);

  // Export correlation data
  const exportData = () => {
    if (!data) return;
    
    const csv = [
      ['Stock 1', 'Stock 2', 'Correlation', 'Strength'].join(','),
      ...statistics!.allCorrelations.map(c => 
        [c.stock1, c.stock2, c.value.toFixed(4), getCorrelationLabel(c.value)].join(',')
      )
    ].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `correlation-matrix-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col w-full h-full min-h-screen">
      <div className="flex-1 overflow-auto bg-gradient-to-br from-gray-50 to-gray-100 p-4 sm:p-6 lg:p-8 pb-12">
        <div className="max-w-7xl mx-auto pb-8">
          {/* Header */}
          <div className="mb-6 sm:mb-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-4">
              <div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                  📊 Correlation Matrix
                </h1>
                <p className="text-sm sm:text-base text-gray-600">
                  Discover how different stocks move together - identify trends, diversification opportunities, and market relationships
                </p>
              </div>
              {data && (
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setShowStats(!showStats)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-sm transition-colors shadow-md"
                  >
                    {showStats ? '📊 Hide Stats' : '📊 Show Stats'}
                  </button>
                  <button
                    onClick={exportData}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium text-sm transition-colors shadow-md"
                  >
                    💾 Export CSV
                  </button>
                </div>
              )}
            </div>
          </div>

          {isLoading ? (
            <div className="bg-white p-8 sm:p-12 lg:p-16 rounded-xl border border-gray-200 shadow-lg">
              <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-12 w-12 sm:h-16 sm:w-16 border-b-4 border-blue-600 mb-4"></div>
                <p className="text-gray-600 text-base sm:text-lg font-medium">Computing correlation matrix...</p>
                <p className="text-gray-500 text-xs sm:text-sm mt-2">Analyzing relationships between stocks...</p>
              </div>
            </div>
          ) : error ? (
            <div className="bg-white p-8 sm:p-12 lg:p-16 rounded-xl border border-red-200 shadow-lg text-center">
              <div className="text-4xl sm:text-5xl lg:text-6xl mb-4">⚠️</div>
              <p className="text-red-600 text-base sm:text-lg font-semibold">Error loading correlation matrix</p>
              <p className="text-gray-600 text-xs sm:text-sm mt-2">Unable to calculate correlations. Please try again later.</p>
            </div>
          ) : data ? (
            <>
              {/* Statistics Panel */}
              {showStats && statistics && (
                <div className="bg-gradient-to-br from-white to-blue-50 p-4 sm:p-6 rounded-xl border-2 border-blue-200 shadow-xl mb-6 animate-slideDown">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-3xl">📈</span>
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Correlation Statistics</h2>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-white p-4 rounded-lg shadow-md border border-gray-200">
                      <div className="text-sm text-gray-600 mb-1">Average Correlation</div>
                      <div className="text-3xl font-bold text-blue-600">{statistics.average.toFixed(3)}</div>
                      <div className="text-xs text-gray-500 mt-1">Across all stock pairs</div>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow-md border border-gray-200">
                      <div className="text-sm text-gray-600 mb-1">Total Pairs Analyzed</div>
                      <div className="text-3xl font-bold text-purple-600">{statistics.allCorrelations.length}</div>
                      <div className="text-xs text-gray-500 mt-1">Unique stock combinations</div>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow-md border border-gray-200">
                      <div className="text-sm text-gray-600 mb-1">Stocks in Matrix</div>
                      <div className="text-3xl font-bold text-green-600">{data.symbols.length}</div>
                      <div className="text-xs text-gray-500 mt-1">Different companies</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {/* Strongest Correlations */}
                    <div className="bg-white p-4 rounded-lg shadow-md border border-green-200">
                      <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                        <span className="text-xl">🔥</span>
                        Top 5 Strongest Correlations
                      </h3>
                      <div className="space-y-2">
                        {statistics.strongest.map((pair, idx) => (
                          <div key={idx} className="flex items-center justify-between p-2 bg-green-50 rounded border border-green-200">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-gray-700 text-sm">{idx + 1}.</span>
                              <span className="font-semibold text-gray-900 text-sm">{pair.stock1} ↔ {pair.stock2}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-green-600">{pair.value.toFixed(3)}</span>
                              <span className="text-xs text-gray-600">({getCorrelationLabel(pair.value)})</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Weakest/Negative Correlations */}
                    <div className="bg-white p-4 rounded-lg shadow-md border border-red-200">
                      <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                        <span className="text-xl">❄️</span>
                        Top 5 Weakest/Most Negative
                      </h3>
                      <div className="space-y-2">
                        {statistics.weakest.map((pair, idx) => (
                          <div key={idx} className="flex items-center justify-between p-2 bg-red-50 rounded border border-red-200">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-gray-700 text-sm">{idx + 1}.</span>
                              <span className="font-semibold text-gray-900 text-sm">{pair.stock1} ↔ {pair.stock2}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-red-600">{pair.value.toFixed(3)}</span>
                              <span className="text-xs text-gray-600">({getCorrelationLabel(pair.value)})</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Search and Filter Controls */}
              <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-lg mb-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">🔍 Search Stocks</label>
                    <input
                      type="text"
                      placeholder="Type symbol (e.g., TCS, INFY)..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                    />
                    {searchTerm && (
                      <div className="mt-2 text-sm text-gray-600">
                        Found: <span className="font-bold text-blue-600">{filteredSymbols.length}</span> stocks
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      🎚️ Correlation Threshold: <span className="text-blue-600">{filterThreshold.toFixed(2)}</span>
                    </label>
                    <input
                      type="range"
                      min="-1"
                      max="1"
                      step="0.1"
                      value={filterThreshold}
                      onChange={(e) => setFilterThreshold(parseFloat(e.target.value))}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                    <div className="flex justify-between text-xs text-gray-600 mt-1">
                      <span>-1.0 (Negative)</span>
                      <span>0.0 (Neutral)</span>
                      <span>+1.0 (Positive)</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white p-4 sm:p-6 rounded-xl border border-gray-200 shadow-lg">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">🔥</span>
                    <div>
                      <h3 className="text-lg sm:text-xl font-bold text-gray-900">Interactive Heatmap</h3>
                      <p className="text-xs sm:text-sm text-gray-600">Click any cell for detailed analysis</p>
                    </div>
                  </div>
                </div>

                {/* Correlation Scale Legend */}
                <div className="mb-6 p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg border border-gray-200">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <span className="text-sm font-bold text-gray-700">Correlation Strength:</span>
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-semibold text-gray-600">Strong Negative</span>
                      <div className="flex gap-1">
                        <div className="w-10 h-8 rounded shadow-sm" style={{ backgroundColor: 'rgb(239, 68, 68)' }}></div>
                        <div className="w-10 h-8 rounded shadow-sm" style={{ backgroundColor: 'rgb(251, 146, 60)' }}></div>
                        <div className="w-10 h-8 rounded shadow-sm" style={{ backgroundColor: 'rgb(254, 243, 199)' }}></div>
                        <div className="w-10 h-8 rounded shadow-sm" style={{ backgroundColor: 'rgb(134, 239, 172)' }}></div>
                        <div className="w-10 h-8 rounded shadow-sm" style={{ backgroundColor: 'rgb(34, 197, 94)' }}></div>
                      </div>
                      <span className="text-xs font-semibold text-gray-600">Strong Positive</span>
                    </div>
                  </div>
                </div>

                {/* Heatmap Grid - Desktop & Large Tablets */}
                <div className="hidden md:block w-full h-full">
                  {searchTerm && filteredSymbols.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                      <div className="text-4xl mb-3">🔍</div>
                      <p className="font-semibold">No stocks found matching "{searchTerm}"</p>
                    </div>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center overflow-hidden">
                      <div className="max-w-full max-h-full overflow-auto">
                        <table className="border-collapse shadow-lg mx-auto">
                          <thead>
                            <tr>
                              <th className="p-1 md:p-2 border-2 border-gray-400 bg-gradient-to-br from-gray-100 to-gray-200 text-xs font-bold w-8 md:w-12 lg:w-16 h-8 md:h-12 lg:h-16"></th>
                              {(searchTerm ? filteredSymbols : data.symbols).map((symbol) => (
                                <th
                                  key={symbol}
                                  className="p-1 md:p-2 border-2 border-gray-300 bg-gradient-to-br from-blue-50 to-blue-100 text-xs font-bold text-gray-900 w-8 md:w-12 lg:w-16 h-8 md:h-12 lg:h-16"
                                >
                                  <div className="transform -rotate-45 whitespace-nowrap text-[8px] md:text-[10px] lg:text-xs">{symbol}</div>
                                </th>
                              ))}
                          </tr>
                        </thead>
                        <tbody>
                            {(searchTerm ? filteredSymbols : data.symbols).map((symbol1) => {
                              const rowIndex = data.symbols.indexOf(symbol1);
                              return (
                                <tr key={rowIndex}>
                                  <td className="p-1 md:p-2 border-2 border-gray-400 bg-gradient-to-br from-gray-100 to-gray-200 font-bold text-gray-900 text-right text-[8px] md:text-[10px] lg:text-xs w-8 md:w-12 lg:w-16 h-8 md:h-12 lg:h-16">
                                    {symbol1}
                                  </td>
                                  {(searchTerm ? filteredSymbols : data.symbols).map((symbol2) => {
                                    const colIndex = data.symbols.indexOf(symbol2);
                                    const value = data.matrix[rowIndex][colIndex];
                                    const meetsThreshold = Math.abs(value) >= Math.abs(filterThreshold);
                                    
                                    return (
                                      <td
                                        key={colIndex}
                                        className={`p-0.5 md:p-1 border-2 border-gray-300 text-center font-bold transition-all cursor-pointer relative group w-8 md:w-12 lg:w-16 h-8 md:h-12 lg:h-16 ${
                                          meetsThreshold ? 'hover:scale-105 hover:z-50' : 'opacity-30'
                                        }`}
                                        style={{
                                          backgroundColor: getCorrelationColor(value),
                                          color: getTextColor(value)
                                        }}
                                        onClick={() => meetsThreshold && setSelectedCell({ row: rowIndex, col: colIndex, value })}
                                      >
                                        <div className="flex flex-col items-center justify-center h-full">
                                          <div className="font-bold text-[8px] md:text-xs lg:text-sm leading-none">{value.toFixed(2)}</div>
                                          <div className="text-[6px] md:text-[8px] lg:text-[10px] opacity-80 mt-0.5 leading-none hidden lg:block">{getCorrelationLabel(value).slice(0, 4)}</div>
                                        </div>
                                        {/* Enhanced Tooltip */}
                                        {meetsThreshold && (
                                          <div className="absolute hidden group-hover:block bg-gray-900 text-white text-xs rounded-lg px-3 py-2 -top-20 left-1/2 transform -translate-x-1/2 whitespace-nowrap z-[100] shadow-xl pointer-events-none">
                                            <div className="font-bold mb-1">{symbol1} ↔ {symbol2}</div>
                                            <div>Correlation: <span className="font-bold">{value.toFixed(3)}</span></div>
                                            <div className="text-yellow-300">{getCorrelationLabel(value)} {value >= 0 ? 'Positive' : 'Negative'}</div>
                                            <div className="absolute w-2 h-2 bg-gray-900 transform rotate-45 -bottom-1 left-1/2 -translate-x-1/2"></div>
                                          </div>
                                        )}
                                      </td>
                                    );
                                  })}
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>

                {/* Simplified View - Mobile & Small Tablets */}
                <div className="md:hidden space-y-4">
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800">
                    📱 <strong>Mobile View:</strong> Showing simplified correlations for better readability.
                  </div>
                  {data.symbols.slice(0, 8).map((symbol1, idx1) => (
                    <div key={symbol1} className="border-2 border-gray-300 rounded-lg p-3 sm:p-4 bg-gradient-to-br from-white to-gray-50 shadow-md">
                      <h4 className="font-bold text-sm sm:text-base text-gray-900 mb-3 flex items-center gap-2">
                        <span className="text-lg sm:text-xl">📈</span>
                        {symbol1}
                      </h4>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {data.symbols.slice(0, 6).map((symbol2, idx2) => {
                          if (idx1 === idx2) return null;
                          const value = data.matrix[idx1][idx2];
                          return (
                            <div
                              key={symbol2}
                              className="p-2 sm:p-3 rounded-lg text-center text-xs font-bold shadow-sm border-2 cursor-pointer hover:scale-105 transition-transform"
                              style={{
                                backgroundColor: getCorrelationColor(value),
                                color: getTextColor(value),
                                borderColor: 'rgba(0,0,0,0.1)'
                              }}
                              onClick={() => setSelectedCell({ row: idx1, col: idx2, value })}
                            >
                              <div className="font-bold text-xs sm:text-sm">{symbol2}</div>
                              <div className="text-sm sm:text-lg font-bold">{value.toFixed(2)}</div>
                              <div className="text-[8px] sm:text-[10px] opacity-90">{getCorrelationLabel(value).slice(0, 5)}</div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Selected Cell Details - Enhanced */}
                {selectedCell && (
                  <div className="mt-6 p-4 sm:p-6 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border-2 border-purple-300 shadow-xl animate-fadeIn">
                    <div className="flex items-start gap-3">
                      <span className="text-3xl">🎯</span>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-bold text-gray-900 text-lg">Selected Pair Analysis</h4>
                          <button 
                            onClick={() => setSelectedCell(null)}
                            className="text-gray-500 hover:text-gray-700 transition-colors"
                          >
                            ✕
                          </button>
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                          <div className="bg-white p-4 rounded-lg shadow-md border-2 border-purple-200">
                            <div className="text-xs text-gray-600 mb-1 font-semibold">Stock Pair</div>
                            <div className="font-bold text-gray-900 text-lg">{data.symbols[selectedCell.row]} ↔ {data.symbols[selectedCell.col]}</div>
                          </div>
                          <div className="bg-white p-4 rounded-lg shadow-md border-2 border-purple-200">
                            <div className="text-xs text-gray-600 mb-1 font-semibold">Correlation</div>
                            <div className="font-bold text-2xl" style={{ color: selectedCell.value >= 0 ? '#22c55e' : '#ef4444' }}>
                              {selectedCell.value.toFixed(3)}
                            </div>
                          </div>
                          <div className="bg-white p-4 rounded-lg shadow-md border-2 border-purple-200">
                            <div className="text-xs text-gray-600 mb-1 font-semibold">Strength</div>
                            <div className="font-bold text-gray-900">{getCorrelationLabel(selectedCell.value)} {selectedCell.value >= 0 ? '📈' : '📉'}</div>
                          </div>
                        </div>

                        {/* Investment Insight */}
                        <div className="bg-white p-4 rounded-lg shadow-md border-2 border-purple-200">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-xl">💡</span>
                            <h5 className="font-bold text-gray-900">Investment Insight</h5>
                          </div>
                          <p className="text-sm text-gray-700 leading-relaxed">
                            {selectedCell.value > 0.7 ? 
                              '✅ Strong positive correlation detected! These stocks tend to move together in the same direction. This indicates high similarity in market behavior. For portfolio diversification, consider pairing with stocks showing lower correlation.' :
                            selectedCell.value > 0.3 ?
                              '📊 Moderate positive correlation. These stocks show some tendency to move together, but not always. This provides partial diversification benefits while maintaining some directional alignment.' :
                            selectedCell.value > -0.3 ?
                              '⚖️ Low correlation - these stocks move relatively independently of each other. This is excellent for portfolio diversification as movements in one stock won\'t significantly impact the other. This pair is ideal for risk reduction.' :
                            selectedCell.value > -0.7 ?
                              '📉 Moderate negative correlation. These stocks tend to move in opposite directions. This relationship can provide natural hedging in your portfolio, as losses in one may be offset by gains in the other.' :
                              '⚠️ Strong negative correlation! These stocks consistently move in opposite directions. This is a powerful hedging relationship - combining both can significantly reduce portfolio volatility. Consider strategic allocation for risk management.'}
                          </p>
                          
                          {/* Trading Strategy */}
                          <div className="mt-3 p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded border border-purple-200">
                            <div className="font-semibold text-gray-900 text-sm mb-1">💼 Trading Strategy:</div>
                            <p className="text-xs text-gray-700">
                              {Math.abs(selectedCell.value) > 0.7 ? 
                                'High correlation strength suggests strong relationship. Monitor market conditions affecting both stocks. Consider sector-wide trends.' :
                                'Moderate to weak correlation provides diversification. These stocks are influenced by different factors, reducing overall portfolio risk.'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default HeatmapPageComponent;

// Add animations to index.css or tailwind config
// @keyframes fadeIn {
//   from { opacity: 0; transform: translateY(10px); }
//   to { opacity: 1; transform: translateY(0); }
// }
// @keyframes slideDown {
//   from { opacity: 0; transform: translateY(-20px); }
//   to { opacity: 1; transform: translateY(0); }
// }
// .animate-fadeIn { animation: fadeIn 0.3s ease-out; }
// .animate-slideDown { animation: slideDown 0.4s ease-out; }

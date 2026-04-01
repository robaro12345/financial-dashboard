import React, { createContext, useContext, useState, type ReactNode, useMemo } from 'react';

interface StockContextType {
  selectedSymbol: string | null;
  setSelectedSymbol: (symbol: string | null) => void;
  timeFilter: number;
  setTimeFilter: (days: number) => void;
  sectorFilter: string | null;
  setSectorFilter: (sector: string | null) => void;
}

const StockContext = createContext<StockContextType | undefined>(undefined);

export const StockProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [selectedSymbol, setSelectedSymbol] = useState<string | null>(null);
  const [timeFilter, setTimeFilter] = useState<number>(30);
  const [sectorFilter, setSectorFilter] = useState<string | null>(null);

  const value = useMemo(
    () => ({
      selectedSymbol,
      setSelectedSymbol,
      timeFilter,
      setTimeFilter,
      sectorFilter,
      setSectorFilter,
    }),
    [selectedSymbol, timeFilter, sectorFilter]
  );

  return (
    <StockContext.Provider value={value}>
      {children}
    </StockContext.Provider>
  );
};

export const useStockContext = () => {
  const context = useContext(StockContext);
  if (!context) {
    throw new Error('useStockContext must be used within StockProvider');
  }
  return context;
};

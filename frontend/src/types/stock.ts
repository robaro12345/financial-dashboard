export interface Company {
  symbol: string;
  name: string;
  sector: string;
}

export interface StockData {
  symbol: string;
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  daily_return: number;
  ma_7: number;
  ma_20: number;
  volatility: number;
  volume_spike: boolean;
}

export interface Summary {
  symbol: string;
  week_52_high: number;
  week_52_low: number;
  avg_close: number;
  volatility: number;
  sentiment_score: number;
  sentiment_label: string;
}

export interface Prediction {
  symbol: string;
  forecast: number[];
  trend: string;
  generated_at: string;
}

export interface GainerLoser {
  symbol: string;
  name: string;
  sector: string;
  current_price: number;
  daily_return: number;
}

export interface GainersLosersResponse {
  gainers: GainerLoser[];
  losers: GainerLoser[];
}

export interface CorrelationData {
  symbols: string[];
  matrix: number[][];
}

export interface CompareData {
  symbol1_data: { date: string; normalized_price: number }[];
  symbol2_data: { date: string; normalized_price: number }[];
}

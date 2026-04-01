import type {
  Company,
  StockData,
  Summary,
  Prediction,
  GainersLosersResponse,
  CorrelationData,
  CompareData,
} from '../types/stock';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

// Helper to get API key from localStorage
function getApiKeyHeaders(): HeadersInit {
  const apiKey = localStorage.getItem('alphaVantageApiKey');
  if (apiKey) {
    return {
      'X-API-Key': apiKey,
    };
  }
  return {};
}

async function fetchAPI<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const headers = {
    'Content-Type': 'application/json',
    ...getApiKeyHeaders(),
    ...options?.headers,
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: response.statusText }));
    throw new Error(errorData.detail || `API Error: ${response.statusText}`);
  }
  return response.json();
}

export async function getCompanies(): Promise<Company[]> {
  return fetchAPI<Company[]>('/companies');
}

export async function addCompany(company: { symbol: string; name: string; sector: string }): Promise<Company> {
  return fetchAPI<Company>('/companies', {
    method: 'POST',
    body: JSON.stringify(company),
  });
}

export async function getStockData(symbol: string, days: number = 30): Promise<StockData[]> {
  return fetchAPI<StockData[]>(`/data/${symbol}?days=${days}`);
}

export async function getStockSummary(symbol: string): Promise<Summary> {
  return fetchAPI<Summary>(`/summary/${symbol}`);
}

export async function compareStocks(symbol1: string, symbol2: string): Promise<CompareData> {
  return fetchAPI<CompareData>(`/compare?symbol1=${symbol1}&symbol2=${symbol2}`);
}

export async function getGainersLosers(): Promise<GainersLosersResponse> {
  return fetchAPI<GainersLosersResponse>('/gainers-losers');
}

export async function getCorrelationMatrix(): Promise<CorrelationData> {
  return fetchAPI<CorrelationData>('/correlation');
}

export async function getPrediction(symbol: string): Promise<Prediction> {
  return fetchAPI<Prediction>(`/predict/${symbol}`);
}

export async function refreshData(): Promise<void> {
  await fetchAPI<void>('/refresh', {
    method: 'POST',
  });
}

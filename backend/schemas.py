from pydantic import BaseModel, Field
from datetime import date, datetime
from typing import List, Optional

# Company schemas
class CompanyCreate(BaseModel):
    symbol: str = Field(..., min_length=1, max_length=20, description="Stock symbol (e.g., TCS.BSE or TCS)")
    name: str = Field(..., min_length=1, max_length=200, description="Company name")
    sector: str = Field(..., min_length=1, max_length=100, description="Industry sector")
    
    class Config:
        json_schema_extra = {
            "example": {
                "symbol": "AAPL",
                "name": "Apple Inc.",
                "sector": "Technology"
            }
        }

class CompanyResponse(BaseModel):
    symbol: str
    name: str
    sector: str
    
    class Config:
        from_attributes = True

# Stock data schemas
class StockDataResponse(BaseModel):
    date: date
    open: float
    high: float
    low: float
    close: float
    volume: int
    daily_return: Optional[float] = None
    ma_7: Optional[float] = None
    ma_20: Optional[float] = None
    volatility: Optional[float] = None
    volume_spike: bool = False
    
    class Config:
        from_attributes = True

class StockDataListResponse(BaseModel):
    symbol: str
    data: List[StockDataResponse]

# Summary schemas
class SummaryResponse(BaseModel):
    symbol: str
    name: str
    sector: str
    week_52_high: float
    week_52_low: float
    avg_close: float
    current_price: float
    sentiment_score: float
    sentiment_label: str
    volatility: float

# Compare schemas
class CompareDataPoint(BaseModel):
    date: date
    normalized_price: float

class CompareResponse(BaseModel):
    symbol1: str
    symbol2: str
    symbol1_data: List[CompareDataPoint]
    symbol2_data: List[CompareDataPoint]

# Gainers/Losers schemas
class GainerLoserItem(BaseModel):
    symbol: str
    name: str
    sector: str
    current_price: float
    daily_return: float
    
    class Config:
        from_attributes = True

class GainersLosersResponse(BaseModel):
    gainers: List[GainerLoserItem]
    losers: List[GainerLoserItem]

# Correlation schemas
class CorrelationResponse(BaseModel):
    symbols: List[str]
    matrix: List[List[float]]

# Prediction schemas
class PredictionResponse(BaseModel):
    symbol: str
    forecast: List[float]
    trend: str
    generated_at: datetime
    
    class Config:
        from_attributes = True

# Generic response
class MessageResponse(BaseModel):
    message: str
    details: Optional[str] = None

# Error response
class ErrorResponse(BaseModel):
    error: str
    detail: Optional[str] = None
    status_code: int

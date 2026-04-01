from fastapi import APIRouter, Depends, HTTPException, Query, Header
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timedelta
from fastapi_cache.decorator import cache

from backend.database import get_db
from backend.models import Company, StockPrice
from backend.schemas import (
    CompanyResponse,
    CompanyCreate,
    StockDataResponse,
    SummaryResponse,
    MessageResponse,
    ErrorResponse
)
from backend.cache import CACHE_DEFAULT, clear_all_cache
from backend.metrics import get_summary_metrics

router = APIRouter(prefix="/api", tags=["stocks"])

@router.get("/companies", response_model=List[CompanyResponse])
@cache(expire=CACHE_DEFAULT)
async def get_companies(db: Session = Depends(get_db)):
    """Get all tracked companies"""
    companies = db.query(Company).all()
    return companies

@router.post("/companies", response_model=CompanyResponse, status_code=201)
async def add_company(
    company_data: CompanyCreate,
    db: Session = Depends(get_db)
):
    """Add a new company to track"""
    # Check if company already exists
    existing_company = db.query(Company).filter(
        Company.symbol == company_data.symbol.upper()
    ).first()
    
    if existing_company:
        raise HTTPException(
            status_code=409,
            detail=f"Company with symbol {company_data.symbol} already exists"
        )
    
    # Create new company
    new_company = Company(
        symbol=company_data.symbol.upper(),
        name=company_data.name.strip(),
        sector=company_data.sector.strip()
    )
    
    try:
        db.add(new_company)
        db.commit()
        db.refresh(new_company)
        
        # Clear cache to ensure new company appears in listings
        await clear_all_cache()
        
        return new_company
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Error adding company: {str(e)}"
        )

@router.get("/data/{symbol}", response_model=List[StockDataResponse])
@cache(expire=CACHE_DEFAULT)
async def get_stock_data(
    symbol: str,
    days: int = Query(30, ge=1, le=365),
    db: Session = Depends(get_db)
):
    """Get stock data for a symbol for the last N days"""
    # Check if company exists
    company = db.query(Company).filter(Company.symbol == symbol).first()
    if not company:
        raise HTTPException(status_code=404, detail=f"Company {symbol} not found")
    
    # Calculate date range
    end_date = datetime.now().date()
    start_date = end_date - timedelta(days=days)
    
    # Fetch stock data
    stock_data = db.query(StockPrice).filter(
        StockPrice.symbol == symbol,
        StockPrice.date >= start_date,
        StockPrice.date <= end_date
    ).order_by(StockPrice.date.desc()).all()
    
    if not stock_data:
        raise HTTPException(status_code=404, detail=f"No data found for {symbol}")
    
    return stock_data

@router.get("/summary/{symbol}", response_model=SummaryResponse)
@cache(expire=CACHE_DEFAULT)
async def get_stock_summary(symbol: str, db: Session = Depends(get_db)):
    """Get summary metrics for a symbol"""
    # Check if company exists
    company = db.query(Company).filter(Company.symbol == symbol).first()
    if not company:
        raise HTTPException(status_code=404, detail=f"Company {symbol} not found")
    
    # Get summary metrics
    summary = get_summary_metrics(symbol, db)
    if not summary:
        raise HTTPException(status_code=404, detail=f"No data found for {symbol}")
    
    # Get current price (latest close)
    latest_price = db.query(StockPrice).filter(
        StockPrice.symbol == symbol
    ).order_by(StockPrice.date.desc()).first()
    
    current_price = latest_price.close if latest_price else 0
    
    return SummaryResponse(
        symbol=symbol,
        name=company.name,
        sector=company.sector,
        week_52_high=summary['high_52w'],
        week_52_low=summary['low_52w'],
        avg_close=summary['avg_close'],
        current_price=current_price,
        sentiment_score=summary['sentiment_score'],
        sentiment_label=summary['sentiment_label'],
        volatility=summary['volatility']
    )

@router.post("/refresh", response_model=MessageResponse)
async def refresh_data(
    db: Session = Depends(get_db),
    x_api_key: Optional[str] = Header(None, alias="X-API-Key")
):
    """Manually trigger data refresh from Alpha Vantage
    
    Optionally provide X-API-Key header to use a custom Alpha Vantage API key.
    If not provided, uses the API key from environment variables.
    """
    try:
        from backend.data_ingestion import ingest_all_stocks
        from backend.metrics import compute_metrics_for_all_symbols
        
        # Clear cache
        await clear_all_cache()
        
        # Ingest data with optional custom API key
        ingest_all_stocks(force_refresh=True, api_key=x_api_key)
        
        # Compute metrics
        compute_metrics_for_all_symbols()
        
        api_key_source = "custom API key" if x_api_key else "environment API key"
        return MessageResponse(
            message="Data refresh completed successfully",
            details=f"All stock data has been updated using {api_key_source} and cache cleared"
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error during refresh: {str(e)}")

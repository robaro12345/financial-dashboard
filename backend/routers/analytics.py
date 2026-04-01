from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
from datetime import datetime, timedelta
from fastapi_cache.decorator import cache
import pandas as pd

from backend.database import get_db
from backend.models import Company, StockPrice
from backend.schemas import (
    GainersLosersResponse,
    GainerLoserItem,
    CorrelationResponse,
    CompareResponse,
    CompareDataPoint
)
from backend.cache import CACHE_DEFAULT

router = APIRouter(prefix="/api", tags=["analytics"])

@router.get("/gainers-losers", response_model=GainersLosersResponse)
@cache(expire=CACHE_DEFAULT)
async def get_gainers_losers(db: Session = Depends(get_db)):
    """Get top 5 gainers and losers by daily return"""
    # Get latest date
    latest_date_query = db.query(func.max(StockPrice.date)).scalar()
    if not latest_date_query:
        raise HTTPException(status_code=404, detail="No data available")
    
    # Get latest prices for all symbols
    latest_prices = db.query(StockPrice).filter(
        StockPrice.date == latest_date_query
    ).all()
    
    # Sort by daily return
    sorted_by_return = sorted(
        [sp for sp in latest_prices if sp.daily_return is not None],
        key=lambda x: x.daily_return,
        reverse=True
    )
    
    # Get top 5 gainers and losers
    gainers_data = sorted_by_return[:5]
    losers_data = sorted_by_return[-5:]
    
    # Fetch company details
    gainers = []
    for sp in gainers_data:
        company = db.query(Company).filter(Company.symbol == sp.symbol).first()
        if company:
            gainers.append(GainerLoserItem(
                symbol=sp.symbol,
                name=company.name,
                sector=company.sector,
                current_price=sp.close,
                daily_return=sp.daily_return
            ))
    
    losers = []
    for sp in losers_data:
        company = db.query(Company).filter(Company.symbol == sp.symbol).first()
        if company:
            losers.append(GainerLoserItem(
                symbol=sp.symbol,
                name=company.name,
                sector=company.sector,
                current_price=sp.close,
                daily_return=sp.daily_return
            ))
    
    return GainersLosersResponse(gainers=gainers, losers=losers)

@router.get("/correlation", response_model=CorrelationResponse)
@cache(expire=CACHE_DEFAULT)
async def get_correlation_matrix(
    days: int = Query(90, ge=30, le=365),
    db: Session = Depends(get_db)
):
    """Get Pearson correlation matrix for all stocks"""
    # Get all companies
    companies = db.query(Company).all()
    symbols = [c.symbol for c in companies]
    
    # Calculate date range
    end_date = datetime.now().date()
    start_date = end_date - timedelta(days=days)
    
    # Fetch data for all symbols
    data_dict = {}
    for symbol in symbols:
        stock_data = db.query(StockPrice).filter(
            StockPrice.symbol == symbol,
            StockPrice.date >= start_date,
            StockPrice.date <= end_date
        ).order_by(StockPrice.date).all()
        
        if stock_data:
            df = pd.DataFrame([
                {'date': sp.date, 'close': sp.close}
                for sp in stock_data
            ])
            df.set_index('date', inplace=True)
            data_dict[symbol] = df['close']
    
    # Create DataFrame with all stocks
    df_all = pd.DataFrame(data_dict)
    
    # Calculate correlation matrix
    correlation_matrix = df_all.corr()
    
    # Convert to list format
    matrix_list = correlation_matrix.values.tolist()
    
    return CorrelationResponse(
        symbols=list(correlation_matrix.columns),
        matrix=matrix_list
    )

@router.get("/compare", response_model=CompareResponse)
@cache(expire=CACHE_DEFAULT)
async def compare_stocks(
    symbol1: str = Query(..., description="First stock symbol"),
    symbol2: str = Query(..., description="Second stock symbol"),
    days: int = Query(90, ge=30, le=365),
    db: Session = Depends(get_db)
):
    """Compare two stocks with normalized prices (both start at 100)"""
    # Check if both companies exist
    company1 = db.query(Company).filter(Company.symbol == symbol1).first()
    company2 = db.query(Company).filter(Company.symbol == symbol2).first()
    
    if not company1:
        raise HTTPException(status_code=404, detail=f"Company {symbol1} not found")
    if not company2:
        raise HTTPException(status_code=404, detail=f"Company {symbol2} not found")
    
    # Calculate date range
    end_date = datetime.now().date()
    start_date = end_date - timedelta(days=days)
    
    # Fetch data for both symbols
    data1 = db.query(StockPrice).filter(
        StockPrice.symbol == symbol1,
        StockPrice.date >= start_date,
        StockPrice.date <= end_date
    ).order_by(StockPrice.date).all()
    
    data2 = db.query(StockPrice).filter(
        StockPrice.symbol == symbol2,
        StockPrice.date >= start_date,
        StockPrice.date <= end_date
    ).order_by(StockPrice.date).all()
    
    if not data1 or not data2:
        raise HTTPException(status_code=404, detail="Insufficient data for comparison")
    
    # Normalize to 100 at start
    base_price1 = data1[0].close
    base_price2 = data2[0].close
    
    normalized_data1 = [
        CompareDataPoint(
            date=sp.date,
            normalized_price=(sp.close / base_price1) * 100
        )
        for sp in data1
    ]
    
    normalized_data2 = [
        CompareDataPoint(
            date=sp.date,
            normalized_price=(sp.close / base_price2) * 100
        )
        for sp in data2
    ]
    
    return CompareResponse(
        symbol1=symbol1,
        symbol2=symbol2,
        symbol1_data=normalized_data1,
        symbol2_data=normalized_data2
    )

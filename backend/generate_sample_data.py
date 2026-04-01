"""
Generate sample stock data for testing without Alpha Vantage API
"""

import sys
import os
import pandas as pd
import numpy as np
from datetime import datetime, timedelta

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.database import Base, engine, SessionLocal
from backend.models import Company, StockPrice
from backend.metrics import compute_metrics_for_all_symbols

TRACKED_STOCKS = [
    {"symbol": "TCS", "name": "Tata Consultancy Services", "sector": "IT", "base_price": 3500},
    {"symbol": "INFY", "name": "Infosys", "sector": "IT", "base_price": 1450},
    {"symbol": "WIPRO", "name": "Wipro", "sector": "IT", "base_price": 400},
    {"symbol": "HDFCBANK", "name": "HDFC Bank", "sector": "Banking", "base_price": 1650},
    {"symbol": "ICICIBANK", "name": "ICICI Bank", "sector": "Banking", "base_price": 950},
    {"symbol": "SBIN", "name": "State Bank of India", "sector": "Banking", "base_price": 580},
    {"symbol": "RELIANCE", "name": "Reliance Industries", "sector": "Energy", "base_price": 2450},
    {"symbol": "ONGC", "name": "Oil and Natural Gas Corporation", "sector": "Energy", "base_price": 180},
    {"symbol": "HINDUNILVR", "name": "Hindustan Unilever", "sector": "FMCG", "base_price": 2350},
    {"symbol": "ITC", "name": "ITC Limited", "sector": "FMCG", "base_price": 420},
    {"symbol": "TATAMOTORS", "name": "Tata Motors", "sector": "Auto", "base_price": 650},
    {"symbol": "MARUTI", "name": "Maruti Suzuki", "sector": "Auto", "base_price": 10500},
    {"symbol": "SUNPHARMA", "name": "Sun Pharmaceutical", "sector": "Pharma", "base_price": 1150},
    {"symbol": "DRREDDY", "name": "Dr. Reddy's Laboratories", "sector": "Pharma", "base_price": 5200},
    {"symbol": "BHARTIARTL", "name": "Bharti Airtel", "sector": "Telecom", "base_price": 850},
]

def generate_sample_data(symbol: str, base_price: float, days: int = 365) -> pd.DataFrame:
    """Generate realistic sample stock data"""
    np.random.seed(hash(symbol) % 2**32)  # Consistent data for same symbol
    
    dates = []
    data = []
    
    end_date = datetime.now().date()
    current_price = base_price
    
    for i in range(days):
        date = end_date - timedelta(days=days - i - 1)
        
        # Skip weekends
        if date.weekday() >= 5:
            continue
        
        # Generate realistic price movement
        daily_change = np.random.normal(0, 0.02)  # 2% daily volatility
        current_price *= (1 + daily_change)
        
        # Generate OHLC
        open_price = current_price * (1 + np.random.uniform(-0.01, 0.01))
        high_price = max(open_price, current_price) * (1 + abs(np.random.uniform(0, 0.02)))
        low_price = min(open_price, current_price) * (1 - abs(np.random.uniform(0, 0.02)))
        close_price = current_price
        
        # Generate volume (with some randomness)
        base_volume = 1000000 + np.random.randint(-500000, 500000)
        volume = max(100000, base_volume)
        
        data.append({
            'date': date,
            'open': round(open_price, 2),
            'high': round(high_price, 2),
            'low': round(low_price, 2),
            'close': round(close_price, 2),
            'volume': volume,
            'symbol': symbol
        })
    
    return pd.DataFrame(data)

def seed_companies(db):
    """Seed companies table"""
    for stock in TRACKED_STOCKS:
        existing = db.query(Company).filter(Company.symbol == stock['symbol']).first()
        if not existing:
            company = Company(
                symbol=stock['symbol'],
                name=stock['name'],
                sector=stock['sector']
            )
            db.add(company)
    db.commit()

def store_sample_data(df: pd.DataFrame, db: Session):
    """Store sample data in database"""
    if df is None or df.empty:
        return
    
    symbol = df['symbol'].iloc[0]
    
    # Remove existing data
    db.query(StockPrice).filter(StockPrice.symbol == symbol).delete()
    
    # Insert new data
    for _, row in df.iterrows():
        stock_price = StockPrice(
            symbol=symbol,
            date=row['date'],
            open=float(row['open']),
            high=float(row['high']),
            low=float(row['low']),
            close=float(row['close']),
            volume=int(row['volume'])
        )
        db.add(stock_price)
    
    db.commit()
    print(f"✓ Generated {len(df)} days of data for {symbol}")

def generate_all_sample_data():
    """Generate sample data for all stocks"""
    print("=" * 60)
    print("GENERATING SAMPLE STOCK DATA")
    print("=" * 60)
    print("\nThis creates realistic test data without using Alpha Vantage API")
    print("Perfect for development and testing!")
    print()
    
    # Create tables
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    try:
        # Seed companies
        seed_companies(db)
        
        # Generate data for each stock
        for stock in TRACKED_STOCKS:
            print(f"Generating data for {stock['symbol']}...")
            df = generate_sample_data(stock['symbol'], stock['base_price'], days=365)
            store_sample_data(df, db)
        
        print("\n" + "=" * 60)
        print("Computing metrics...")
        print("=" * 60)
        
        # Compute metrics
        compute_metrics_for_all_symbols()
        
        # Check final status
        total_records = db.query(StockPrice).count()
        print(f"\n✅ Sample data generation complete!")
        print(f"   Companies: {len(TRACKED_STOCKS)}")
        print(f"   Stock Prices: {total_records:,}")
        print(f"   Average per stock: {total_records // len(TRACKED_STOCKS):,} days")
        
        print("\n" + "=" * 60)
        print("READY TO USE!")
        print("=" * 60)
        print("\n1. Start backend: python -m uvicorn backend.main:app --reload")
        print("2. Start frontend: cd frontend && npm run dev")
        print("3. Open browser: http://localhost:5173")
        
    finally:
        db.close()

if __name__ == "__main__":
    generate_all_sample_data()

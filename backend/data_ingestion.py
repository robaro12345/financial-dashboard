import os
import pandas as pd
from alpha_vantage.timeseries import TimeSeries
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from backend.models import Company, StockPrice
from backend.database import engine, SessionLocal, Base
from dotenv import load_dotenv
import time

load_dotenv()

# 15 Indian stocks with sectors
TRACKED_STOCKS = [
    {"symbol": "TCS.BSE", "name": "Tata Consultancy Services", "sector": "IT"},
    {"symbol": "INFY.BSE", "name": "Infosys", "sector": "IT"},
    {"symbol": "WIPRO.BSE", "name": "Wipro", "sector": "IT"},
    {"symbol": "HDFCBANK.BSE", "name": "HDFC Bank", "sector": "Banking"},
    {"symbol": "ICICIBANK.BSE", "name": "ICICI Bank", "sector": "Banking"},
    {"symbol": "SBIN.BSE", "name": "State Bank of India", "sector": "Banking"},
    {"symbol": "RELIANCE.BSE", "name": "Reliance Industries", "sector": "Energy"},
    {"symbol": "ONGC.BSE", "name": "Oil and Natural Gas Corporation", "sector": "Energy"},
    {"symbol": "HINDUNILVR.BSE", "name": "Hindustan Unilever", "sector": "FMCG"},
    {"symbol": "ITC.BSE", "name": "ITC Limited", "sector": "FMCG"},
    {"symbol": "TATAMOTORS.BSE", "name": "Tata Motors", "sector": "Auto"},
    {"symbol": "MARUTI.BSE", "name": "Maruti Suzuki", "sector": "Auto"},
    {"symbol": "SUNPHARMA.BSE", "name": "Sun Pharmaceutical", "sector": "Pharma"},
    {"symbol": "DRREDDY.BSE", "name": "Dr. Reddy's Laboratories", "sector": "Pharma"},
    {"symbol": "BHARTIARTL.BSE", "name": "Bharti Airtel", "sector": "Telecom"},
]

# Rate limiting tracker
last_request_times = []
MAX_REQUESTS_PER_DAY = 25

def check_rate_limit():
    """Check if we can make an API request without exceeding rate limit"""
    global last_request_times
    now = datetime.now()
    
    # Remove requests older than 24 hours
    last_request_times = [t for t in last_request_times if now - t < timedelta(hours=24)]
    
    if len(last_request_times) >= MAX_REQUESTS_PER_DAY:
        oldest = min(last_request_times)
        wait_time = timedelta(hours=24) - (now - oldest)
        return False, wait_time.total_seconds()
    
    return True, 0

def record_request():
    """Record that we made an API request"""
    global last_request_times
    last_request_times.append(datetime.now())

def fetch_stock_data(symbol: str, api_key: str, outputsize: str = "compact"):
    """Fetch stock data from Alpha Vantage"""
    ts = TimeSeries(key=api_key, output_format='pandas')
    
    try:
        # Check rate limit
        can_request, wait_time = check_rate_limit()
        if not can_request:
            print(f"Rate limit reached. Wait {wait_time/3600:.2f} hours before next request.")
            return None
        
        # Fetch data (use 'compact' for free tier - gets last 100 data points)
        data, meta_data = ts.get_daily(symbol=symbol, outputsize=outputsize)
        record_request()
        
        # Rename columns for consistency
        data = data.rename(columns={
            '1. open': 'open',
            '2. high': 'high',
            '3. low': 'low',
            '4. close': 'close',
            '5. volume': 'volume'
        })
        
        # Reset index to make date a column
        data.reset_index(inplace=True)
        data.rename(columns={'date': 'date'}, inplace=True)
        
        # Convert date to datetime
        data['date'] = pd.to_datetime(data['date'])
        
        # Clean the symbol (remove .BSE suffix for storage)
        clean_symbol = symbol.replace('.BSE', '')
        data['symbol'] = clean_symbol
        
        return data
    
    except Exception as e:
        print(f"Error fetching data for {symbol}: {str(e)}")
        return None

def seed_companies(db: Session):
    """Seed the companies table with tracked stocks"""
    for stock in TRACKED_STOCKS:
        clean_symbol = stock['symbol'].replace('.BSE', '')
        
        # Check if company already exists
        existing = db.query(Company).filter(Company.symbol == clean_symbol).first()
        if not existing:
            company = Company(
                symbol=clean_symbol,
                name=stock['name'],
                sector=stock['sector']
            )
            db.add(company)
    
    db.commit()
    print(f"Seeded {len(TRACKED_STOCKS)} companies")

def clean_and_store_data(df: pd.DataFrame, db: Session):
    """Clean data and store in database"""
    if df is None or df.empty:
        return
    
    symbol = df['symbol'].iloc[0]
    
    # Remove any existing data for this symbol and date range
    dates = df['date'].tolist()
    db.query(StockPrice).filter(
        StockPrice.symbol == symbol,
        StockPrice.date.in_(dates)
    ).delete(synchronize_session=False)
    
    # Insert new data (metrics will be computed later)
    for _, row in df.iterrows():
        stock_price = StockPrice(
            symbol=symbol,
            date=row['date'].date(),
            open=float(row['open']),
            high=float(row['high']),
            low=float(row['low']),
            close=float(row['close']),
            volume=int(row['volume'])
        )
        db.add(stock_price)
    
    db.commit()
    print(f"Stored {len(df)} records for {symbol}")

def ingest_all_stocks(force_refresh: bool = False, api_key: str = None):
    """Ingest data for all tracked stocks"""
    # Use provided API key or fall back to environment variable
    if not api_key:
        api_key = os.getenv("ALPHA_VANTAGE_API_KEY")
    
    if not api_key:
        raise ValueError("ALPHA_VANTAGE_API_KEY not set in environment or provided")
    
    # Create tables if they don't exist
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    try:
        # Seed companies first
        seed_companies(db)
        
        # Fetch data for each stock
        for stock in TRACKED_STOCKS:
            symbol = stock['symbol']
            clean_symbol = symbol.replace('.BSE', '')
            
            # Check if we already have data
            if not force_refresh:
                existing_count = db.query(StockPrice).filter(StockPrice.symbol == clean_symbol).count()
                if existing_count > 0:
                    print(f"Skipping {symbol} - already have {existing_count} records")
                    continue
            
            print(f"Fetching data for {symbol}...")
            data = fetch_stock_data(symbol, api_key, outputsize="compact")  # Use compact for free tier
            
            if data is not None:
                clean_and_store_data(data, db)
                # Sleep to respect rate limits (free tier: 5 calls per minute = 12 seconds)
                time.sleep(15)  # Wait 15 seconds between requests to be safe
            else:
                print(f"Failed to fetch data for {symbol}")
    
    finally:
        db.close()

if __name__ == "__main__":
    ingest_all_stocks()

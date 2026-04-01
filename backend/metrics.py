import pandas as pd
import numpy as np
from sqlalchemy.orm import Session
from backend.models import StockPrice
from backend.database import SessionLocal

def calculate_daily_return(df: pd.DataFrame) -> pd.Series:
    """Calculate daily return: (close - open) / open"""
    return (df['close'] - df['open']) / df['open']

def calculate_moving_average(series: pd.Series, window: int) -> pd.Series:
    """Calculate moving average"""
    return series.rolling(window=window, min_periods=1).mean()

def calculate_volatility(series: pd.Series, window: int = 30) -> pd.Series:
    """Calculate rolling volatility (standard deviation of returns)"""
    return series.rolling(window=window, min_periods=1).std()

def detect_volume_spike(df: pd.DataFrame, window: int = 20, threshold: float = 2.0) -> pd.Series:
    """Detect volume spikes: volume > threshold * 20-day average volume"""
    avg_volume = df['volume'].rolling(window=window, min_periods=1).mean()
    return df['volume'] > (threshold * avg_volume)

def calculate_52_week_high_low(df: pd.DataFrame, window: int = 252):
    """Calculate 52-week (approximately 252 trading days) high and low"""
    high_52w = df['close'].rolling(window=window, min_periods=1).max()
    low_52w = df['close'].rolling(window=window, min_periods=1).min()
    return high_52w, low_52w

def calculate_sentiment_score(df: pd.DataFrame) -> pd.Series:
    """
    Calculate composite sentiment score based on:
    - Momentum (50%): 5-day return
    - Volatility rank (30%): Current volatility percentile
    - MA crossover signal (20%): MA7 vs MA20
    
    Returns score between -100 and 100
    """
    # Momentum score: 5-day return normalized
    momentum = (df['close'] - df['close'].shift(5)) / df['close'].shift(5)
    momentum_norm = momentum.fillna(0)
    
    # Normalize momentum to [-1, 1] range using tanh
    momentum_score = np.tanh(momentum_norm * 5)  # Scale factor for sensitivity
    
    # Volatility rank: percentile of current volatility
    volatility_rank = df['volatility'].rank(pct=True)
    # Invert: lower volatility is better for sentiment
    volatility_score = 1 - volatility_rank
    
    # MA crossover signal
    ma_signal = np.where(df['ma_7'] > df['ma_20'], 1, -1)
    ma_signal = pd.Series(ma_signal, index=df.index)
    
    # Weighted combination
    sentiment = (
        0.5 * momentum_score +
        0.3 * volatility_score +
        0.2 * ma_signal
    )
    
    # Scale to -100 to 100
    return sentiment * 100

def get_sentiment_label(score: float) -> str:
    """Convert sentiment score to label"""
    if pd.isna(score):
        return "Neutral"
    if score > 20:
        return "Bullish"
    elif score < -20:
        return "Bearish"
    else:
        return "Neutral"

def compute_metrics_for_symbol(symbol: str, db: Session):
    """Compute all metrics for a given symbol"""
    # Fetch all data for the symbol, ordered by date
    stock_data = db.query(StockPrice).filter(
        StockPrice.symbol == symbol
    ).order_by(StockPrice.date).all()
    
    if not stock_data:
        print(f"No data found for {symbol}")
        return
    
    # Convert to DataFrame for easier computation
    df = pd.DataFrame([
        {
            'id': sp.id,
            'date': sp.date,
            'open': sp.open,
            'high': sp.high,
            'low': sp.low,
            'close': sp.close,
            'volume': sp.volume
        }
        for sp in stock_data
    ])
    
    # Calculate all metrics
    df['daily_return'] = calculate_daily_return(df)
    df['ma_7'] = calculate_moving_average(df['close'], 7)
    df['ma_20'] = calculate_moving_average(df['close'], 20)
    df['volatility'] = calculate_volatility(df['daily_return'], 30)
    df['volume_spike'] = detect_volume_spike(df, 20, 2.0)
    
    # Calculate sentiment score
    df['sentiment_score'] = calculate_sentiment_score(df)
    
    # Update database with computed metrics
    for _, row in df.iterrows():
        db.query(StockPrice).filter(StockPrice.id == row['id']).update({
            'daily_return': float(row['daily_return']) if not pd.isna(row['daily_return']) else None,
            'ma_7': float(row['ma_7']) if not pd.isna(row['ma_7']) else None,
            'ma_20': float(row['ma_20']) if not pd.isna(row['ma_20']) else None,
            'volatility': float(row['volatility']) if not pd.isna(row['volatility']) else None,
            'volume_spike': bool(row['volume_spike']) if not pd.isna(row['volume_spike']) else False
        })
    
    db.commit()
    print(f"Computed metrics for {symbol}: {len(df)} records updated")

def compute_metrics_for_all_symbols():
    """Compute metrics for all symbols in the database"""
    from backend.models import Company
    
    db = SessionLocal()
    try:
        companies = db.query(Company).all()
        for company in companies:
            print(f"Computing metrics for {company.symbol}...")
            compute_metrics_for_symbol(company.symbol, db)
    finally:
        db.close()

def get_summary_metrics(symbol: str, db: Session):
    """Get summary metrics for a symbol including 52w high/low and sentiment"""
    # Fetch recent data (last 252 trading days for 52w calculations)
    stock_data = db.query(StockPrice).filter(
        StockPrice.symbol == symbol
    ).order_by(StockPrice.date.desc()).limit(252).all()
    
    if not stock_data:
        return None
    
    # Reverse to chronological order
    stock_data = list(reversed(stock_data))
    
    df = pd.DataFrame([
        {
            'close': sp.close,
            'daily_return': sp.daily_return,
            'volatility': sp.volatility,
            'ma_7': sp.ma_7,
            'ma_20': sp.ma_20
        }
        for sp in stock_data
    ])
    
    # Calculate 52-week high and low
    high_52w = df['close'].max()
    low_52w = df['close'].min()
    avg_close = df['close'].mean()
    
    # Get latest sentiment (recalculate for most recent data)
    latest_sentiment = calculate_sentiment_score(df).iloc[-1] if len(df) > 0 else 0
    sentiment_label = get_sentiment_label(latest_sentiment)
    
    # Get latest volatility
    latest_volatility = df['volatility'].iloc[-1] if len(df) > 0 and not pd.isna(df['volatility'].iloc[-1]) else 0
    
    return {
        'high_52w': float(high_52w),
        'low_52w': float(low_52w),
        'avg_close': float(avg_close),
        'sentiment_score': float(latest_sentiment) if not pd.isna(latest_sentiment) else 0,
        'sentiment_label': sentiment_label,
        'volatility': float(latest_volatility)
    }

if __name__ == "__main__":
    compute_metrics_for_all_symbols()

#!/usr/bin/env python3
"""
Database inspection utility.
View database statistics and sample data.
"""

import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.database import SessionLocal
from backend.models import Company, StockPrice, Prediction
from sqlalchemy import func

def print_table_stats():
    """Print statistics for all tables"""
    db = SessionLocal()
    try:
        print("=" * 80)
        print("DATABASE STATISTICS")
        print("=" * 80)
        
        # Companies
        company_count = db.query(Company).count()
        print(f"\n📊 COMPANIES: {company_count} total")
        if company_count > 0:
            sectors = db.query(Company.sector, func.count(Company.symbol)).group_by(Company.sector).all()
            for sector, count in sectors:
                print(f"   {sector}: {count} companies")
        
        # Stock Prices
        stock_count = db.query(StockPrice).count()
        print(f"\n📈 STOCK PRICES: {stock_count:,} records")
        if stock_count > 0:
            # Date range
            min_date = db.query(func.min(StockPrice.date)).scalar()
            max_date = db.query(func.max(StockPrice.date)).scalar()
            print(f"   Date range: {min_date} to {max_date}")
            
            # Per symbol count
            symbol_counts = db.query(
                StockPrice.symbol, 
                func.count(StockPrice.id)
            ).group_by(StockPrice.symbol).all()
            
            print(f"   Records per symbol:")
            for symbol, count in sorted(symbol_counts, key=lambda x: x[1], reverse=True):
                print(f"      {symbol}: {count:,} records")
        
        # Predictions
        pred_count = db.query(Prediction).count()
        print(f"\n🔮 PREDICTIONS: {pred_count} total")
        if pred_count > 0:
            latest_preds = db.query(
                Prediction.symbol,
                Prediction.trend,
                func.max(Prediction.generated_at).label('latest')
            ).group_by(Prediction.symbol).all()
            
            print(f"   Latest predictions:")
            for symbol, trend, generated_at in latest_preds:
                print(f"      {symbol}: {trend} (generated: {generated_at})")
        
        print("\n" + "=" * 80)
    
    finally:
        db.close()

def print_sample_data():
    """Print sample data from each table"""
    db = SessionLocal()
    try:
        print("\n" + "=" * 80)
        print("SAMPLE DATA")
        print("=" * 80)
        
        # Sample companies
        print("\n📋 Sample Companies:")
        companies = db.query(Company).limit(5).all()
        for company in companies:
            print(f"   {company.symbol:12} | {company.name:30} | {company.sector}")
        
        # Sample stock prices
        print("\n📊 Sample Stock Prices (latest):")
        latest_prices = db.query(StockPrice).order_by(
            StockPrice.date.desc()
        ).limit(5).all()
        for sp in latest_prices:
            print(f"   {sp.symbol:10} | {sp.date} | Close: ₹{sp.close:8.2f} | Return: {sp.daily_return*100:6.2f}%")
        
        print("\n" + "=" * 80)
    
    finally:
        db.close()

def main():
    """Main inspection workflow"""
    print_table_stats()
    print_sample_data()
    
    print("\n💡 Tips:")
    print("   - Use SQLite CLI: sqlite3 data/stocks.db")
    print("   - Use SQLite Web: docker-compose --profile tools up -d sqlite-web")
    print("   - Access web interface: http://localhost:8080")

if __name__ == "__main__":
    main()

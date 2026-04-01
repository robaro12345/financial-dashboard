#!/usr/bin/env python3
"""
Database initialization and seeding script.
Run this to set up the database with initial data.
"""

import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.database import Base, engine, SessionLocal
from backend.models import Company, StockPrice, Prediction
from backend.data_ingestion import ingest_all_stocks, seed_companies
from backend.metrics import compute_metrics_for_all_symbols

def init_database():
    """Initialize database tables"""
    print("Creating database tables...")
    Base.metadata.create_all(bind=engine)
    print("✓ Database tables created")

def seed_data():
    """Seed initial company data"""
    print("\nSeeding company data...")
    db = SessionLocal()
    try:
        seed_companies(db)
        print("✓ Company data seeded")
    finally:
        db.close()

def check_data():
    """Check if data exists"""
    db = SessionLocal()
    try:
        company_count = db.query(Company).count()
        stock_count = db.query(StockPrice).count()
        prediction_count = db.query(Prediction).count()
        
        print(f"\n📊 Database Status:")
        print(f"   Companies: {company_count}")
        print(f"   Stock Prices: {stock_count}")
        print(f"   Predictions: {prediction_count}")
        
        return company_count, stock_count, prediction_count
    finally:
        db.close()

def fetch_stock_data():
    """Fetch stock data from Alpha Vantage"""
    print("\n🔄 Fetching stock data from Alpha Vantage...")
    print("⚠️  This will use 15 API calls (out of 25 daily limit)")
    
    response = input("Continue? (y/n): ")
    if response.lower() != 'y':
        print("Skipped data fetching")
        return
    
    try:
        ingest_all_stocks(force_refresh=False)
        print("✓ Stock data fetched successfully")
    except Exception as e:
        print(f"✗ Error fetching data: {str(e)}")
        return False
    
    return True

def compute_metrics():
    """Compute metrics for all stocks"""
    print("\n📈 Computing metrics...")
    try:
        compute_metrics_for_all_symbols()
        print("✓ Metrics computed successfully")
    except Exception as e:
        print(f"✗ Error computing metrics: {str(e)}")
        return False
    
    return True

def main():
    """Main initialization workflow"""
    print("=" * 60)
    print("Stock Data Intelligence Dashboard - Database Initialization")
    print("=" * 60)
    
    # Step 1: Initialize database
    init_database()
    
    # Step 2: Seed companies
    seed_data()
    
    # Step 3: Check existing data
    company_count, stock_count, _ = check_data()
    
    # Step 4: Fetch stock data if needed
    if stock_count == 0:
        print("\n⚠️  No stock price data found")
        if fetch_stock_data():
            compute_metrics()
    else:
        print("\n✓ Stock data already exists")
        response = input("Refresh data? This will use API calls (y/n): ")
        if response.lower() == 'y':
            if fetch_stock_data():
                compute_metrics()
    
    # Final status
    print("\n" + "=" * 60)
    check_data()
    print("=" * 60)
    print("\n✅ Database initialization complete!")
    print("\nNext steps:")
    print("1. Start Redis: redis-server")
    print("2. Start backend: python -m uvicorn backend.main:app --reload")
    print("3. Start frontend: cd frontend && npm run dev")
    print("4. Open browser: http://localhost:5173")

if __name__ == "__main__":
    main()

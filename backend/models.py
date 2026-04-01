from sqlalchemy import Column, Integer, String, Float, Date, DateTime, BigInteger, Boolean, Text, Index, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from backend.database import Base

class Company(Base):
    __tablename__ = "companies"
    
    symbol = Column(String(20), primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    sector = Column(String(100), nullable=False)
    
    # Relationship to stock prices
    stock_prices = relationship("StockPrice", back_populates="company", cascade="all, delete-orphan")
    predictions = relationship("Prediction", back_populates="company", cascade="all, delete-orphan")

class StockPrice(Base):
    __tablename__ = "stock_prices"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    symbol = Column(String(20), ForeignKey("companies.symbol"), nullable=False, index=True)
    date = Column(Date, nullable=False, index=True)
    open = Column(Float, nullable=False)
    high = Column(Float, nullable=False)
    low = Column(Float, nullable=False)
    close = Column(Float, nullable=False)
    volume = Column(BigInteger, nullable=False)
    
    # Computed metrics
    daily_return = Column(Float)
    ma_7 = Column(Float)
    ma_20 = Column(Float)
    volatility = Column(Float)
    volume_spike = Column(Boolean, default=False)
    
    # Relationship to company
    company = relationship("Company", back_populates="stock_prices")
    
    # Composite index for efficient queries
    __table_args__ = (
        Index('idx_symbol_date', 'symbol', 'date'),
    )

class Prediction(Base):
    __tablename__ = "predictions"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    symbol = Column(String(20), ForeignKey("companies.symbol"), nullable=False, index=True)
    generated_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    forecast_json = Column(Text, nullable=False)  # JSON array of 7 predicted prices
    trend = Column(String(20), nullable=False)  # "Bullish", "Neutral", or "Bearish"
    
    # Relationship to company
    company = relationship("Company", back_populates="predictions")

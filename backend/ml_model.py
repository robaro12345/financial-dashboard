import numpy as np
import pandas as pd
import pickle
import json
import os
from datetime import datetime
from sqlalchemy.orm import Session
from sklearn.preprocessing import MinMaxScaler
from tensorflow import keras
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import LSTM, Dense, Dropout

from backend.models import StockPrice, Prediction, Company
from backend.database import SessionLocal

# Model parameters
SEQUENCE_LENGTH = 60
PREDICTION_DAYS = 7
FEATURES = ['close', 'volume', 'daily_return', 'ma_7', 'ma_20']

def prepare_data(symbol: str, db: Session):
    """Prepare data for training/inference"""
    # Fetch all stock data for the symbol
    stock_data = db.query(StockPrice).filter(
        StockPrice.symbol == symbol
    ).order_by(StockPrice.date).all()
    
    if not stock_data or len(stock_data) < SEQUENCE_LENGTH + PREDICTION_DAYS:
        raise ValueError(f"Insufficient data for {symbol}. Need at least {SEQUENCE_LENGTH + PREDICTION_DAYS} records.")
    
    # Convert to DataFrame
    df = pd.DataFrame([
        {
            'date': sp.date,
            'close': sp.close,
            'volume': sp.volume,
            'daily_return': sp.daily_return if sp.daily_return is not None else 0,
            'ma_7': sp.ma_7 if sp.ma_7 is not None else sp.close,
            'ma_20': sp.ma_20 if sp.ma_20 is not None else sp.close
        }
        for sp in stock_data
    ])
    
    # Fill any remaining NaN values
    df = df.ffill().bfill()
    
    return df

def create_sequences(data, sequence_length):
    """Create sequences for LSTM training"""
    X, y = [], []
    for i in range(len(data) - sequence_length - PREDICTION_DAYS + 1):
        X.append(data[i:i + sequence_length])
        # Target is the next 7 closing prices
        y.append(data[i + sequence_length:i + sequence_length + PREDICTION_DAYS, 0])
    
    return np.array(X), np.array(y)

def build_lstm_model(input_shape):
    """Build LSTM model architecture"""
    model = Sequential([
        LSTM(64, return_sequences=True, input_shape=input_shape),
        Dropout(0.2),
        LSTM(32, return_sequences=False),
        Dropout(0.2),
        Dense(PREDICTION_DAYS)
    ])
    
    model.compile(
        optimizer='adam',
        loss='mse',
        metrics=['mae']
    )
    
    return model

def train_model(symbol: str, db: Session, epochs: int = 50, batch_size: int = 32):
    """Train LSTM model for a specific symbol"""
    print(f"Training model for {symbol}...")
    
    # Prepare data
    df = prepare_data(symbol, db)
    
    # Select features
    feature_data = df[FEATURES].values
    
    # Scale the feature data for model training
    feature_scaler = MinMaxScaler(feature_range=(0, 1))
    scaled_data = feature_scaler.fit_transform(feature_data)
    
    # Also create a separate scaler for close prices only (for inverse transform)
    close_scaler = MinMaxScaler(feature_range=(0, 1))
    close_scaler.fit(df[['close']].values)
    
    # Create sequences
    X, y = create_sequences(scaled_data, SEQUENCE_LENGTH)
    
    if len(X) == 0:
        raise ValueError(f"Not enough data to create sequences for {symbol}")
    
    # Split into train and test
    split_idx = int(len(X) * 0.8)
    X_train, X_test = X[:split_idx], X[split_idx:]
    y_train, y_test = y[:split_idx], y[split_idx:]
    
    print(f"Training samples: {len(X_train)}, Test samples: {len(X_test)}")
    
    # Build model
    model = build_lstm_model((SEQUENCE_LENGTH, len(FEATURES)))
    
    # Train model
    history = model.fit(
        X_train, y_train,
        epochs=epochs,
        batch_size=batch_size,
        validation_data=(X_test, y_test),
        verbose=0
    )
    
    # Evaluate
    test_loss, test_mae = model.evaluate(X_test, y_test, verbose=0)
    print(f"Test Loss: {test_loss:.4f}, Test MAE: {test_mae:.4f}")
    
    # Save model and both scalers
    model_dir = "models"
    os.makedirs(model_dir, exist_ok=True)
    
    model_path = os.path.join(model_dir, f"{symbol}.keras")
    feature_scaler_path = os.path.join(model_dir, f"{symbol}_scaler.pkl")
    close_scaler_path = os.path.join(model_dir, f"{symbol}_close_scaler.pkl")
    
    model.save(model_path)
    with open(feature_scaler_path, 'wb') as f:
        pickle.dump(feature_scaler, f)
    with open(close_scaler_path, 'wb') as f:
        pickle.dump(close_scaler, f)
    
    print(f"Model saved to {model_path}")
    print(f"Scalers saved to {feature_scaler_path} and {close_scaler_path}")
    
    return model, feature_scaler, close_scaler

def load_model_and_scaler(symbol: str):
    """Load trained model and scalers"""
    model_path = os.path.join("models", f"{symbol}.keras")
    feature_scaler_path = os.path.join("models", f"{symbol}_scaler.pkl")
    close_scaler_path = os.path.join("models", f"{symbol}_close_scaler.pkl")
    
    if not os.path.exists(model_path) or not os.path.exists(feature_scaler_path):
        return None, None, None
    
    model = keras.models.load_model(model_path)
    with open(feature_scaler_path, 'rb') as f:
        feature_scaler = pickle.load(f)
    
    # Load close scaler if exists, otherwise use feature scaler (backward compatibility)
    if os.path.exists(close_scaler_path):
        with open(close_scaler_path, 'rb') as f:
            close_scaler = pickle.load(f)
    else:
        close_scaler = None
    
    return model, feature_scaler, close_scaler

def predict_future(symbol: str, db: Session):
    """Generate 7-day forecast for a symbol"""
    # Load model and scalers
    model, feature_scaler, close_scaler = load_model_and_scaler(symbol)
    
    if model is None or feature_scaler is None:
        # Train model if not exists
        print(f"Model not found for {symbol}. Training...")
        model, feature_scaler, close_scaler = train_model(symbol, db)
    
    # Prepare recent data
    df = prepare_data(symbol, db)
    
    # Get last SEQUENCE_LENGTH days
    recent_data = df[FEATURES].tail(SEQUENCE_LENGTH).values
    
    # Scale data using feature scaler
    scaled_data = feature_scaler.transform(recent_data)
    
    # Reshape for prediction
    X_pred = scaled_data.reshape(1, SEQUENCE_LENGTH, len(FEATURES))
    
    # Make prediction (returns scaled close prices for next 7 days)
    prediction_scaled = model.predict(X_pred, verbose=0)
    
    # Inverse transform to get actual prices
    if close_scaler is not None:
        # Use the dedicated close scaler for accurate inverse transformation
        forecast = close_scaler.inverse_transform(prediction_scaled.reshape(-1, 1)).flatten().tolist()
    else:
        # Fallback for old models: use manual inverse transform with feature scaler
        # Extract close price min/max from the feature scaler
        close_idx = 0  # close is the first feature
        min_val = feature_scaler.min_[close_idx]
        scale_val = feature_scaler.scale_[close_idx]
        forecast = (prediction_scaled[0] / scale_val + min_val).tolist()
    
    return forecast

def calculate_trend(forecast: list) -> str:
    """Calculate trend label based on forecast"""
    if not forecast or len(forecast) < 2:
        return "Neutral"
    
    predicted_change = (forecast[-1] - forecast[0]) / forecast[0]
    
    if predicted_change > 0.01:  # > 1% increase
        return "Bullish"
    elif predicted_change < -0.01:  # > 1% decrease
        return "Bearish"
    else:
        return "Neutral"

def generate_prediction(symbol: str, db: Session):
    """Generate and store prediction for a symbol"""
    # Generate forecast
    forecast = predict_future(symbol, db)
    
    # Calculate trend
    trend = calculate_trend(forecast)
    
    # Store in database
    prediction = Prediction(
        symbol=symbol,
        generated_at=datetime.utcnow(),
        forecast_json=json.dumps(forecast),
        trend=trend
    )
    
    db.add(prediction)
    db.commit()
    db.refresh(prediction)
    
    print(f"Prediction stored for {symbol}: {trend}")
    
    return prediction

def train_all_models():
    """Train models for all symbols in database"""
    db = SessionLocal()
    try:
        companies = db.query(Company).all()
        for company in companies:
            try:
                train_model(company.symbol, db, epochs=30)
                print(f"✓ Completed training for {company.symbol}")
            except Exception as e:
                print(f"✗ Failed to train {company.symbol}: {str(e)}")
    finally:
        db.close()

if __name__ == "__main__":
    train_all_models()

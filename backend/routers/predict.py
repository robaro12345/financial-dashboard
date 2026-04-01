from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from fastapi_cache.decorator import cache

from backend.database import get_db
from backend.models import Company, Prediction
from backend.schemas import PredictionResponse
from backend.cache import CACHE_PREDICT

router = APIRouter(prefix="/api", tags=["predictions"])

@router.get("/predict/{symbol}", response_model=PredictionResponse)
@cache(expire=CACHE_PREDICT)
async def get_prediction(symbol: str, db: Session = Depends(get_db)):
    """Get LSTM 7-day forecast for a symbol"""
    # Check if company exists
    company = db.query(Company).filter(Company.symbol == symbol).first()
    if not company:
        raise HTTPException(status_code=404, detail=f"Company {symbol} not found")
    
    # Try to get existing prediction
    prediction = db.query(Prediction).filter(
        Prediction.symbol == symbol
    ).order_by(Prediction.generated_at.desc()).first()
    
    # If no prediction exists or it's too old, generate new one
    if not prediction:
        try:
            from backend.ml_model import generate_prediction
            prediction = generate_prediction(symbol, db)
        except Exception as e:
            raise HTTPException(
                status_code=500, 
                detail=f"Error generating prediction: {str(e)}"
            )
    
    # Parse forecast JSON
    import json
    forecast = json.loads(prediction.forecast_json)
    
    return PredictionResponse(
        symbol=symbol,
        forecast=forecast,
        trend=prediction.trend,
        generated_at=prediction.generated_at
    )

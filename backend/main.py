from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from backend.database import engine, Base
from backend.cache import init_cache
from backend.routers import stocks, analytics, predict

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan events for startup and shutdown"""
    # Startup
    print("Starting up...")
    
    # Create database tables
    Base.metadata.create_all(bind=engine)
    print("Database tables created")
    
    # Initialize Redis cache
    await init_cache()
    
    # Check if initial data seeding is needed
    from backend.database import SessionLocal
    from backend.models import Company
    
    db = SessionLocal()
    try:
        company_count = db.query(Company).count()
        if company_count == 0:
            print("No companies found. Run data ingestion to populate database.")
            print("You can trigger this via POST /api/refresh or run backend/data_ingestion.py")
    finally:
        db.close()
    
    yield
    
    # Shutdown
    print("Shutting down...")

# Create FastAPI app
app = FastAPI(
    title="Stock Data Intelligence Dashboard API",
    description="Financial data platform with ML-powered predictions",
    version="1.0.0",
    lifespan=lifespan
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],  # Frontend URLs
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(stocks.router)
app.include_router(analytics.router)
app.include_router(predict.router)

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Stock Data Intelligence Dashboard API",
        "docs": "/docs",
        "version": "1.0.0"
    }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)

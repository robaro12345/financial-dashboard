# Stock Data Intelligence Dashboard

A full-stack financial data platform built with FastAPI, React, and machine learning for stock market analysis and predictions.

## 🚀 Features

- **Real-time Stock Data**: Track 15 Indian stock symbols with live data from Alpha Vantage
- **ML Predictions**: LSTM-based 7-day price forecasts with trend analysis
- **Advanced Analytics**: 
  - Price charts with moving averages (MA7, MA20)
  - Stock comparison with normalized prices
  - Correlation heatmap
  - Top gainers/losers
- **Computed Metrics**: Daily returns, volatility, 52-week high/low, sentiment scores
- **Responsive UI**: Modern dashboard with interactive charts

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| **Backend** | FastAPI, Python 3.11 |
| **Database** | SQLite with SQLAlchemy ORM |
| **Cache** | Redis with fastapi-cache2 |
| **ML** | TensorFlow/Keras LSTM models |
| **Frontend** | React 19, TypeScript, Vite |
| **Charts** | Recharts, Plotly.js |
| **State** | TanStack Query, React Context |
| **Deployment** | Docker, docker-compose |

## 📦 Installation

### Prerequisites

- Python 3.11+
- Node.js 18+
- Docker & Docker Compose (optional)
- Alpha Vantage API key (free at [alphavantage.co](https://www.alphavantage.co/))

### Setup

1. **Clone the repository**
```bash
git clone <repository-url>
cd Intership
```

2. **Set up environment variables**
```bash
cp .env.example .env
# Edit .env and add your ALPHA_VANTAGE_API_KEY
```

3. **Option A: Run with Docker (Recommended)**
```bash
# Start backend + Redis
docker-compose up -d

# Optional: Start SQLite web viewer (accessible at http://localhost:8080)
docker-compose --profile tools up -d

# Install frontend dependencies
cd frontend
npm install

# Start frontend dev server
npm run dev
```

4. **Option B: Run locally**

**Backend:**
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt

# Start Redis (in separate terminal)
redis-server

# Run backend
python -m uvicorn backend.main:app --reload
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

## 📊 Initial Data Setup

**Option 1: Automated Setup Script (Recommended)**
```bash
# Option 1: Via API endpoint (after backend is running)
curl -X POST http://localhost:8000/api/refresh

# Option 2: Run data ingestion script
cd backend
python -m backend.data_ingestion

# 2. Compute metrics
python -m backend.metrics

# 3. Train ML models (optional, takes 30-60 min)
python -m backend.ml_model
```

**Option 3: Via API** (after backend is running)
```bash
curl -X POST http://localhost:8000/api/refresh
```

**Inspect Database**:
```bash
cd backend
python inspect_db.py
# Shows statistics and sample data
```

> **Note**: The `/predict` endpoint will auto-train models on first request if not pre-trained.

## 🌐 API Endpoints

| Endpoint | Method | Description | Cache TTL |
|----------|--------|-------------|-----------|
| `/api/companies` | GET | List all tracked companies | 24h |
| `/api/data/{symbol}?days=30` | GET | Stock OHLCV + metrics | 24h |
| `/api/summary/{symbol}` | GET | 52w high/low, sentiment | 24h |
| `/api/compare?symbol1=X&symbol2=Y` | GET | Normalized comparison | 24h |
| `/api/gainers-losers` | GET | Top 5 gainers/losers | 24h |
| `/api/correlation?days=90` | GET | Correlation matrix | 24h |
| `/api/predict/{symbol}` | GET | 7-day LSTM forecast | 6h |
| `/api/refresh` | POST | Re-fetch data from Alpha Vantage | — |

**Swagger UI**: [http://localhost:8000/docs](http://localhost:8000/docs)

## 🎯 Tracked Stocks (15 symbols)

| Symbol | Company | Sector |
|--------|---------|--------|
| TCS | Tata Consultancy Services | IT |
| INFY | Infosys | IT |
| WIPRO | Wipro | IT |
| HDFCBANK | HDFC Bank | Banking |
| ICICIBANK | ICICI Bank | Banking |
| SBIN | State Bank of India | Banking |
| RELIANCE | Reliance Industries | Energy |
| ONGC | ONGC | Energy |
| HINDUNILVR | Hindustan Unilever | FMCG |
| ITC | ITC Limited | FMCG |
| TATAMOTORS | Tata Motors | Auto |
| MARUTI | Maruti Suzuki | Auto |
| SUNPHARMA | Sun Pharmaceutical | Pharma |
| DRREDDY | Dr. Reddy's Laboratories | Pharma |
| BHARTIARTL | Bharti Airtel | Telecom |

## 🧮 Computed Metrics

- **Daily Return**: `(close - open) / open`
- **MA7 / MA20**: 7-day and 20-day moving averages
- **Volatility**: 30-day rolling standard deviation
- **52w High/Low**: Max/min over 252 trading days
- **Volume Spike**: `volume > 2 × 20-day avg volume`
- **Sentiment Score**: Weighted composite of momentum (50%), volatility rank (30%), MA crossover (20%)

## 🤖 ML Model Details

**Architecture**: LSTM Sequential Model
- Input: 60-day window × 5 features (close, volume, daily_return, ma_7, ma_20)
- Layers: LSTM(64) → Dropout(0.2) → LSTM(32) → Dropout(0.2) → Dense(7)
- Output: 7 predicted closing prices
- Loss: MSE | Optimizer: Adam

**Trend Labels**:
- **Bullish**: Forecast change > +1%
- **Bearish**: Forecast change < -1%
- **Neutral**: Change between -1% and +1%

## ⚠️ Rate Limits

- Alpha Vantage Free Tier: **25 requests/day**
- Strategy: Fetch once → persist to SQLite → serve from DB
- The `/refresh` endpoint respects rate limits (use sparingly)

## 📁 Project Structure

```
Intership/
├── backend/
│   ├── main.py               # FastAPI app
│   ├── data_ingestion.py     # Alpha Vantage fetcher
│   ├── metrics.py            # Computed metrics
│   ├── ml_model.py           # LSTM training & inference
│   ├── database.py           # SQLAlchemy setup
│   ├── models.py             # ORM models
│   ├── schemas.py            # Pydantic schemas
│   ├── cache.py              # Redis configuration
│   ├── init_db.py            # Database initialization script ⭐
│   ├── inspect_db.py         # Database inspection tool ⭐
│   ├── routers/
│   │   ├── stocks.py
│   │   ├── analytics.py
│   │   └── predict.py
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── api/client.ts     # API client
│   │   ├── types/stock.ts    # TypeScript types
│   │   ├── contexts/         # React Context
│   │   ├── components/       # UI components
│   │   └── pages/            # Route pages
│   ├── package.json
│   └── vite.config.ts
├── data/                     # SQLite database
├── models/                   # LSTM .keras files
├── docker-compose.yml
├── README.md
├── QUICKSTART.md
└── DOCKER.md                 # Docker services guide ⭐
```

## 🖥️ Usage

1. **Dashboard**: Navigate to [http://localhost:5173](http://localhost:5173)
2. **Select a stock** from the sidebar
3. **Adjust time filter** (30D / 90D / 1Y)
4. **View analytics**:
   - Price chart with moving averages
   - 7-day ML prediction
   - Sentiment score and metrics
5. **Explore pages**:
   - Compare: Normalized comparison of 2 stocks
   - Heatmap: Correlation matrix visualization
   - Gainers/Losers: Top performers

## 🔧 Development

**Backend tests**:
```bash
cd backend
pytest  # If tests exist
```

**Frontend linting**:
```bash
cd frontend
npm run lint
```

**Type checking**:
```bash
npm run type-check  # If configured
```

## 🗄️ Database Management

**SQLite Web Viewer** (Docker only):
```bash
# Start the SQLite web interface
docker-compose --profile tools up -d sqlite-web

# Access at http://localhost:8080
# Browse tables, run queries, export data
```

**Direct SQLite Access**:
```bash
# Install sqlite3 CLI tool, then:
sqlite3 data/stocks.db

# Example queries:
sqlite> SELECT COUNT(*) FROM companies;
sqlite> SELECT symbol, name, sector FROM companies;
sqlite> SELECT COUNT(*) FROM stock_prices;
sqlite> .schema stock_prices
sqlite> .quit
```

## 🐛 Troubleshooting

**Issue**: "No data found for symbol"
- **Solution**: Run `/api/refresh` or `python -m backend.data_ingestion`

**Issue**: Redis connection error
- **Solution**: Ensure Redis is running (`redis-server` or `docker-compose up redis`)

**Issue**: ML model not found
- **Solution**: Models train on-demand. First `/predict` call may take 2-3 minutes.

**Issue**: Frontend can't reach backend
- **Solution**: Check CORS settings in `backend/main.py` and proxy in `vite.config.ts`

**Issue**: Database locked error
- **Solution**: SQLite doesn't support multiple writers. Ensure only one backend instance is running.

## 📝 License

This project is built as an internship assignment. All rights reserved.

## 🤝 Contributing

This is a private internship project. Contributions are not currently accepted.

## 📧 Contact

For questions or issues, please contact the project maintainer.

---

**Built with ❤️ using FastAPI, React, and TensorFlow**

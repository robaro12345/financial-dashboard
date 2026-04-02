FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install Python dependencies
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY backend/ ./backend/
COPY models/ ./models/
RUN mkdir -p ./data

# Set default PORT environment variable
ENV PORT=8000

# Expose port (Documentation only, Railway dynamically maps this)
EXPOSE $PORT

# Run the application directly using uvicorn and mapping the port
CMD ["sh", "-c", "uvicorn backend.main:app --host 0.0.0.0 --port $PORT"]

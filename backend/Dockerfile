FROM python:3.12-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend code
COPY . .

# Expose FastAPI port
EXPOSE 8000

# Default entrypoint
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]

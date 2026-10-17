# ML Service Dockerfile (FastAPI)
FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

# System deps for OpenCV headless + spaCy
RUN apt-get update && apt-get install -y \
    build-essential \
    libglib2.0-0 \
    libsm6 \
    libxrender1 \
    libxext6 \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements-ml.txt .
RUN pip install --no-cache-dir -r requirements-ml.txt

# Download spaCy model
RUN python -m spacy download en_core_web_sm

# Copy ML source files
COPY . .

EXPOSE 8001

# Start FastAPI with uvicorn
CMD ["uvicorn", "api.server:app", "--host", "0.0.0.0", "--port", "8001", "--workers", "1"]

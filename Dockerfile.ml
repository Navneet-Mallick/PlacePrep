# Dockerfile for ML API (FastAPI)
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies for OpenCV
RUN apt-get update && apt-get install -y \
    libgl1-mesa-glx \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# Copy ML requirements
COPY ml/requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Download spaCy model
RUN python -m spacy download en_core_web_sm

# Copy ML files
COPY ml/ ./ml/
COPY Datasets/ ./Datasets/

# Expose port
EXPOSE 8001

# Start ML API
CMD ["uvicorn", "ml.api.server:app", "--host", "0.0.0.0", "--port", "8001"]

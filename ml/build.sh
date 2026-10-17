#!/usr/bin/env bash
# Render build script for the FastAPI ML service
set -e

echo "Installing ML dependencies..."
pip install -r requirements-ml.txt

echo "Downloading spaCy model..."
python -m spacy download en_core_web_sm

echo "ML build complete."

#!/usr/bin/env bash
# Render build script for the Django backend
set -e

echo "Installing Django dependencies..."
pip install -r requirements-django.txt

echo "Collecting static files..."
python manage.py collectstatic --noinput

echo "Running database migrations..."
python manage.py migrate --noinput

echo "Build complete."

# backend/Dockerfile

# Use an official Python runtime as a parent image
FROM python:3.11-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

# Set work directory
WORKDIR /app

# Install system dependencies (like postgresql-client if needed, libpq-dev for psycopg2 build)
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq-dev \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt /app/
RUN pip install --upgrade pip
RUN pip install --no-cache-dir -r requirements.txt

# Copy project code
COPY . /app/

# Collect static files (optional if Nginx serves them directly)
# RUN python manage.py collectstatic --noinput

# Expose the port the app runs on (matching gunicorn command)
EXPOSE 8000

# Run the application using Gunicorn
# Use environment variables for host/port/workers if needed
# For development using runsslserver (requires generating certs - see README)
# CMD ["python", "manage.py", "runsslserver", "0.0.0.0:8000"]

# For production-like setup (without SSL handling here, Nginx would do that)
CMD ["gunicorn", "--bind", "0.0.0.0:8000", "project.wsgi:application"]
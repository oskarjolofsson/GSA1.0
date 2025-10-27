FROM python:3.13.5-slim
WORKDIR /app

# Copy and install dependencies first (better caching)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Add .dockerignore to exclude unnecessary files
CMD ["gunicorn", "-b", "0.0.0.0:8000", "app:app"]
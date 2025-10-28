FROM python:3.13.5-slim

# Install ffmpeg
RUN apt-get update \
 && apt-get install -y --no-install-recommends ffmpeg \
 && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy and install dependencies first (better caching)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Add .dockerignore to exclude unnecessary files
CMD ["gunicorn", "-b", "0.0.0.0:8000", "app:app", "-w", "2", "--threads", "4", "--timeout", "90", "--graceful-timeout", "30", "--keep-alive", "5"]

# To build multi-architecture Docker images, use the following commands:
# cd <your-backend-repo>
# docker buildx create --use
# docker buildx inspect --bootstrap
# docker login
# docker buildx build --platform linux/amd64,linux/arm64   -t oskarjolofsson/true_swing_backend:latest --push .

# To pull and run the image inside Hetzner Cloud, use:
# docker compose pull
# docker compose up -d
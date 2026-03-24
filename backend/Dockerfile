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
CMD ["gunicorn", "-k", "uvicorn.workers.UvicornWorker", "-b", "0.0.0.0:8000", "app.main:app", "-w", "2", "--timeout", "90", "--graceful-timeout", "30", "--keep-alive", "5"]

# To copy the .env.production into prodction, use:
# scp entire/path/to/.env.production root@188.245.42.39:/root/.env


# To build multi-architecture Docker images, use the following commands:
# cd <your-backend-repo>
# docker buildx create --use
# docker buildx inspect --bootstrap
# docker login
# docker buildx build --platform linux/amd64,linux/arm64   -t oskarjolofsson/true_swing_backend:latest --push .

# To pull and run the image inside Hetzner Cloud, use:
# cd /srv/trueswing
# docker compose pull
# docker compose up -d


# To test the image locally, use:
# docker build --no-cache -t trueswing-backend-test .
# docker run --rm -p 8000:8000 --env-file .env trueswing-backend-test


# To stop running containers, use:
# docker ps
# docker stop <container_id> 
# or 
# docker stop <container_name>
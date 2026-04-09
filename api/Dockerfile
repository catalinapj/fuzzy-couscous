# Start from the official Python 3.13 slim image (~150MB instead of ~1GB full)
FROM python:3.13-slim

# Set the working directory inside the container
WORKDIR /app

# Install system dependencies needed by psycopg2-binary
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Install Poetry (the dependency manager your project uses)
RUN pip install --no-cache-dir poetry

# Copy only the dependency files first (so Docker can cache this layer)
COPY pyproject.toml poetry.lock ./

# Install production dependencies only (no dev tools like pytest)
# --no-root: don't install our own project as a package
# --only main: skip dev dependencies
RUN poetry config virtualenvs.create false \
    && poetry install --no-root --only main

# Now copy the rest of the application code
COPY . .

# Tell Docker this container will listen on port 8080
EXPOSE 8080

# Run migrations then start the API server
CMD ["sh", "-c", "alembic upgrade head && uvicorn main:app --host 0.0.0.0 --port 8080"]

FROM python:3.11-slim

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1

# Install dependencies first (for caching)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy proto files and generate stubs
COPY proto ./proto
COPY generate_proto.py .
RUN python generate_proto.py

# Copy application code
COPY app ./app

# Create data directory for ChromaDB persistence
RUN mkdir -p /app/data/chroma

EXPOSE 50052

CMD ["python", "-m", "app.server"]

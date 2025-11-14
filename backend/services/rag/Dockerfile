# syntax=docker/dockerfile:1
FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

# 1) install deps first for better caching
COPY requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r /app/requirements.txt

# 2) copy the entire service (both app/ and rag/)
COPY . /app

# 3) make /app importable as a package root
ENV PYTHONPATH=/app

EXPOSE 8081
CMD ["uvicorn", "app.server:app", "--host", "0.0.0.0", "--port", "8081"]

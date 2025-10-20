FROM python:3.11-slim
WORKDIR /app
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1
COPY app ./app

RUN pip install --no-cache-dir fastapi uvicorn
EXPOSE 8082
CMD ["uvicorn", "app.server:app", "--host", "0.0.0.0", "--port", "8082"]

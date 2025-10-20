FROM python:3.11-slim
WORKDIR /app
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1
COPY app ./app
COPY requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt
EXPOSE 8081
CMD ["uvicorn", "app.server:app", "--host", "0.0.0.0", "--port", "8081"]

#!/bin/bash

ollama serve &

echo "Waiting for Ollama to start..."
until ollama list >/dev/null 2>&1; do
    sleep 1
done
echo "Ollama is ready!"

echo "Pulling nomic-embed-text model..."
ollama pull nomic-embed-text

echo "Pulling llama3.2 model..."
ollama pull llama3.2

echo "All models pulled successfully!"

wait
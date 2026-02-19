#!/bin/bash
read -p "Question: " question
curl -s -X POST http://localhost:8080/api/rag/query/ \
  -H "Content-Type: application/json" \
  -d "{\"question\": \"$question\", \"max_results\": 5}" | jq .

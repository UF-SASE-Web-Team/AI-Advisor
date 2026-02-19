#!/bin/bash
read -p "Question: " question
curl -s -X POST http://localhost:8080/api/rag/query/ \
  -H "Content-Type: application/json" \
  -d "{\"question\": \"$question\", \"max_results\": 10}" | jq '.sources[] | "\(.relevance_score | . * 100 | round / 100) \(.course_code) - \(.course_name)"'

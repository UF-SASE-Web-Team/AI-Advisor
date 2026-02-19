docker compose stop rag && docker compose rm -f rag && docker compose build rag && docker volume rm backend_rag-chroma-data && docker compose up rag


import logging
import os
from typing import Any

import ollama
from openai import OpenAI
from supabase import create_client

from app.course_loader import Course

logger = logging.getLogger(__name__)


class SupabaseVectorStore:
    def __init__(
        self,
        ollama_host: str = "http://localhost:11434",
        embedding_model: str = "nomic-embed-text",
        embedding_provider: str = "ollama",  # "ollama" or "openai"
        openai_api_key: str | None = None,
        supabase_url: str | None = None,
        supabase_key: str | None = None,
        expected_embedding_dim: int | None = None,
    ):
        self.embedding_model = embedding_model
        self.embedding_provider = embedding_provider.lower()

        if self.embedding_provider == "openai":
            api_key = openai_api_key or os.getenv("OPENAI_API_KEY")
            if not api_key:
                raise ValueError("OPENAI_API_KEY is required when using OpenAI embeddings")
            self.openai_client = OpenAI(api_key=api_key)
            logger.info(f"Using OpenAI embeddings with model: {embedding_model}")
        else:
            self.ollama_host = ollama_host
            self.ollama_client = ollama.Client(host=ollama_host)
            logger.info(f"Using Ollama embeddings with model: {embedding_model}")

        url = supabase_url or os.getenv("SUPABASE_URL")
        if not url:
            raise ValueError("SUPABASE_URL is required when using Supabase vector store")

        key = (
            supabase_key
            or os.getenv("SUPABASE_SERVICE_ROLE_KEY")
            or os.getenv("SUPABASE_ANON_KEY")
        )
        if not key:
            raise ValueError("SUPABASE_SERVICE_ROLE_KEY or SUPABASE_ANON_KEY is required")

        self.sb = create_client(url, key)
        self.expected_embedding_dim = (
            expected_embedding_dim
            if expected_embedding_dim is not None
            else int(os.getenv("SUPABASE_EMBEDDING_DIM", "1536"))
        )

    def _get_embedding(self, text: str) -> list[float]:
        if self.embedding_provider == "openai":
            response = self.openai_client.embeddings.create(
                model=self.embedding_model,
                input=text,
            )
            return response.data[0].embedding
        response = self.ollama_client.embed(
            model=self.embedding_model,
            input=text,
        )
        return response["embeddings"][0]

    def _ensure_embedding_dim(self, embedding: list[float]) -> None:
        if self.expected_embedding_dim and len(embedding) != self.expected_embedding_dim:
            raise ValueError(
                f"Embedding dim {len(embedding)} does not match Supabase schema "
                f"({self.expected_embedding_dim}). Update SUPABASE_EMBEDDING_DIM or "
                "use a compatible embedding model."
            )

    def _count_existing(self) -> int | None:
        try:
            res = self.sb.table("courses").select("id", count="exact").limit(1).execute()
            return res.count
        except Exception as e:
            logger.warning(f"Could not check existing course count: {e}")
            return None

    def add_courses(self, courses: list[Course]) -> int:
        if not courses:
            return 0

        existing = self._count_existing()
        if existing and existing > 0:
            logger.info("Supabase courses table already has data; skipping ingestion")
            return existing

        seen_codes = set()
        unique_courses = []
        for course in courses:
            if course.code not in seen_codes:
                seen_codes.add(course.code)
                unique_courses.append(course)

        logger.info(f"Deduplicated {len(courses)} courses to {len(unique_courses)} unique courses")

        rows: list[dict[str, Any]] = []
        batch_size = 50
        catalog = os.getenv("COURSE_CATALOG", "2025-2026")
        program = os.getenv("COURSE_PROGRAM", "CS")
        campus = os.getenv("COURSE_CAMPUS", "UF")
        level = os.getenv("COURSE_LEVEL", "undergrad")
        offered_terms = os.getenv("COURSE_OFFERED_TERMS", "fall,spring").split(",")

        for i in range(0, len(unique_courses), batch_size):
            batch = unique_courses[i:i + batch_size]
            logger.info(f"Processing batch {i // batch_size + 1}/{(len(unique_courses) + batch_size - 1) // batch_size}")

            for course in batch:
                doc_text = course.to_document()
                embedding = self._get_embedding(doc_text)
                self._ensure_embedding_dim(embedding)
                rows.append({
                    "code": course.code,
                    "title": course.name,
                    "description": course.description or "",
                    "credits": course.credits or 3,
                    "level": level,
                    "tags": [],
                    "prerequisites": [],
                    "offered_terms": offered_terms,
                    "program": program,
                    "campus": campus,
                    "catalog": catalog,
                    "embedding": embedding,
                })

        if not rows:
            return 0

        self.sb.table("courses").insert(rows).execute()
        logger.info(f"Inserted {len(rows)} courses into Supabase")
        return len(rows)

    def search(self, query: str, n_results: int = 5) -> list[dict]:
        query_embedding = self._get_embedding(query)
        self._ensure_embedding_dim(query_embedding)

        res = self.sb.rpc(
            "course_search",
            {
                "query_vec": query_embedding,
                "match_count": n_results,
                "jfilter": {},
            },
        ).execute()

        results = res.data or []
        search_results = []
        for item in results:
            code = item.get("code", "")
            title = item.get("title", "")
            description = item.get("description", "")
            content = f"{code} - {title}\n{description}".strip()
            search_results.append({
                "content": content,
                "course_code": code,
                "course_name": title,
                "relevance_score": item.get("score", 0.0),
            })

        return search_results

    def clear(self):
        if os.getenv("SUPABASE_ALLOW_CLEAR", "false").lower() != "true":
            logger.warning("SUPABASE_ALLOW_CLEAR not set; refusing to clear Supabase tables")
            return
        self.sb.table("courses").delete().neq("id", "00000000-0000-0000-0000-000000000000").execute()
        logger.info("Supabase courses table cleared")

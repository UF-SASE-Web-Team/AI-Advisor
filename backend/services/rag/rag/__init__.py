"""RAG package initializer.

Expose top-level modules for the retrieval-augmented generation service.
This file is intentionally minimal — it only marks the directory as a package
so Docker / Python imports succeed.
"""

__all__ = [
    "chunkers",
    "embeddings",
    "supabase_store",
    "retrieval",
    "generation",
    "rules",
]

__version__ = "0.1.0"

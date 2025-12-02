import os
from supabase import create_client

SUPABASE_URL = os.environ["SUPABASE_URL"]


SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.environ["SUPABASE_ANON_KEY"]

sb = create_client(SUPABASE_URL, SUPABASE_KEY)

def upsert_chunks(doc_id: str, chunks: list[str], embeddings: list[list[float]], meta: dict):
    rows = [{"doc_id":doc_id,"chunk_index":i,"content":t,"metadata":meta,"embedding":e}
            for i,(t,e) in enumerate(zip(chunks, embeddings))]
    sb.table("rag_chunks").insert(rows).execute()

def search_chunks(query_vec: list[float], k=6, jfilter: dict | None=None):
    res = sb.rpc("rag_search_cosine", {"query_vec": query_vec, "match_count": k, "jfilter": jfilter or {}}).execute()
    return res.data

def upsert_courses(rows: list[dict]):
    sb.table("courses").insert(rows).execute()

def search_courses(query_vec: list[float], k=12, jfilter: dict | None=None):
    res = sb.rpc("course_search", {"query_vec": query_vec, "match_count": k, "jfilter": jfilter or {}}).execute()
    return res.data

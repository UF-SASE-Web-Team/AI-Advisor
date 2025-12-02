from .embeddings import embed_texts
from .supabase_store import search_chunks, search_courses

def retrieve_policy(query: str, k=6, filt: dict | None=None):
    qvec = embed_texts([query])[0]
    return search_chunks(qvec, k=k, jfilter=filt or {})

def retrieve_courses_by_interest(interest_text: str, k=12, filt: dict | None=None):
    qvec = embed_texts([interest_text])[0]
    return search_courses(qvec, k=k, jfilter=filt or {})

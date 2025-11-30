from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

from rag.chunkers import iter_sources, split_plain_text
from rag.embeddings import embed_texts
from rag.supabase_store import upsert_chunks, upsert_courses
from rag.retrieval import retrieve_policy, retrieve_courses_by_interest
from rag.generation import answer_with_context, recommend_rationale
from rag.rules import has_prereqs, score_course

app = FastAPI(title="AI-ADVISOR (RAG)")

class IngestDocs(BaseModel):
    paths: List[str]
    metadata: Dict[str, Any] = Field(default_factory=dict)

class CatalogItem(BaseModel):
    code: str
    title: str
    description: str
    credits: int = 3
    level: str = "undergrad"
    tags: List[str] = []
    prerequisites: List[Dict[str, List[str]]] = []
    offered_terms: List[str] = ["fall","spring"]
    program: str = "CS"
    campus: str = "main"
    catalog: str = "2024-2025"

class IngestCatalog(BaseModel):
    items: List[CatalogItem]

class AskReq(BaseModel):
    question: str
    k: int = 6
    filter: Dict[str, Any] = Field(default_factory=dict)

class ProfileReq(BaseModel):
    program: str = "CS"
    campus: str = "main"
    catalog: str = "2024-2025"
    level: str = "undergrad"
    term: str = "fall"
    completed: List[str] = []
    interests: List[str] = []
    max_credits: int = 15

@app.get("/health")
def health(): return {"status":"ok"}

@app.post("/ingest")
def ingest_docs(req: IngestDocs):
    count = 0
    for src in iter_sources(req.paths):
        chunks = split_plain_text(src["text"])
        vecs = embed_texts(chunks)
        meta = {**req.metadata}
        upsert_chunks(src["doc_id"], chunks, vecs, meta)
        count += len(chunks)
    return {"status":"ingested","chunks":count}

@app.post("/ingest/catalog")
def ingest_catalog(req: IngestCatalog):
    # embed each course description
    embs = embed_texts([i.description for i in req.items])
    rows = []
    for i, emb in zip(req.items, embs):
        rows.append({**i.model_dump(), "embedding": emb})
    upsert_courses(rows)
    return {"status":"catalog_ingested","courses":len(rows)}

@app.post("/ask")
def ask(req: AskReq):
    hits = retrieve_policy(req.question, k=req.k, filt=req.filter or {})
    if not hits: raise HTTPException(404, "No relevant context found")
    answer = answer_with_context(req.question, hits)
    return {"answer": answer, "sources": [{"doc_id":h["doc_id"],"chunk_index":h["chunk_index"],"score":h["score"]} for h in hits]}

@app.post("/recommend")
def recommend(profile: ProfileReq):
    # 1) semantic prefilter on interests
    interest_text = ", ".join(profile.interests) or "computer science core pathways"
    filt = {"program": profile.program, "campus": profile.campus, "catalog": profile.catalog, "level": profile.level}
    candidates = retrieve_courses_by_interest(interest_text, k=30, filt=filt)

    completed = set([c.strip().upper() for c in profile.completed])
    # 2) filter out taken courses & enforce prereqs
    viable = []
    for c in candidates:
        if c["code"].upper() in completed: continue
        if not has_prereqs(completed, c.get("prerequisites")): continue
        viable.append(c)

    # 3) score + shortlist to target credits
    for v in viable:
        v["_score"] = score_course(v, profile.model_dump())

    viable.sort(key=lambda x: x["_score"], reverse=True)

    total, pick = 0, []
    for v in viable:
        if total + (v.get("credits") or 3) <= profile.max_credits:
            pick.append(v); total += v.get("credits") or 3
        if total >= profile.max_credits - 1: break

    # 4) explanation via LLM
    rationale = recommend_rationale(profile.model_dump(), pick)

    return {
        "term": profile.term,
        "max_credits": profile.max_credits,
        "recommended": [{"code":x["code"],"title":x["title"],"credits":x["credits"],"score":round(x["_score"],3)} for x in pick],
        "explanation": rationale
    }
import os
from app.grpc_server import serve


def main():
    port = int(os.environ.get("GRPC_PORT", "50052"))
    serve(port=port)


if __name__ == "__main__":
    main()

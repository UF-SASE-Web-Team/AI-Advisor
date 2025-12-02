import os
import requests
from statistics import mean

HF_TOKEN = os.getenv("HF_TOKEN")
EMBED_MODEL = os.getenv("HF_EMBED_MODEL", "sentence-transformers/all-MiniLM-L6-v2")

API = f"https://api-inference.huggingface.co/pipeline/feature-extraction/{EMBED_MODEL}"
HEADERS = {"Authorization": f"Bearer {HF_TOKEN}"} if HF_TOKEN else {}

def _flatten(vec):
    """Mean-pool if HF returns token embeddings."""
    if not vec:
        return []
    if isinstance(vec[0], list):  
        dim = len(vec[0])
        return [mean(t[i] for t in vec) for i in range(dim)]
    return vec

def embed_texts(texts: list[str]) -> list[list[float]]:
    out = []
    for t in texts:
        resp = requests.post(
            API,
            headers=HEADERS,
            json={"inputs": t, "options": {"wait_for_model": True}}
        )
        resp.raise_for_status()
        vec = resp.json()
        out.append(_flatten(vec))
    return out

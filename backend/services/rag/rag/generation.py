import os
import requests

HF_TOKEN = os.getenv("HF_TOKEN")
GEN_MODEL = os.getenv("HF_GEN_MODEL", "mistralai/Mistral-7B-Instruct-v0.2")

API = f"https://api-inference.huggingface.co/models/{GEN_MODEL}"
HEADERS = {"Authorization": f"Bearer {HF_TOKEN}"} if HF_TOKEN else {}

def build_prompt(question: str, contexts: list[dict]) -> str:
    ctx = "\n\n---\n\n".join([c["content"] for c in contexts])
    return (
        "You are a helpful academic advisor. Answer ONLY using the context. "
        "If the answer isn't in the context, say you don't know.\n\n"
        f"Question: {question}\n\nContext:\n{ctx}\n\nAnswer:"
    )

def generate_answer(question: str, contexts: list[dict]) -> str:
    payload = {
        "inputs": build_prompt(question, contexts),
        "parameters": {"max_new_tokens": 300, "temperature": 0.2},
        "options": {"wait_for_model": True}
    }
    resp = requests.post(API, headers=HEADERS, json=payload)
    resp.raise_for_status()
    data = resp.json()

    if isinstance(data, list) and data and "generated_text" in data[0]:
        return data[0]["generated_text"].strip()


    if isinstance(data, dict) and "generated_text" in data:
        return data["generated_text"].strip()

    return str(data).strip()

import json, re
from pathlib import Path
from typing import List, Dict
from .embeddings import embed_texts
from .supabase_store import upsert_courses

def parse_prereqs(prereq_text: str) -> List[Dict]:
    if not prereq_text: return []
    courses = re.findall(r'[A-Z]{2,4}\s?\d{3,4}', prereq_text)
    courses = [" ".join([c[:3], c[3:]]) if len(c.replace(" ", ""))==7 else c for c in courses]
    if not courses: return []
    if " or " in prereq_text.lower() and " and " not in prereq_text.lower():
        return [{"any_of": sorted(set(courses))}]
    if " and " in prereq_text.lower() and " or " not in prereq_text.lower():
        return [{"all_of": sorted(set(courses))}]
    return [{"any_of": sorted(set(courses))}]

def infer_tags(title: str, desc: str) -> List[str]:
    blob = f"{title} {desc}".lower()
    tags = []
    for kw, tag in [
        ("data structure", "data-structures"),
        ("algorithm", "algorithms"),
        ("systems", "systems"),
        ("machine learning", "ml"),
        ("ai", "ai"),
        ("software", "software"),
        ("web", "web"),
        ("security", "security"),
        ("database", "databases"),
    ]:
        if kw in blob:
            tags.append(tag)
    return sorted(list(set(tags)))

def normalize_code(code: str) -> str:
    code = code.strip().upper().replace("-", " ")
    if len(code.replace(" ", "")) >= 7 and " " not in code:
        return f"{code[:3]} {code[3:]}"
    return code

def load_oneuf(path: str) -> List[Dict]:
    data = json.loads(Path(path).read_text(encoding="utf-8"))
    items = data.get("items", data) if isinstance(data, dict) else data
    rows = []
    for r in items:
        code = normalize_code(r.get("code") or r.get("course_code") or "")
        title = r.get("title") or r.get("name") or ""
        desc = r.get("description") or ""
        credits = int(r.get("credits") or 3)
        level = (r.get("level") or "undergrad").lower()
        terms = r.get("terms") or r.get("offered_terms") or ["fall","spring"]
        prereq_text = r.get("prereq_text") or r.get("prerequisites") or ""

        rows.append({
            "code": code,
            "title": title,
            "description": desc,
            "credits": credits,
            "level": level,
            "tags": infer_tags(title, desc),
            "prerequisites": parse_prereqs(prereq_text),
            "offered_terms": terms,
            "program": "CS",
            "campus": "UF",
            "catalog": "2025-2026",
        })
    return rows

def ingest_oneuf_json(json_path: str):
    rows = load_oneuf(json_path)
    B = 100 
    for i in range(0, len(rows), B):
        batch = rows[i:i+B]
        embs = embed_texts([b["description"] for b in batch])
        for b, e in zip(batch, embs):
            b["embedding"] = e
        upsert_courses(batch)
    return len(rows)

if __name__ == "__main__":
    import sys, os
    path = sys.argv[1] if len(sys.argv) > 1 else "../../scripts/s26.json"
    n = ingest_oneuf_json(path)
    print(f"Inserted {n} courses from {path}")

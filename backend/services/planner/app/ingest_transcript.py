import os
import json
from pathlib import Path
from supabase import create_client

SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.environ["SUPABASE_ANON_KEY"]

sb = create_client(SUPABASE_URL, SUPABASE_KEY)

def load_json(path: str, id: str):
    data = json.loads(Path(path).read_text(encoding="utf-8"))
    rows = []

    for term in data.keys():
        for class_taken in data[term]:
            rows.append({
                "id": id,
                "term": term,
                "course": class_taken["course"],
                "name": class_taken["name"],
                "grade": class_taken["grade"],
                "credit_attempted": class_taken["credit_attempted"],
                "earned_hours": class_taken["earned_hours"],
                "carried_hours": class_taken["carried_hours"],
            })
    return rows

def upload_transcript(rows: list[dict]):
    response = sb.table("transcript").insert(rows).execute()
    print(response)

# if __name__ == "__main__":
#     load_json("uf-transcript-spring-2026.pdf", )
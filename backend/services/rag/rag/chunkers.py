import re
from typing import Iterable, Dict, List
from pathlib import Path

def split_plain_text(text: str, max_tokens=400, overlap_tokens=40) -> List[str]:
    sents = re.split(r'(?<=[.!?])\s+', text.strip())
    chunks, cur, cur_len = [], [], 0
    for s in sents:
        tok = max(1, len(s)//4)
        if cur_len + tok > max_tokens and cur:
            chunks.append(" ".join(cur))
            carry, ct = [], 0
            for ss in reversed(cur):
                t = max(1, len(ss)//4)
                if ct + t <= overlap_tokens: carry.insert(0, ss); ct += t
                else: break
            cur, cur_len = carry + [s], sum(max(1,len(x)//4) for x in carry+[s])
        else:
            cur.append(s); cur_len += tok
    if cur: chunks.append(" ".join(cur))
    return chunks

def iter_sources(paths: Iterable[str]) -> Iterable[Dict]:
    for p in map(Path, paths):
        if p.suffix.lower() in {".txt",".md"}:
            yield {"doc_id": str(p), "text": p.read_text(encoding="utf-8"), "meta": {}}

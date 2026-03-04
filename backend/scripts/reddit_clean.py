import json
import re
import os

import emoji
from supabase import create_client, Client
from dotenv import load_dotenv
load_dotenv()

POST_DATA_PATH = "postData.json"
MAX_POST_LENGTH = 2000     
MAX_COMMENT_LENGTH = 1000   
MIN_COMMENT_SCORE = 0

SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")

def remove_emojis(text):
    return emoji.replace_emoji(text, replace="")


def remove_links(text):
    text = re.sub(r'https?://\S+', '', text)
    text = re.sub(r'www\.\S+', '', text)
    return text


def remove_reddit_formatting(text):
    text = re.sub(r'\*\*(.+?)\*\*', r'\1', text)
    text = re.sub(r'\*(.+?)\*', r'\1', text)
    text = re.sub(r'~~(.+?)~~', r'\1', text)
    text = re.sub(r'^>\s?', '', text, flags=re.MULTILINE)
    text = re.sub(r'\[([^\]]+)\]\([^\)]+\)', r'\1', text)
    return text


def remove_junk_text(text):
    junk_patterns = [
        r'(?i)edit\s*\d*\s*:.*?(?=\n|$)',     
        r'(?i)tl;?\s*dr\s*:?.*?(?=\n|$)',      
        r'(?i)thanks for the gold.*?(?=\n|$)',   
        r'(?i)thanks for the award.*?(?=\n|$)',
        r'(?i)obligatory.*?(?=\n|$)',            
        r'\^+\S+',                            
        r'&amp;', 
        r'&gt;',
        r'&lt;',
        r'&nbsp;',
    ]
    for pattern in junk_patterns:
        text = re.sub(pattern, '', text)
    return text


def fix_unicode(text):
    replacements = {
        '\u2019': "'",  
        '\u2018': "'",   
        '\u201c': '"',   
        '\u201d': '"',   
        '\u2013': '-',  
        '\u2014': '-',  
        '\u2026': '...', 
        '\u00a0': ' ',   
        '\u200b': '',   
    }
    for old, new in replacements.items():
        text = text.replace(old, new)
    return text


def normalize_whitespace(text):
    text = text.replace('\t', ' ')
    text = re.sub(r' +', ' ', text)
    text = re.sub(r'\n{3,}', '\n\n', text)
    lines = [line.strip() for line in text.split('\n')]
    text = '\n'.join(lines)
    return text.strip()


def trim_text(text, max_length):
    if len(text) <= max_length:
        return text
    trimmed = text[:max_length]
    last_sentence_end = max(
        trimmed.rfind('. '),
        trimmed.rfind('? '),
        trimmed.rfind('! '),
        trimmed.rfind('.\n'),
    )

    if last_sentence_end > max_length * 0.5:
        return trimmed[:last_sentence_end + 1].strip() + " [trimmed]"
    else:
        return trimmed.strip() + "... [trimmed]"


def clean_text(text, max_length=None):
    if not text or not isinstance(text, str):
        return ""

    text = fix_unicode(text)
    text = remove_links(text)
    text = remove_emojis(text)
    text = remove_reddit_formatting(text)
    text = remove_junk_text(text)
    text = normalize_whitespace(text)

    if max_length:
        text = trim_text(text, max_length)

    return text

def is_useful_comment(comment):
    text = comment.get("text", "")
    score = comment.get("score", 0)

    if text.lower().strip() in ["[deleted]", "[removed]", ""]:
        return False

    cleaned = clean_text(text)
    if len(cleaned) < 15:
        return False

    if score < MIN_COMMENT_SCORE:
        return False

    return True


def is_useful_post(post):
    title = post.get("title", "")
    post_text = post.get("postText", "")

    if not title.strip() and not post_text.strip():
        return False

    return True

def is_relevant_to_academics(post):
    title = post.get("title", "").lower()
    post_text = post.get("postText", "").lower()
    professor = post.get("professor", "").lower()
    combined_text = f"{title} {post_text}"

    academic_keywords = [

        "professor", "prof ", "prof.", "instructor", "teacher", "lecturer",
        "class", "course", "lecture", "lab section", "recitation",
        "syllabus", "textbook", "assignment", "homework", "exam",
        "midterm", "final exam", "quiz", "gpa", "grade", "grading",
        "credit", "credits", "prerequisite", "prereq", "dr.", "group project",

        "schedule", "semester", "fall 20", "spring 20", "summer 20",
        "course load", "workload", "doable", "manageable",
        "taking together", "rate my schedule",

        "major", "minor", "elective", "tech elective",
        "computer science", "computer engineering", "data science",
        "cise", " cs ", " ce ", " cpe ",

        "advice", "recommend", "recommendation", "thoughts on",
        "opinions on", "experience with", "review", "how is",
        "how was", "anyone taken", "has anyone", "should i take",

        "data structures", "algorithms", "operating system", "operating systems",
        "discrete", "software engineering", "programming",
        "machine learning", "artificial intelligence",
        "database", "networks", "security",
        "calculus", "physics", "linear algebra",
    ]

    has_course_code = bool(re.search(r'\b[A-Z]{2,4}\s?\d{4}\b', f"{title} {post_text}", re.IGNORECASE))
    if has_course_code:
        return True

    for keyword in academic_keywords:
        if keyword in combined_text:
            return True

    return False


def is_useful_post(post):
    title = post.get("title", "")
    post_text = post.get("postText", "")

    if not title.strip() and not post_text.strip():
        return False

    if not is_relevant_to_academics(post):
        return False

    return True

def process_posts(raw_data):
    cleaned_posts = []
    filtered_out = []
    skipped_not_useful = 0
    skipped_no_comments = 0
    skipped_not_relevant = 0
    total_comments = 0
    kept_comments = 0

    for post_id, post in raw_data.items():
        if not is_useful_post(post):
            reason = "off-topic / not academic" if post.get("title", "").strip() else "empty"
            filtered_out.append({"id": post_id, "title": post.get("title", ""), "reason": reason})
            skipped_not_useful += 1
            continue

        cleaned_post = {
            "reddit_post_id": post_id,
            "professor": post.get("professor", "").strip(),
            "title": clean_text(post.get("title", "")),
            "url": post.get("url", ""),
            "post_text": clean_text(post.get("postText", ""), max_length=MAX_POST_LENGTH),
            "comments": []
        }

        raw_comments = post.get("comments", [])
        for comment in raw_comments:
            total_comments += 1

            if not is_useful_comment(comment):
                continue

            cleaned_comment = {
                "author": comment.get("author", "anonymous"),
                "text": clean_text(comment.get("text", ""), max_length=MAX_COMMENT_LENGTH),
                "score": comment.get("score", 0)
            }
            cleaned_post["comments"].append(cleaned_comment)
            kept_comments += 1

        cleaned_post["comments"].sort(key=lambda c: c["score"], reverse=True)
        if len(cleaned_post["comments"]) == 0:
            filtered_out.append({"id": post_id, "title": post.get("title", ""), "reason": "no useful comments"})
            skipped_no_comments += 1
            continue

        cleaned_posts.append(cleaned_post)

    with open("filteredOut.json", "w", encoding="utf-8") as f:
        json.dump(filtered_out, f, indent=2, ensure_ascii=False)
    
    return cleaned_posts

def upload_to_supabase(cleaned_posts):
    if not SUPABASE_URL or not SUPABASE_KEY:
        return False

    try:
        supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
        uploaded = 0
        errors = 0

        for post in cleaned_posts:
            try:
                comments_text = "\n---\n".join(
                    f"[score: {c['score']}] {c['text']}"
                    for c in post["comments"]
                )

                row = {
                    "professor": post["professor"],
                    "title": post["title"],
                    "url": post["url"],
                    "post_text": post["post_text"],
                    "comments": comments_text,
                    "reddit_post_id": post["reddit_post_id"],
                }

                result = supabase.table("professor").upsert(row, on_conflict="reddit_post_id").execute()
                uploaded += 1

            except Exception as e:
                errors += 1
        return True

    except Exception as e:
        return False

if __name__ == "__main__":
    with open(POST_DATA_PATH, "r", encoding="utf-8") as f:
        raw_data = json.load(f)

    cleaned_posts = process_posts(raw_data)

    with open("cleanedData.json", "w", encoding="utf-8") as f:
        json.dump(cleaned_posts, f, indent=2, ensure_ascii=False)

    upload_to_supabase(cleaned_posts)
    print("\n OMG IT WORKED connie says go to cleanedData.json now")
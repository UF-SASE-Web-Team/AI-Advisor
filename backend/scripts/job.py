# step2_reprocess_special_topics.py
import requests
import io
import pypdf
from google import genai
import json
import re
import time
from urllib.parse import urljoin, unquote
from pathlib import Path

client = genai.Client(api_key="AIzaSyATKIjotvWTerrF2WaJwE09Hll7DTSOd-s")

OUTPUT_FILE = "enriched_syllabi_full.json"
TITLES_FILE = "special_topics_titles.json"

def load_existing_courses():
    """Load the regular courses we already have"""
    with open(OUTPUT_FILE, 'r') as f:
        return json.load(f)

def load_titles():
    """Load special topics titles"""
    with open(TITLES_FILE, 'r') as f:
        return json.load(f)

def save_progress(courses):
    """Save all courses sorted by unique_key"""
    courses.sort(key=lambda x: x['unique_key'])
    with open(OUTPUT_FILE, 'w') as f:
        json.dump(courses, f, indent=2)

def download_full_pdf_text(pdf_url):
    response = requests.get(pdf_url, timeout=30)
    pdf_io_bytes = io.BytesIO(response.content)
    pdf = pypdf.PdfReader(pdf_io_bytes)
    text_list = [page.extract_text() for page in pdf.pages if page.extract_text()]
    return "\n".join(text_list)

def extract_topics_with_gemini(syllabus_text, course_code):
    """Extract topics with anti-hallucination measures"""
    prompt = f"""Extract technical course content keywords THAT APPEAR IN THIS SYLLABUS.

CRITICAL RULES:
- Only extract terms EXPLICITLY MENTIONED in the text below
- DO NOT generate related topics
- DO NOT infer topics  
- DO NOT expand on patterns

EXCLUDE:
- Grading policies, rubrics, grade scales
- Attendance policies, deadlines, dates
- Office hours, contact information
- Academic integrity, honor code
- Course logistics, materials required
- Exam schedules, homework policies
- Generic terms: "project", "homework", "exam", "quiz", "test"

OUTPUT RULES:
- One keyword per line
- No numbering
- No explanations
- Maximum 80 keywords total

SYLLABUS TEXT:
{syllabus_text}
"""
    attempt = 0
    while True:
        attempt += 1
        try:
            response = client.models.generate_content(
                model="gemini-2.5-flash-lite",
                contents=prompt
            )
            content = response.text.strip()
            topics = []
            for line in content.split('\n'):
                line = line.strip()
                if not line:
                    continue
                
                skip_phrases = ['here are', 'extracted', 'keywords', 'note that',
                              'from the syllabus', 'technical course', 'following',
                              'overlap', 'related', "i've tried"]
                if any(phrase in line.lower() for phrase in skip_phrases):
                    continue
                
                line = line.lstrip('0123456789.-*•) ')
                
                if line.lower().startswith('ai for ') and len(topics) > 20:
                    continue
                
                if len(line) > 50:
                    continue
                
                if line:
                    topics.append(line.lower())
                    
                if len(topics) >= 80:
                    break
            
            if len(topics) > 80:
                print(f"      ⚠ Truncated {len(topics)} → 80 topics")
                topics = topics[:80]
            
            return topics
            
        except Exception as e:
            error_str = str(e)
            if '429' in error_str or 'RESOURCE_EXHAUSTED' in error_str or '503' in error_str or 'UNAVAILABLE' in error_str:
                match = re.search(r'retry in ([\d.]+)s', error_str)
                wait_time = float(match.group(1)) if match else 60
                error_type = "Rate limited" if '429' in error_str else "Server busy"
                print(f"      {error_type}. Waiting {wait_time:.0f}s (attempt {attempt})...")
                time.sleep(wait_time + 5)
                continue
            else:
                print(f"      Fatal error: {e}")
                return []

print("="*80)
print("STEP 2: REPROCESS SPECIAL TOPICS WITH TITLES")
print("="*80)

# Load existing data
courses = load_existing_courses()
print(f"\nLoaded {len(courses)} regular courses")

# Load special topics with titles
special_topics = load_titles()
print(f"Loaded {len(special_topics)} special topics with titles")

# Track which ones we've already processed
processed_keys = set(c['unique_key'] for c in courses)
print(f"Already processed: {len(processed_keys)}")

remaining = [st for st in special_topics if st['unique_key'] not in processed_keys]
print(f"Remaining to process: {len(remaining)}")

if len(remaining) == 0:
    print("\n✓ All special topics already processed!")
    exit(0)

# Estimate
print(f"\nEstimated cost: ${len(remaining) * 0.0002:.4f}")
print(f"Estimated time: {len(remaining) * 10 / 60:.1f} minutes\n")

input("Press Enter to start, or Ctrl+C to cancel...")

start_time = time.time()
success_count = 0
fail_count = 0

for i, special_topic in enumerate(remaining, 1):
    code = special_topic['code']
    title = special_topic['title']
    unique_key = special_topic['unique_key']
    pdf_url = special_topic['pdf_url']
    filename = pdf_url.split('/')[-1][:60]
    
    print(f"\n[{i}/{len(remaining)}] {filename}")
    print(f"  ✓ Code: {code}")
    print(f"  ✓ Title: {title}")
    print(f"  ✓ Key: {unique_key}")
    
    try:
        text = download_full_pdf_text(pdf_url)
        print(f"  ✓ Text: {len(text)} chars")
    except Exception as e:
        print(f"  ✗ PDF failed: {e}")
        fail_count += 1
        continue
    
    if len(text) < 100:
        print(f"  ✗ Too short")
        fail_count += 1
        continue
    
    print(f"  ⏳ Extracting topics...")
    topics = extract_topics_with_gemini(text, code)
    
    if topics:
        print(f"  ✓ {len(topics)} topics")
        
        # Add to courses list
        courses.append({
            'code': code,
            'title': title,
            'unique_key': unique_key,
            'topics': topics
        })
        
        # Save progress
        save_progress(courses)
        processed_keys.add(unique_key)
        
        success_count += 1
    else:
        print(f"  ✗ No topics")
        fail_count += 1
    
    # Progress update every 10
    if i % 10 == 0:
        elapsed = time.time() - start_time
        rate = i / (elapsed / 60)
        remaining_count = len(remaining) - i
        eta_minutes = remaining_count / rate
        print(f"\n  📊 Progress: {success_count} success, {fail_count} failed")
        print(f"  ⏱  Rate: {rate:.1f} courses/min | ETA: {eta_minutes:.0f} min")
    
    time.sleep(6)

elapsed = time.time() - start_time
print(f"\n{'='*80}")
print("COMPLETE")
print("="*80)
print(f"Success: {success_count}")
print(f"Failed: {fail_count}")
print(f"Total courses now: {len(courses)}")
print(f"  - Regular courses: {len([c for c in courses if c['title'] is None])}")
print(f"  - Special topics: {len([c for c in courses if c['title'] is not None])}")
print(f"Total time: {elapsed/60:.1f} minutes ({elapsed/3600:.1f} hours)")
print(f"Saved to: {OUTPUT_FILE}")
print("="*80)
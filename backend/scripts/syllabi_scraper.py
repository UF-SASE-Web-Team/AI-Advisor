import requests
import io
import pypdf
from google import genai
import json
import re
import time
from urllib.parse import urljoin, unquote
from pathlib import Path

# Configure Gemini
client = genai.Client(api_key="AIzaSyATKIjotvWTerrF2WaJwE09Hll7DTSOd-s")

# Output file
OUTPUT_FILE = "enriched_syllabi_full.json"

def load_progress():
    """Load already processed codes from results file"""
    if Path(OUTPUT_FILE).exists():
        with open(OUTPUT_FILE, 'r') as f:
            results = json.load(f)
            return set(r['code'] for r in results)
    return set()

def append_result(result):
    """Append result and maintain alphabetical order"""
    results = []
    if Path(OUTPUT_FILE).exists():
        with open(OUTPUT_FILE, 'r') as f:
            results = json.load(f)
    results.append(result)
    results.sort(key=lambda x: x['code'])
    with open(OUTPUT_FILE, 'w') as f:
        json.dump(results, f, indent=2)

def find_pdfs_on_page(url):
    try:
        response = requests.get(url, timeout=30)
        html = response.text
        pdf_pattern = r'href=["\']([^"\']*\.pdf[^"\']*)["\']'
        pdf_links = re.findall(pdf_pattern, html, re.IGNORECASE)
        full_links = [urljoin(url, link) for link in pdf_links]
        return list(set(full_links))
    except:
        return []

def extract_from_filename(filename):
    """Extract course code - strip common prefixes"""
    # URL decode first (converts %20 to space, %23 to #, etc.)
    filename = unquote(filename)
    
    filename_cleaned = filename
    for prefix in ['Syllabus', 'syllabus', 'SYLLABUS']:
        filename_cleaned = filename_cleaned.replace(prefix, '')
    
    # Pattern: EXACTLY 3 letters, optional separator, 4 digits, optional C/L ONLY
    pattern = r'([A-Z]{3})[\s\-_]?(\d{4}[CL]?)(?![0-9])'
    matches = re.findall(pattern, filename_cleaned, re.IGNORECASE)
    
    if matches:
        valid = []
        for m in matches:
            dept = m[0].upper()
            number = m[1].upper()
            
            # Validate number format
            if len(number) < 4 or not number[:4].isdigit():
                continue
            
            num_val = int(number[:4])
            if num_val < 1000 or num_val >= 9000:
                continue
            
            # Validate suffix is C, L, or nothing
            if len(number) > 4 and number[4] not in ['C', 'L']:
                continue
            
            # Exclude false positives
            excluded = ['FALL', 'SPRING', 'SUMMER', 'ALL']
            if dept in excluded:
                continue
            
            valid.append(f"{dept}{number}")
        
        return valid[0] if valid else None
    
    return None

def extract_from_pdf_content(pdf_url):
    try:
        response = requests.get(pdf_url, timeout=30)
        pdf_io_bytes = io.BytesIO(response.content)
        pdf = pypdf.PdfReader(pdf_io_bytes)
        first_page = pdf.pages[0].extract_text()
        
        # Pattern: EXACTLY 3 letters + 4 digits + optional C/L ONLY
        pattern = r'\b([A-Z]{3})[\s]?(\d{4}[CL]?)\b'
        matches = re.findall(pattern, first_page)
        
        if matches:
            for m in matches:
                dept = m[0].upper()
                number = m[1].upper()
                
                # Validate number is 4 digits
                if len(number) < 4 or not number[:4].isdigit():
                    continue
                
                # Number must be reasonable course number
                num_val = int(number[:4])
                if num_val < 1000 or num_val >= 9000:
                    continue
                
                # Validate suffix is C, L, or nothing
                if len(number) > 4 and number[4] not in ['C', 'L']:
                    continue
                
                # Exclude common false positives
                excluded = ['FALL', 'SPRING', 'SUMMER', 'PAGE', 'ROOM', 'TERM', 'YEAR', 'ALL']
                if dept in excluded:
                    continue
                
                return f"{dept}{number}"
        
        return None
    except:
        return None

def extract_course_code(pdf_url):
    filename = pdf_url.split('/')[-1]
    code = extract_from_filename(filename)
    if code:
        return code, 'filename'
    code = extract_from_pdf_content(pdf_url)
    if code:
        return code, 'pdf_content'
    return None, 'failed'

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
- If you see "AI for security", extract ONLY "ai for security", not 50 variations

EXCLUDE:
- Grading policies, rubrics, grade scales
- Attendance policies, deadlines, dates
- Office hours, contact information
- Academic integrity, honor code
- Disability accommodations, mental health resources
- Course logistics, materials required
- Exam schedules, homework policies
- Prerequisites, corequisites
- ABET requirements, accreditation
- Teaching assistant names, instructor info
- Generic terms: "project", "homework", "exam", "quiz", "test"

OUTPUT RULES:
- One keyword per line
- No numbering
- No explanations
- Maximum 80 keywords total
- ONLY terms found in the syllabus text below

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
            
            # TRUNCATE TO 80 TOPICS MAX (safety measure)
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

# PRODUCTION: Process ALL engineering departments
print("="*80)
print("PRODUCTION RUN: ALL ENGINEERING SYLLABI (C/L SUFFIXES ONLY)")
print("="*80)

departments = [
    ("https://www.cise.ufl.edu/academics/course-syllabi/", "CISE"),
    ("https://www.ece.ufl.edu/academics/course-syllabi/", "ECE"),
    ("https://mae.ufl.edu/academics/course-syllabi/", "MAE"),
    ("https://www.che.ufl.edu/academics/course-schedule-syllabi/", "CHE"),
    ("https://www.bme.ufl.edu/academics/bme-undergraduate-program/undergraduate-courses/", "BME"),
    ("https://ise.ufl.edu/academics/syllabi-upload/", "ISE"),
    ("https://mse.ufl.edu/academics/syllabi/", "MSE"),
    ("https://abe.ufl.edu/undergraduate/courses/", "ABE"),
    ("https://www.essie.ufl.edu/resources/essie-course-syllabi/", "ESSIE"),
]

# Collect all PDFs
print("\nCollecting PDFs from all departments...")
all_pdfs = []
for dept_url, dept_name in departments:
    pdfs = find_pdfs_on_page(dept_url)
    print(f"  {dept_name}: {len(pdfs)} PDFs")
    all_pdfs.extend([(pdf, dept_name) for pdf in pdfs])

print(f"\nTotal PDFs found: {len(all_pdfs)}")

# Load progress
processed = load_progress()
print(f"Already processed: {len(processed)} courses")
remaining = len(all_pdfs) - len(processed)
print(f"Remaining: ~{remaining} to process")

# Estimate time
estimated_minutes = (remaining * 10) / 60
print(f"Estimated time: {estimated_minutes/60:.1f} hours\n")

input("Press Enter to start, or Ctrl+C to cancel...")

# Process all PDFs
start_time = time.time()
success_count = 0
skip_count = 0
fail_count = 0

for i, (pdf_url, dept) in enumerate(all_pdfs, 1):
    filename = pdf_url.split('/')[-1][:60]
    print(f"\n[{i}/{len(all_pdfs)}] [{dept}] {filename}")
    
    code, source = extract_course_code(pdf_url)
    
    if not code:
        print("  ✗ No code")
        fail_count += 1
        continue
    
    if code in processed:
        print(f"  ⏭ Skip {code}")
        skip_count += 1
        continue
    
    print(f"  ✓ Code: {code}")
    
    try:
        text = download_full_pdf_text(pdf_url)
        print(f"  ✓ Text: {len(text)} chars")
    except Exception as e:
        print(f"  ✗ PDF failed")
        fail_count += 1
        continue
    
    if len(text) < 100:
        print(f"  ✗ Too short")
        fail_count += 1
        continue
    
    print(f"  ⏳ Extracting...")
    topics = extract_topics_with_gemini(text, code)
    
    if topics:
        print(f"  ✓ {len(topics)} topics")
        append_result({'code': code, 'topics': topics})
        processed.add(code)
        success_count += 1
    else:
        print(f"  ✗ No topics")
        fail_count += 1
    
    # Progress update every 10 PDFs
    if i % 10 == 0:
        elapsed = time.time() - start_time
        rate = i / (elapsed / 60)
        remaining_pdfs = len(all_pdfs) - i
        eta_minutes = remaining_pdfs / rate
        print(f"\n  📊 Progress: {success_count} success, {skip_count} skipped, {fail_count} failed")
        print(f"  ⏱  Rate: {rate:.1f} PDFs/min | ETA: {eta_minutes:.0f} min")
    
    time.sleep(6)

elapsed = time.time() - start_time
print(f"\n{'='*80}")
print("COMPLETE")
print("="*80)
print(f"Success: {success_count}")
print(f"Skipped: {skip_count}")
print(f"Failed: {fail_count}")
print(f"Total time: {elapsed/60:.1f} minutes ({elapsed/3600:.1f} hours)")
print(f"Saved to: {OUTPUT_FILE}")
print("="*80)
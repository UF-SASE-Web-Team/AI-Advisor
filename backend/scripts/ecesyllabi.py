import requests
from bs4 import BeautifulSoup
import json
import PyPDF2
from io import BytesIO
from docx import Document
from datetime import datetime

def parse_semester_year(semester_text):
    """Convert 'Fall 2024' to (2024, 'Fall') for sorting"""
    try:
        parts = semester_text.strip().split()
        if len(parts) >= 2:
            semester = parts[0]  # Fall, Spring, Summer
            year = int(parts[1])
            return (year, semester)
    except:
        pass
    return (0, '')

def is_recent(semester_text, years_back=2):
    """Check if semester is within last N years"""
    year, _ = parse_semester_year(semester_text)
    current_year = datetime.now().year
    return year >= (current_year - years_back)

def scrape_ece_syllabi():
    url = "https://www.ece.ufl.edu/academics/course-syllabi/"
    
    response = requests.get(url)
    soup = BeautifulSoup(response.text, 'html.parser')
    
    tables = soup.find_all('table')
    
    all_syllabi = []
    
    for table in tables:
        rows = table.find_all('tr')
        
        for row in rows[1:]:
            cells = row.find_all('td')
            
            if len(cells) < 4:
                continue
            
            course_code = cells[0].get_text(strip=True)
            course_title = cells[1].get_text(strip=True)
            
            if not course_code or course_code == "Course Number":
                continue
            
            syllabus_cell = cells[-1]
            links = syllabus_cell.find_all('a', href=True)
            
            for link in links:
                href = link.get('href', '')
                semester_text = link.get_text(strip=True)
                
                if not href or '/syllabi/' not in href:
                    continue
                
                # Filter: only last 2 years
                if not is_recent(semester_text, years_back=2):
                    continue
                
                if href.startswith('/'):
                    full_url = f"https://www.ece.ufl.edu{href}"
                else:
                    full_url = href
                
                # skip broken internal server URLs
                if '@' in full_url:
                    continue
                
                all_syllabi.append({
                    'course_code': course_code,
                    'course_title': course_title,
                    'semester': semester_text,
                    'syllabus_url': full_url,
                    'year': parse_semester_year(semester_text)[0],
                    'term': parse_semester_year(semester_text)[1]
                })
    
    # Deduplicate: keep only latest per course
    course_map = {}
    for syl in all_syllabi:
        code = syl['course_code']
        
        if code not in course_map:
            course_map[code] = syl
        else:
            # Keep newer one
            existing_year = course_map[code]['year']
            new_year = syl['year']
            
            if new_year > existing_year:
                course_map[code] = syl
    
    result = list(course_map.values())
    result = [s for s in result if s['course_code'].replace(' ', '')[3] in ('1', '2', '3', '4')]
    return result

def extract_pdf_text(pdf_url):
    try:
        response = requests.get(pdf_url, timeout=30)
        response.raise_for_status()
        
        pdf_file = BytesIO(response.content)
        reader = PyPDF2.PdfReader(pdf_file)
        
        text = ""
        for page in reader.pages:
            text += page.extract_text() + "\n"
        
        extracted = text.strip()
        if not extracted:
            print(f"    Error: PDF parsed but no text extracted (likely scanned/image-based)")
            return None
        return extracted
    except Exception as e:
        print(f"    Error: {e}")
        return None

def extract_docx_text(docx_url):
    try:
        response = requests.get(docx_url, timeout=30)
        response.raise_for_status()
        
        docx_file = BytesIO(response.content)
        doc = Document(docx_file)
        
        text = "\n".join([para.text for para in doc.paragraphs])
        extracted = text.strip()
        if not extracted:
            print(f"    Error: DOCX parsed but no text extracted")
            return None
        return extracted
    except Exception as e:
        print(f"    Error: {e}")
        return None

if __name__ == "__main__":
    print("=== Stage 1: Scraping recent syllabus links (last 2 years) ===")
    syllabi = scrape_ece_syllabi()
    print(f"Found {len(syllabi)} unique courses (most recent per course)\n")
    
    print("=== Stage 2: Downloading and parsing syllabi ===")
    
    for i, syl in enumerate(syllabi, 1):
        print(f"[{i}/{len(syllabi)}] {syl['course_code']} - {syl['semester']}")
        
        url = syl['syllabus_url']
        print(f"    URL: {url}")
        
        if url.endswith('.pdf'):
            text = extract_pdf_text(url)
        elif url.endswith('.docx'):
            text = extract_docx_text(url)
        else:
            print(f"    Error: Unrecognized file type (not .pdf or .docx)")
            text = None
        
        if text:
            syl['syllabus_text'] = text
            print(f"  ✓ Extracted {len(text)} characters")
        else:
            syl['syllabus_text'] = None
            print(f"  ✗ Failed")
    
    # Clean up temporary fields
    for syl in syllabi:
        syl.pop('year', None)
        syl.pop('term', None)
    
    with open('ecesyllabi.json', 'w', encoding='utf-8') as f:
        json.dump(syllabi, f, indent=2, ensure_ascii=False)
    
    success_count = sum(1 for s in syllabi if s.get('syllabus_text'))
    print(f"\n=== DONE ===")
    print(f"Successfully parsed: {success_count}/{len(syllabi)}")
    print(f"Saved to: ece_syllabi_recent.json")
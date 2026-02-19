import json
import csv

with open('s26.json') as f:
    courses = json.load(f)

seen_codes = set()
unique_courses = []

for course in courses:
    code = course.get('code')
    if code not in seen_codes:
        seen_codes.add(code)
        unique_courses.append(course)

print(f"Original: {len(courses)} courses")
print(f"Unique: {len(unique_courses)} courses")
print(f"Duplicates removed: {len(courses) - len(unique_courses)}")

# Now generate CSV with unique_courses instead of courses
with open('courses_unique.csv', 'w', newline='', encoding='utf-8') as f:
    writer = csv.writer(f, quoting=csv.QUOTE_ALL)
    writer.writerow(['course_code', 'course_name', 'description', 'credits', 
                     'prerequisites', 'department', 'instructors'])
    
    for course in unique_courses:
        section = course.get('sections', [{}])[0] if course.get('sections') else {}
        
        credits = section.get('credits', 3)
        if isinstance(credits, str) and credits.upper() == 'VAR':
            credits = 0
        try:
            credits = int(credits)
        except:
            credits = 3
        
        instructors = []
        for s in course.get('sections', []):
            for inst in s.get('instructors', []):
                name = inst.get('name', '')
                if name and name not in instructors:
                    instructors.append(name)
        
        prereqs = (course.get('prerequisites', '') or '').replace('\n', ' ').replace('\r', ' ').strip()
        desc = (course.get('description', '') or '').replace('\n', ' ').replace('\r', ' ').strip()
        
        writer.writerow([
            course.get('code', ''),
            course.get('name', ''),
            desc,
            credits,
            prereqs,
            section.get('deptName', ''),
            ', '.join(instructors)
        ])

print("✓ Created courses_unique.csv")

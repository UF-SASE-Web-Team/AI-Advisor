# create_courses_without_sections.py
import json

with open('merged_courses.json', 'r') as f:
    courses = json.load(f)

print(f"Processing {len(courses)} courses...")

# Remove sections field
removed_count = 0
for course in courses:
    if 'sections' in course:
        del course['sections']
        removed_count += 1

# Save to new file
with open('merged_courses_no_sections.json', 'w') as f:
    json.dump(courses, f, indent=2)

print(f"✓ Removed 'sections' field from {removed_count} courses")
print("✓ Created merged_courses_no_sections.json")
print(f"✓ Original merged_courses.json unchanged")
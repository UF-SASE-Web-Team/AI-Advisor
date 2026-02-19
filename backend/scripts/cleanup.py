# cleanup_remove_unique_key.py
import json

with open('merged_courses.json', 'r') as f:
    courses = json.load(f)

print(f"Cleaning up {len(courses)} courses...")

# Remove unique_key field
removed_count = 0
for course in courses:
    if 'unique_key' in course:
        del course['unique_key']
        removed_count += 1

with open('merged_courses.json', 'w') as f:
    json.dump(courses, f, indent=2)

print(f"✓ Removed 'unique_key' field from {removed_count} courses")
print("✓ Updated merged_courses.json")
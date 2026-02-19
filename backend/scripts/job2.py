# check_s26.py
import json
from collections import Counter

with open('s26.json', 'r') as f:
    courses = json.load(f)

print("="*80)
print("S26.JSON ANALYSIS")
print("="*80)

# Basic stats
print(f"\nTotal courses: {len(courses)}")

# Check structure
if courses:
    print(f"\nSample course structure:")
    sample = courses[0]
    for key in sample.keys():
        value = sample[key]
        if isinstance(value, list):
            print(f"  {key}: [{type(value[0]).__name__ if value else 'empty'}] (length: {len(value)})")
        else:
            print(f"  {key}: {type(value).__name__}")

# Check for duplicates
code_counts = Counter(c['code'] for c in courses)
duplicates = {code: count for code, count in code_counts.items() if count > 1}

print(f"\n" + "="*80)
print("DUPLICATE ANALYSIS")
print("="*80)
print(f"Unique course codes: {len(code_counts)}")
print(f"Duplicate codes: {len(duplicates)}")

if duplicates:
    print(f"\nTop 10 most duplicated:")
    for code, count in sorted(duplicates.items(), key=lambda x: x[1], reverse=True)[:10]:
        print(f"  {code}: {count} entries")
        # Show first 2 examples
        examples = [c for c in courses if c['code'] == code][:2]
        for ex in examples:
            print(f"    - {ex.get('name', 'No name')[:60]}")

# Department breakdown
print(f"\n" + "="*80)
print("DEPARTMENT BREAKDOWN")
print("="*80)

# Try to extract department from code (first 3 letters)
dept_counts = Counter(c['code'][:3] for c in courses)
print(f"Unique department codes: {len(dept_counts)}")
for dept, count in sorted(dept_counts.items(), key=lambda x: x[1], reverse=True)[:15]:
    print(f"  {dept}: {count} courses")

# Check for special topics
special_topics = [c for c in courses if c['code'].endswith(('930', '940', '949', '920'))]
print(f"\n" + "="*80)
print("SPECIAL TOPICS")
print("="*80)
print(f"Special topics courses: {len(special_topics)}")

# Group by code
from collections import defaultdict
by_code = defaultdict(list)
for st in special_topics:
    by_code[st['code']].append(st.get('name', 'No name'))

for code in sorted(by_code.keys()):
    print(f"\n{code}: {len(by_code[code])} variants")
    for name in by_code[code][:3]:
        print(f"  - {name[:70]}")
    if len(by_code[code]) > 3:
        print(f"  ... and {len(by_code[code]) - 3} more")

print("\n" + "="*80)
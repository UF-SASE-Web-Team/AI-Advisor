# fix_cl_suffix_matches.py
import json

print("="*80)
print("FIX C/L SUFFIX MATCHING ISSUES")
print("="*80)

# Load merged courses
with open('merged_courses.json', 'r') as f:
    merged = json.load(f)

# Load enriched syllabi
with open('enriched_syllabi_full.json', 'r') as f:
    enriched = json.load(f)

# Build enriched lookup
enriched_by_code = {}
for course in enriched:
    code = course['code']
    enriched_by_code[code] = course

print(f"\nMerged courses: {len(merged)}")
print(f"Enriched courses: {len(enriched)}")

# Find courses without topics in merged
without_topics = [c for c in merged if not c.get('topics')]
print(f"Courses without topics: {len(without_topics)}")

print("\n" + "="*80)
print("SEARCHING FOR C/L SUFFIX MATCHES")
print("="*80)

# Try to find matches using C/L fuzzy matching
potential_fixes = []

for course in without_topics:
    code = course['code']
    
    # Try multiple matching strategies
    match = None
    match_strategy = None
    
    # Strategy 1: Exact match (shouldn't find anything, but check anyway)
    if code in enriched_by_code:
        match = enriched_by_code[code]
        match_strategy = "exact"
    
    # Strategy 2: Try without C/L suffix
    elif code.endswith(('C', 'L')):
        base_code = code[:-1]
        if base_code in enriched_by_code:
            match = enriched_by_code[base_code]
            match_strategy = f"remove suffix ({code} → {base_code})"
    
    # Strategy 3: Try with C suffix
    elif code + 'C' in enriched_by_code:
        match = enriched_by_code[code + 'C']
        match_strategy = f"add C ({code} → {code}C)"
    
    # Strategy 4: Try with L suffix
    elif code + 'L' in enriched_by_code:
        match = enriched_by_code[code + 'L']
        match_strategy = f"add L ({code} → {code}L)"
    
    if match:
        potential_fixes.append({
            'course': course,
            'match': match,
            'strategy': match_strategy
        })

print(f"\nFound {len(potential_fixes)} potential matches using C/L fuzzy matching")

if len(potential_fixes) == 0:
    print("\n✓ No C/L suffix issues found")
    exit(0)

print("\n" + "="*80)
print("POTENTIAL FIXES:")
print("="*80)

for i, fix in enumerate(potential_fixes, 1):
    course = fix['course']
    match = fix['match']
    strategy = fix['strategy']
    
    print(f"\n[{i}] {course['code']} - {course.get('name', 'No name')[:60]}")
    print(f"    Matched using: {strategy}")
    print(f"    Will add {len(match.get('topics', []))} topics")
    topics_preview = ', '.join(match.get('topics', [])[:5])
    print(f"    Topics: {topics_preview}...")

print("\n" + "="*80)
print(f"SUMMARY: Found {len(potential_fixes)} courses that can be fixed")
print("This will ADD TOPICS to these courses (course codes stay unchanged)")
print("="*80)

response = input("\nApply these fixes? (yes/no): ").strip().lower()

if response != 'yes':
    print("\n✗ Canceled. No changes made.")
    exit(0)

# Apply fixes
print("\nApplying fixes...")

fixed_count = 0
for fix in potential_fixes:
    course_code = fix['course']['code']
    match_topics = fix['match'].get('topics', [])
    match_title = fix['match'].get('title')
    match_unique_key = fix['match'].get('unique_key')
    
    # Find and update in merged (keep original code!)
    for course in merged:
        if course['code'] == course_code and not course.get('topics'):
            # Add topics but keep original course code
            course['topics'] = match_topics
            if not course.get('title'):
                course['title'] = match_title
            if not course.get('unique_key') or course['unique_key'] == course_code:
                course['unique_key'] = course_code  # Keep code as unique_key
            if not course.get('id') or course['id'] == course_code:
                course['id'] = course_code  # Keep code as id
            
            fixed_count += 1
            print(f"  ✓ Added topics to {course_code}")
            break

# Save updated merged courses
with open('merged_courses.json', 'w') as f:
    json.dump(merged, f, indent=2)

# Final stats
remaining_without_topics = [c for c in merged if not c.get('topics')]

print("\n" + "="*80)
print("COMPLETE")
print("="*80)
print(f"Fixed: {fixed_count} courses")
print(f"Remaining without topics: {len(remaining_without_topics)}")
print(f"\n✓ Updated merged_courses.json")
print("="*80)

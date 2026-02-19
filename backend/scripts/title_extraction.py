# find_all_duplicates.py
import json
from collections import Counter

with open('enriched_syllabi_full.json', 'r') as f:
    data = json.load(f)

# Count occurrences of each code
code_counts = Counter(c['code'] for c in data)

# Find all codes that appear more than once
duplicates = {code: count for code, count in code_counts.items() if count > 1}

print(f"Total courses: {len(data)}")
print(f"Unique codes: {len(code_counts)}")
print(f"Duplicate codes: {len(duplicates)}\n")

if duplicates:
    print("="*80)
    print("CODES THAT APPEAR MULTIPLE TIMES:")
    print("="*80)
    for code, count in sorted(duplicates.items()):
        print(f"{code}: {count} times")
else:
    print("✓ No duplicates found - all course codes are unique")

print("\n" + "="*80)
print("COURSE CODE PATTERNS:")
print("="*80)

# Analyze patterns
patterns = {
    'X930': [c for c in code_counts.keys() if c.endswith('930')],
    'X940': [c for c in code_counts.keys() if c.endswith('940')],
    'X949': [c for c in code_counts.keys() if c.endswith('949')],
    'Other special': [c for c in code_counts.keys() if c[-3:] in ['910', '920', '950', '960', '970', '980', '990']]
}

for pattern, codes in patterns.items():
    if codes:
        print(f"\n{pattern} courses ({len(codes)}):")
        for code in sorted(codes):
            print(f"  {code}")

            
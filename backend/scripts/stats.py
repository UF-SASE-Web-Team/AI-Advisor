# stats.py
import json
from collections import Counter

with open('enriched_syllabi_full.json', 'r') as f:
    data = json.load(f)

print("="*80)
print("SYLLABUS ENRICHMENT STATS")
print("="*80)

# Basic stats
total_courses = len(data)
total_topics = sum(len(course['topics']) for course in data)
avg_topics = total_topics / total_courses if total_courses > 0 else 0

print(f"\nTotal courses: {total_courses}")
print(f"Total topics extracted: {total_topics}")
print(f"Average topics per course: {avg_topics:.1f}")

# Topic count distribution
topic_counts = [len(course['topics']) for course in data]
print(f"\nMin topics: {min(topic_counts) if topic_counts else 0}")
print(f"Max topics: {max(topic_counts) if topic_counts else 0}")
print(f"Median topics: {sorted(topic_counts)[len(topic_counts)//2] if topic_counts else 0}")

# Courses by topic count (sorted)
print("\n" + "="*80)
print("COURSES RANKED BY TOPIC COUNT")
print("="*80)
sorted_courses = sorted(data, key=lambda x: len(x['topics']), reverse=True)

print("\nTop 20 courses (most topics):")
for i, course in enumerate(sorted_courses[:20], 1):
    print(f"{i:2}. {course['code']:10} - {len(course['topics']):3} topics")

print("\nBottom 20 courses (fewest topics):")
for i, course in enumerate(sorted_courses[-20:], 1):
    print(f"{i:2}. {course['code']:10} - {len(course['topics']):3} topics")

# Distribution histogram
print("\n" + "="*80)
print("TOPIC COUNT DISTRIBUTION")
print("="*80)
bins = [0, 10, 20, 30, 40, 50, 60, 70, 80, 100]
histogram = {f"{bins[i]}-{bins[i+1]}": 0 for i in range(len(bins)-1)}

for count in topic_counts:
    for i in range(len(bins)-1):
        if bins[i] <= count < bins[i+1]:
            histogram[f"{bins[i]}-{bins[i+1]}"] += 1
            break

for range_label, count in histogram.items():
    bar = "█" * (count // 2)  # Scale bar for readability
    print(f"{range_label:>8} topics: {count:3} courses {bar}")

# Most common topics across all courses
print("\n" + "="*80)
print("TOP 30 MOST COMMON TOPICS (across all courses)")
print("="*80)
all_topics = []
for course in data:
    all_topics.extend(course['topics'])

topic_freq = Counter(all_topics)
for i, (topic, count) in enumerate(topic_freq.most_common(30), 1):
    pct = (count / total_courses) * 100
    print(f"{i:2}. {topic:40} - {count:3} courses ({pct:5.1f}%)")

# Courses with suspiciously many topics (potential hallucinations)
print("\n" + "="*80)
print("POTENTIAL HALLUCINATIONS (>70 topics)")
print("="*80)
suspicious = [c for c in data if len(c['topics']) > 70]
if suspicious:
    for course in sorted(suspicious, key=lambda x: len(x['topics']), reverse=True):
        print(f"{course['code']:10} - {len(course['topics'])} topics")
else:
    print("None found ✓")

print("\n" + "="*80)

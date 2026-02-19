import json
from pathlib import Path

SOURCES_DIR = Path(__file__).parent / "sources"
OUTPUT_PATH = Path(__file__).parent.parent / "data" / "courses.json"


def load_json(path):
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def normalize_code(code):
    return code.replace(" ", "").upper()


def enrich_with_syllabi(courses, syllabi_path):
    if not syllabi_path.exists():
        print(f"  ! Skipping syllabi — {syllabi_path} not found")
        return

    syllabi = load_json(syllabi_path)
    syllabus_map = {
        normalize_code(s["course_code"]): s["syllabus_text"]
        for s in syllabi
        if s.get("syllabus_text")
    }

    matched = 0
    for course in courses:
        code = normalize_code(course["code"])
        if code in syllabus_map:
            course["syllabus"] = syllabus_map[code]
            matched += 1

    print(f"  Syllabi: {matched}/{len(courses)} courses matched")


def main():
    print("=== Building courses.json ===\n")

    # Load base course data
    courses_path = SOURCES_DIR / "s26.json"
    if not courses_path.exists():
        print(f"ERROR: {courses_path} not found. Run oneuf.py first.")
        return

    courses = load_json(courses_path)
    print(f"Loaded {len(courses)} courses from s26.json")

    # Enrich with syllabi
    print("Enriching...")
    enrich_with_syllabi(courses, SOURCES_DIR / "ecesyllabi.json")

    # Future enrichment functions go here:
    # enrich_with_rmp(courses, SOURCES_DIR / "rmp_data.json")
    # enrich_with_reddit(courses, SOURCES_DIR / "reddit_data.json")

    # Write output
    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
        json.dump(courses, f, indent=2, ensure_ascii=False)

    print(f"\nWrote {len(courses)} courses to {OUTPUT_PATH}")
    print("Done.")


if __name__ == "__main__":
    main()
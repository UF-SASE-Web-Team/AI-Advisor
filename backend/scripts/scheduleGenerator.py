"""
schedule_generator.py
---------------------
Reads all courses from a Supabase table and a student transcript from Supabase,
filters out completed courses, then builds a semester-by-semester schedule
that respects prerequisite ordering.

Prerequisites:
    pip install httpx python-dotenv

Environment variables (set in .env or shell):
    SUPABASE_URL   - e.g. https://xyzcompany.supabase.co
    SUPABASE_KEY   - your anon/service-role key
"""

import json
import os
import re as _re
import sys
from collections import defaultdict, deque
from pathlib import Path

import httpx
from dotenv import load_dotenv

load_dotenv()

# ─────────────────────────────────────────────
# Configuration
# ─────────────────────────────────────────────

SUPABASE_URL: str = os.environ.get("SUPABASE_URL", "")
SUPABASE_KEY: str = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")

COURSES_TABLE    = "courses"
TRANSCRIPT_TABLE = "transcript"
MAX_CREDITS_PER_SEMESTER = 15


# ─────────────────────────────────────────────
# 1. Data Loading
# ─────────────────────────────────────────────

def load_courses_from_supabase() -> list[dict]:
    """Fetch all rows from the courses table via the Supabase REST API."""
    if not SUPABASE_URL or not SUPABASE_KEY:
        raise EnvironmentError(
            "SUPABASE_URL and SUPABASE_KEY must be set as environment variables."
        )

    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
    }

    select_fields = "id,course_code,course_name,credits,prerequisites_parsed,corequisites_parsed,sections"
    base_url = f"{SUPABASE_URL}/rest/v1/{COURSES_TABLE}"

    all_courses = []
    page_size = 1000
    offset = 0

    with httpx.Client() as client:
        while True:
            params = {
                "select": select_fields,
                "limit": page_size,
                "offset": offset,
            }
            response = client.get(base_url, headers=headers, params=params)

            if response.status_code != 200:
                raise RuntimeError(
                    f"Supabase request failed ({response.status_code}): {response.text}"
                )

            batch = response.json()
            all_courses.extend(batch)
            if len(batch) < page_size:
                break
            offset += page_size

    print(f"[Supabase] Loaded {len(all_courses)} courses.")
    return all_courses


def load_transcript_from_supabase(user_uuid: str) -> tuple[set[str], set[str]]:
    """
    Returns:
        completed – all passing courses the student has taken
        recent    – courses taken in the most recent term
    """
    if not SUPABASE_URL or not SUPABASE_KEY:
        raise EnvironmentError(
            "SUPABASE_URL and SUPABASE_KEY must be set as environment variables."
        )

    FAILING_GRADES = {"W", "WF", "I", "I*", "NG"}

    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
    }

    base_url = f"{SUPABASE_URL}/rest/v1/{TRANSCRIPT_TABLE}"
    all_rows = []
    page_size = 1000
    offset = 0

    with httpx.Client() as client:
        while True:
            url = (
                f"{base_url}"
                f"?select=course,grade,term"
                f"&id=eq.{user_uuid}"
                f"&limit={page_size}"
                f"&offset={offset}"
            )
            response = client.get(url, headers=headers)

            if response.status_code != 200:
                raise RuntimeError(
                    f"Supabase transcript request failed ({response.status_code}): {response.text}"
                )

            batch = response.json()
            all_rows.extend(batch)
            if len(batch) < page_size:
                break
            offset += page_size

    print(f"[Supabase] Loaded {len(all_rows)} transcript rows for user {user_uuid}.")

    completed: set[str] = set()
    skipped = []
    terms: dict[str, set[str]] = defaultdict(set)   # term -> set of passing course codes

    for entry in all_rows:
        raw_code = entry.get("course", "")
        grade    = (entry.get("grade") or "").strip().upper()
        term     = (entry.get("term")  or "UNKNOWN").strip()

        code = normalize_code(raw_code)
        if not code:
            continue

        if grade in FAILING_GRADES:
            skipped.append((code, grade))
            continue

        completed.add(code)
        terms[term].add(code)

    if skipped:
        print(
            f"[Transcript] Excluded {len(skipped)} course(s) with non-passing grades: "
            + ", ".join(f"{c}({g})" for c, g in skipped)
        )

    # Identify the most recent term.
    # Assumes term strings sort chronologically, e.g. "Fall 2022", "Spr 2023".
    # Adjust the sort key below if your term format differs.
    TERM_ORDER = {"Spr": 1, "Sum": 2, "Fall": 3}

    def term_sort_key(t: str) -> tuple:
        parts = t.split()
        if len(parts) == 2:
            try:
                return (int(parts[1]), TERM_ORDER.get(parts[0], 0))
            except ValueError:
                pass
        return (0, 0)

    most_recent_term = max(terms.keys(), key=term_sort_key) if terms else None
    recent: set[str] = terms[most_recent_term] if most_recent_term else set()

    print(f"[Transcript] Most recent term: {most_recent_term} ({len(recent)} courses: {sorted(recent)})")
    print(f"[Transcript] Student has completed {len(completed)} courses total.")

    return completed, recent


# ─────────────────────────────────────────────
# 2. Course Code Normalization
# ─────────────────────────────────────────────

def normalize_code(code: str) -> str:
    # Uppercase, remove spaces: "COP 3502C" -> "COP3502C"
    code = code.strip().upper().replace(" ", "")
    # Strip trailing lab/clinic suffixes (C, L) after a 4-digit number
    # "COP3502C" -> "COP3502", "BSC2010L" -> "BSC2010"
    code = _re.sub(r"([A-Z]{2,4}[0-9]{4})[CL]$", r"\1", code)
    return code


# ─────────────────────────────────────────────
# 3. Prerequisite Parsing
# ─────────────────────────────────────────────

def parse_prerequisites(course: dict) -> list[str]:
    raw = course.get("prerequisites_parsed")
    if not raw:
        return []
    if isinstance(raw, str):
        try:
            raw = json.loads(raw)
        except json.JSONDecodeError:
            return []
    return [normalize_code(str(p)) for p in raw if p]


# ─────────────────────────────────────────────
# 4. Schedule Formatting
# ─────────────────────────────────────────────

def fmt_time(t: str) -> str:
    """
    Strips seconds and AM/PM from a time string.
    '3:00 PM' -> '3:00'   |   '12:50 PM' -> '12:50'
    """
    try:
        h, rest = t.split(":")
        m = rest[:2]
        return f"{h}:{m}"
    except Exception:
        return t


def format_section_schedule(sections: list) -> str:
    """
    Formats the sections JSONB array into a human-readable schedule string.

    Output format:
        'M,W,F - M3:00-3:50\\nW3:00-3:50\\nF3:00-3:50'

    Multiple meetTimes blocks (e.g. lecture + lab) are joined by '\\n'.
    Returns 'TBA' if no valid meeting times are found.
    """
    if not sections:
        return "TBA"

    # Normalise: sections may arrive as a JSON string or already a list
    if isinstance(sections, str):
        try:
            sections = json.loads(sections)
        except json.JSONDecodeError:
            return "TBA"

    lines = []

    for section in sections:
        for mt in section.get("meetTimes", []):
            days: list[str] = mt.get("meetDays", [])
            start: str = fmt_time(mt.get("meetTimeBegin", ""))
            end: str   = fmt_time(mt.get("meetTimeEnd", ""))

            if not days:
                continue

            days_str   = ",".join(days)        # e.g. "M,W,F"
            time_range = f"{start}-{end}"      # e.g. "3:00-3:50"

            # One entry per day: "M3:00-3:50", "W3:00-3:50", "F3:00-3:50"
            day_lines  = "\n".join(f"{d}{time_range}" for d in days)

            # Full block: "M,W,F - M3:00-3:50\nW3:00-3:50\nF3:00-3:50"
            lines.append(f"{days_str} - {day_lines}")

    return "\n".join(lines) if lines else "TBA"


# ─────────────────────────────────────────────
# 5. Graph + Topological Sort  (was 4)
# ─────────────────────────────────────────────

def build_prerequisite_graph(
    courses: list[dict],
    completed: set[str],
) -> tuple[dict, dict, dict]:
    for c in courses:
        c["course_code"] = normalize_code(c["course_code"])

    course_map: dict[str, dict] = {}
    for c in courses:
        code = c["course_code"]
        if code not in completed:
            course_map[code] = c

    prereq_map: dict[str, list[str]] = defaultdict(list)
    in_degree: dict[str, int] = {}

    for code, course in course_map.items():
        raw_prereqs = parse_prerequisites(course)
        unmet_prereqs = [p for p in raw_prereqs if p not in completed]
        in_degree[code] = len(unmet_prereqs)
        for prereq in unmet_prereqs:
            if prereq in course_map:
                prereq_map[prereq].append(code)

    return course_map, dict(prereq_map), in_degree


def topological_levels(
    course_map: dict,
    prereq_map: dict,
    in_degree: dict,
    completed: set[str],
) -> list[list[str]]:
    queue = deque(code for code, deg in in_degree.items() if deg == 0)
    levels: list[list[str]] = []
    visited: set[str] = set()
    available_after: set[str] = set(completed)

    while queue:
        level_codes = list(queue)
        queue.clear()

        levels.append(level_codes)
        visited.update(level_codes)
        available_after.update(level_codes)

        for code in level_codes:
            for dependent in prereq_map.get(code, []):
                if dependent in visited:
                    continue
                in_degree[dependent] -= 1
                if in_degree[dependent] == 0:
                    queue.append(dependent)

    unresolved = set(course_map.keys()) - visited
    if unresolved:
        print(
            f"\n[Warning] {len(unresolved)} course(s) have circular or unresolvable "
            f"prerequisites and were excluded from the schedule:\n  "
            + ", ".join(sorted(unresolved))
        )

    return levels


# ─────────────────────────────────────────────
# 5. Semester Generation
# ─────────────────────────────────────────────

def count_dependents(prereq_map: dict, course_map: dict) -> dict[str, int]:
    scores: dict[str, int] = {}

    for start in course_map:
        visited: set[str] = set()
        queue = deque(prereq_map.get(start, []))
        while queue:
            dependent = queue.popleft()
            if dependent in visited or dependent not in course_map:
                continue
            visited.add(dependent)
            queue.extend(prereq_map.get(dependent, []))
        scores[start] = len(visited)

    return scores


def build_single_semester(
    levels: list[list[str]],
    course_map: dict,
    prereq_map: dict,
    recent: set[str],
    max_credits: int = MAX_CREDITS_PER_SEMESTER,
) -> list[dict]:
    available = levels[0] if levels else []
    dependent_counts = count_dependents(prereq_map, course_map)

    # Build a reverse map: course -> its prerequisites
    prereq_of: dict[str, list[str]] = {
        code: parse_prerequisites(course_map[code])
        for code in course_map
    }

    def recent_prereq_count(code: str) -> int:
        """How many of this course's prerequisites were taken last semester."""
        return sum(1 for p in prereq_of.get(code, []) if p in recent)

    ranked = sorted(
        available,
        key=lambda c: (
            -recent_prereq_count(c),          # 1st priority: prereqs taken last semester
            -dependent_counts.get(c, 0),      # 2nd priority: unlocks the most future courses
            c                                  # 3rd priority: alphabetical for determinism
        )
    )

    semester: list[dict] = []
    total_credits = 0

    for code in ranked:
        course = course_map[code]
        credits = int(course.get("credits") or 3)
        if total_credits + credits <= max_credits:
            semester.append(course)
            total_credits += credits

    return semester


# ─────────────────────────────────────────────
# 6. Output
# ─────────────────────────────────────────────

def print_schedule(semester: list[dict], dependent_counts: dict[str, int]) -> None:
    total_credits = sum(int(c.get("credits") or 3) for c in semester)

    print("\n" + "═" * 60)
    print("  RECOMMENDED NEXT SEMESTER")
    print("═" * 60)
    print(f"  {len(semester)} courses  |  {total_credits} credit hours")
    print("  " + "─" * 55)

    for course in semester:
        code = course["course_code"]
        name = (course.get("course_name") or "")[:45]
        cr = int(course.get("credits") or 3)
        unlocks = dependent_counts.get(code, 0)
        unlock_str = f"  [{unlocks} future course(s)]" if unlocks > 0 else ""
        print(f"  {code:<12} {name:<46} {cr} cr{unlock_str}")

    print("═" * 60 + "\n")


def export_schedule_json(semester: list[dict], dependent_counts: dict[str, int], output_path: str) -> None:
    output = [
        {
            "title": c["course_code"],
            "credits": int(c.get("credits") or 3),
            "days": format_section_schedule(c.get("sections") or []),
            "course_name": c.get("course_name", ""),
            "prerequisites": parse_prerequisites(c),
            "unlocks_courses": dependent_counts.get(c["course_code"], 0),
        }
        for c in semester
    ]
    with open(output_path, "w") as f:
        json.dump(output, f, indent=2)
    print(f"[Output] Schedule written to {output_path}")


# ─────────────────────────────────────────────
# 7. Main
# ─────────────────────────────────────────────

def generate_schedule(
    user_uuid: str,
    output_path: str | None = None,
    max_credits_per_semester: int = MAX_CREDITS_PER_SEMESTER,
) -> list[dict]:
    courses             = load_courses_from_supabase()
    completed, recent   = load_transcript_from_supabase(user_uuid)   # <-- unpack tuple

    course_map, prereq_map, in_degree = build_prerequisite_graph(courses, completed)
    print(f"[Planner] {len(course_map)} courses remaining after filtering completed ones.")

    levels = topological_levels(course_map, prereq_map, in_degree, completed)
    print(f"[Planner] {len(levels[0]) if levels else 0} courses available this semester.")

    dependent_counts = count_dependents(prereq_map, course_map)

    semester = build_single_semester(
        levels, course_map, prereq_map, recent, max_credits=max_credits_per_semester
    )

    print_schedule(semester, dependent_counts)

    if not output_path:
        output_path = str(Path.cwd() / f"schedule_{user_uuid}.json")

    export_schedule_json(semester, dependent_counts, output_path)

    return semester


# ─────────────────────────────────────────────
# CLI entry point
# ─────────────────────────────────────────────

if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(
        description="Generate a CS course schedule from Supabase course list and transcript."
    )
    parser.add_argument(
        "uuid",
        help="The student's UUID to look up in the transcript table.",
    )
    parser.add_argument(
        "--output",
        default=None,
        help="Optional path to write the schedule as JSON (e.g. schedule.json).",
    )
    parser.add_argument(
        "--max-credits",
        type=int,
        default=MAX_CREDITS_PER_SEMESTER,
        help=f"Maximum credit hours per semester (default: {MAX_CREDITS_PER_SEMESTER}).",
    )

    args = parser.parse_args()

    try:
        generate_schedule(
            user_uuid=args.uuid,
            output_path=args.output,
            max_credits_per_semester=args.max_credits,
        )
    except (EnvironmentError, RuntimeError) as e:
        print(f"\n[Error] {e}", file=sys.stderr)
        sys.exit(1)
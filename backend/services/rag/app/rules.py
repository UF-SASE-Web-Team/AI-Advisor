import re
from typing import List, Dict, Set, Any


def parse_prereqs(prereq_text: str) -> List[Dict]:
    if not prereq_text:
        return []

    courses = re.findall(r'[A-Z]{2,4}\s?\d{3,4}[A-Z]?', prereq_text)

    courses = [c.replace(" ", "").upper() for c in courses]

    if not courses:
        return []

    prereq_lower = prereq_text.lower()

    if " or " in prereq_lower and " and " not in prereq_lower:
        return [{"any_of": sorted(set(courses))}]
    elif " and " in prereq_lower and " or " not in prereq_lower:
        return [{"all_of": sorted(set(courses))}]
    else:
        return [{"any_of": sorted(set(courses))}]


def has_prereqs(completed: Set[str], prereq_json: List[Dict]) -> bool:
    if not prereq_json:
        return True

    completed_normalized = {c.replace(" ", "").upper() for c in completed}

    for group in prereq_json:
        if "all_of" in group:
            required = {c.replace(" ", "").upper() for c in group["all_of"]}
            if not required.issubset(completed_normalized):
                return False
        if "any_of" in group:
            options = {c.replace(" ", "").upper() for c in group["any_of"]}
            if completed_normalized.isdisjoint(options):
                return False

    return True


def score_course(course: Dict[str, Any], profile: Dict[str, Any]) -> float:
    score = 0.0

    interests = [s.lower() for s in profile.get("interests", [])]
    course_text = " ".join([
        course.get("title", "") or course.get("name", ""),
        course.get("description", ""),
        " ".join(course.get("tags", []) or [])
    ]).lower()

    for interest in interests:
        if interest in course_text:
            score += 1.0

    term = (profile.get("term") or "").lower()
    offered_terms = course.get("offered_terms", [])
    if term and offered_terms:
        if term in [t.lower() for t in offered_terms]:
            score += 0.5

    if profile.get("level") and course.get("level") == profile.get("level"):
        score += 0.2

    credits = course.get("credits", 3)
    try:
        credits = int(credits) if credits else 3
        if 3 <= credits <= 4:
            score += 0.1
    except (ValueError, TypeError):
        pass

    return score


def recommend_courses(
    courses: List[Dict[str, Any]],
    completed: Set[str],
    interests: List[str],
    max_credits: int = 15,
    term: str = "",
    level: str = "undergrad"
) -> List[Dict[str, Any]]:
    completed_normalized = {c.replace(" ", "").upper() for c in completed}

    profile = {
        "interests": interests,
        "term": term,
        "level": level,
    }

    viable = []
    for course in courses:
        code = (course.get("code") or course.get("course_code", "")).replace(" ", "").upper()

        if code in completed_normalized:
            continue

        prereq_text = course.get("prerequisites", "") or course.get("prereq_text", "")
        prereq_json = parse_prereqs(prereq_text) if isinstance(prereq_text, str) else prereq_text

        if not has_prereqs(completed_normalized, prereq_json):
            continue

        course_copy = course.copy()
        course_copy["_score"] = score_course(course, profile)
        viable.append(course_copy)

    viable.sort(key=lambda x: x["_score"], reverse=True)

    selected = []
    total_credits = 0

    for course in viable:
        credits = course.get("credits", 3)
        try:
            credits = int(credits) if credits else 3
        except (ValueError, TypeError):
            credits = 3

        if total_credits + credits <= max_credits:
            selected.append(course)
            total_credits += credits

        if total_credits >= max_credits - 1:
            break

    return selected
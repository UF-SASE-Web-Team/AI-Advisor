from typing import List, Dict

def has_prereqs(completed: set[str], prereq_json) -> bool:
    """
    prereq_json format examples:
    []  -> no prereqs
    [{"all_of":["CS 125"]}]
    [{"any_of":["MATH 231","MATH 241"]}]
    """
    if not prereq_json: return True
    for group in prereq_json:
        if "all_of" in group:
            if not set(group["all_of"]).issubset(completed): return False
        if "any_of" in group:
            if completed.isdisjoint(set(group["any_of"])): return False
    return True

def score_course(course: Dict, profile: Dict) -> float:
    score = 0.0
    
    interests = [s.lower() for s in profile.get("interests", [])]
    blob = (course["title"] + " " + course["description"] + " " + " ".join(course.get("tags",[]) or [])).lower()
    score += sum(1.0 for i in interests if i in blob)

    term = (profile.get("term") or "").lower()
    if term and course.get("offered_terms") and term in [t.lower() for t in course["offered_terms"]]:
        score += 0.5

    if profile.get("level") and course.get("level")==profile["level"]:
        score += 0.2
    return score

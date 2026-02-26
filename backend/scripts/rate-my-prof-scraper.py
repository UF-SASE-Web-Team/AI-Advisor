# Store all the comments per class, from there condense, then maybe combine the condensed
# Filter the top 3 with the most likes
import requests
import json
import os
import base64
import time

GRAPHQL_URL = "https://www.ratemyprofessors.com/graphql"

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Content-Type": "application/json",
    "Authorization": "Basic dGVzdDp0ZXN0",
    "Referer": "https://www.ratemyprofessors.com/",
    "Origin": "https://www.ratemyprofessors.com",
}

UF_SCHOOL_ID = "U2Nob29sLTExMDA="
TARGET_DEPARTMENT = "Computer Science"
OUTPUT_FILE = "backend/data/uf_cs_professors.json"

SEARCH_QUERY = """
query TeacherSearchQuery($text: String!, $schoolID: ID) {
  newSearch {
    teachers(query: {text: $text, schoolID: $schoolID}, first: 1000) {
      edges {
        node {
          id
          firstName
          lastName
          avgRating
          avgDifficulty
          numRatings
          wouldTakeAgainPercent
          department
          school {
            name
            city
            state
          }
        }
      }
    }
  }
}
"""

RATINGS_QUERY = """
query RatingsListQuery($id: ID!, $count: Int!, $after: String) {
  node(id: $id) {
    ... on Teacher {
      ratings(first: $count, after: $after) {
        pageInfo {
          hasNextPage
          endCursor
        }
        edges {
          node {
            date
            class
            comment
            helpfulRating
            clarityRating
            difficultyRating
            grade
            wouldTakeAgain
            thumbsUpTotal
            thumbsDownTotal
          }
        }
      }
    }
  }
}
"""


def build_professor_url(prof_id: str) -> str:
    """Build a direct RMP profile URL from the base64 encoded professor ID."""
    decoded = base64.b64decode(prof_id).decode("utf-8")  # e.g. "Teacher-1234567"
    numeric_id = decoded.split("-")[-1]
    return f"https://www.ratemyprofessors.com/professor/{numeric_id}"


def build_summary(prof: dict) -> str:
    """Build a short summary of a professor."""
    rating     = prof.get("avgRating") or "N/A"
    difficulty = prof.get("avgDifficulty") or "N/A"
    num        = prof.get("numRatings", 0)
    wta        = prof.get("wouldTakeAgainPercent")
    wta_str    = f"{round(wta)}%" if wta and wta >= 0 else "N/A"
    school     = prof.get("school", {}).get("name", "University of Florida")
    dept       = prof.get("department", "N/A")

    return (
        f"{prof['firstName']} {prof['lastName']} is a {dept} professor at {school}. "
        f"Rated {rating}/5 in overall quality and {difficulty}/5 in difficulty "
        f"across {num} review(s). {wta_str} of students would take them again."
    )


def get_cs_professors() -> list:
    """Fetch all UF professors and filter to Computer Science department."""
    print("Fetching all CS professors from University of Florida...")

    response = requests.post(
        GRAPHQL_URL,
        json={
            "query": SEARCH_QUERY,
            "variables": {
                "text": "",
                "schoolID": UF_SCHOOL_ID
            }
        },
        headers=HEADERS,
    )
    response.raise_for_status()

    all_professors = [
        edge["node"]
        for edge in response.json()["data"]["newSearch"]["teachers"]["edges"]
    ]
    print(f"  Found {len(all_professors)} total professors at UF")

    cs_professors = [
        p for p in all_professors
        if p.get("department") and TARGET_DEPARTMENT.lower() in p["department"].lower()
    ]
    print(f"  Found {len(cs_professors)} Computer Science professors\n")

    return cs_professors


def get_ratings(professor_id: str, max_ratings: int = 100) -> list:
    """Fetch ratings for a professor so we can find the top 3 most liked."""
    all_ratings = []
    cursor = None

    while len(all_ratings) < max_ratings:
        batch = min(20, max_ratings - len(all_ratings))
        variables = {"id": professor_id, "count": batch}
        if cursor:
            variables["after"] = cursor

        response = requests.post(
            GRAPHQL_URL,
            json={"query": RATINGS_QUERY, "variables": variables},
            headers=HEADERS,
        )
        response.raise_for_status()

        data = response.json()["data"]["node"]["ratings"]
        all_ratings.extend([edge["node"] for edge in data["edges"]])

        if not data["pageInfo"]["hasNextPage"]:
            break
        cursor = data["pageInfo"]["endCursor"]

        time.sleep(1.5)

    return all_ratings


def get_top_3_comments(ratings: list) -> list:
    """Sort all ratings by thumbsUpTotal and return the top 3 most liked comments."""

    # Filter out ratings with no comment
    with_comments = [r for r in ratings if r.get("comment", "").strip()]

    # Sort by likes (thumbsUpTotal) descending
    sorted_ratings = sorted(with_comments, key=lambda r: r.get("thumbsUpTotal") or 0, reverse=True)

    # Take top 3 and format them cleanly
    top_3 = []
    for r in sorted_ratings[:3]:
        top_3.append({
            "comment":        r.get("comment", "").strip(),
            "class":          r.get("class", "N/A"),
            "date":           r.get("date", "N/A"),
            "rating":         f"{r.get('helpfulRating', 'N/A')}/5",
            "likes":          r.get("thumbsUpTotal", 0),
            "dislikes":       r.get("thumbsDownTotal", 0),
            "grade":          r.get("grade", "N/A"),
            "would_take_again": r.get("wouldTakeAgain"),
        })

    return top_3


def build_professor_entry(prof: dict, top_comments: list) -> dict:
    """Build a clean JSON entry with professor overview and top 3 comments."""
    url        = build_professor_url(prof["id"])
    summary    = build_summary(prof)
    avg_rating = prof.get("avgRating") or "N/A"
    difficulty = prof.get("avgDifficulty") or "N/A"
    wta        = prof.get("wouldTakeAgainPercent")

    return {
        "name":             f"{prof['firstName']} {prof['lastName']}",
        "department":       prof.get("department", "N/A"),
        "school":           prof.get("school", {}).get("name", "University of Florida"),
        "profile_url":      url,
        "overall_rating":   f"{avg_rating}/5",
        "avg_difficulty":   f"{difficulty}/5",
        "would_take_again": f"{round(wta)}%" if wta and wta >= 0 else "N/A",
        "total_reviews":    prof.get("numRatings", 0),
        "summary":          summary,
        "top_3_comments":   top_comments,
    }


def save_to_json(data: list, filename: str):
    """Save the complete dataset to a JSON file."""
    os.makedirs(os.path.dirname(filename), exist_ok=True)
    with open(filename, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=4)
    print(f"Saved {len(data)} professors to {filename}")


if __name__ == "__main__":
    # Step 1: Fetch all UF CS professors in a single API call
    professors = get_cs_professors()

    all_entries = []

    # Step 2: For each professor, fetch their ratings and extract top 3 comments
    for i, prof in enumerate(professors, start=1):
        full_name = f"{prof['firstName']} {prof['lastName']}"
        print(f"  [{i}/{len(professors)}] {full_name}...")

        try:
            ratings     = get_ratings(prof["id"], max_ratings=100)
            top_comments = get_top_3_comments(ratings)
            entry       = build_professor_entry(prof, top_comments)
            all_entries.append(entry)

            # Save after every professor so data is never lost mid-run
            save_to_json(all_entries, OUTPUT_FILE)

            print(f"    Rating   : {entry['overall_rating']}")
            print(f"    Link     : {entry['profile_url']}")
            print(f"    Summary  : {entry['summary']}")
            print(f"    Top comment: {top_comments[0]['comment'][:80] + '...' if top_comments else 'None'}\n")

        except Exception as e:
            print(f"    Skipping {full_name} due to error: {e}\n")

        time.sleep(2)

    print("\nDone!")
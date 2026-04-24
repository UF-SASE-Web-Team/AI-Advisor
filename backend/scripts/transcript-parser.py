import argparse
import json
import re
from pathlib import Path

from pypdf import PdfReader


TERM_PATTERN = re.compile(r"(?P<term>(?:Fall|Spring|Summer|Spr|Sum)\s20\d{2})")
GRADE_PATTERN = r"A\+?|A-|B\+?|B-|C\+?|C-|D\+?|D-|F|P|S|U|E|W|WF|NG|I\*?|N\*?|H"
CLASS_PATTERN = re.compile(
    rf"(?P<course>[A-Z]{{3,4}}\d{{4}}[CL]?)\s*"
    rf"(?:\(\d+\))?\s*"
    rf"(?P<name>.*?)\s+"
    rf"(?P<grade>{GRADE_PATTERN})\s+"
    rf"(?P<credit_attempted>[0-9]{{1,2}}\.[0-9]{{2}})\s+"
    rf"(?P<earned_hours>[0-9]{{1,2}}\.[0-9]{{2}})\s+"
    rf"(?P<carried_hours>[0-9]{{1,2}}(?:\.[0-9]{{1,2}})?|--)",
    re.DOTALL,
)


def _normalize_text(raw_text: str) -> str:
    # Keep line boundaries as spaces so regex can span wrapped rows consistently.
    return re.sub(r"\s+", " ", raw_text.replace("\xa0", " ")).strip()


def _parse_courses_by_term(text: str) -> dict[str, list[dict[str, str]]]:
    terms = list(TERM_PATTERN.finditer(text))
    classes = list(CLASS_PATTERN.finditer(text))

    terms_index = {t.end(): t.group("term") for t in terms}
    sorted_term_positions = sorted(terms_index.keys())

    grouped: dict[str, list[dict[str, str]]] = {}
    fallback_term = "Unknown Term"

    for match in classes:
        class_pos = match.start()
        term_name = fallback_term

        for term_pos in sorted_term_positions:
            if class_pos >= term_pos:
                term_name = terms_index[term_pos]
            else:
                break

        course_data = {k: (v or "") for k, v in match.groupdict().items()}
        course_data["course"] = course_data["course"].replace(" ", "")
        course_data["name"] = re.sub(r"\s+", " ", course_data["name"]).strip()

        grouped.setdefault(term_name, []).append(course_data)

    return grouped


def parseTranscript(transcript_path: str) -> dict[str, list[dict[str, str]]]:
    reader = PdfReader(transcript_path)
    raw_pages: list[str] = []

    for page in reader.pages:
        raw_pages.append(page.extract_text() or "")

    text = _normalize_text(" ".join(raw_pages))
    return _parse_courses_by_term(text)


def parseTransript(transcript, output):
    # Backward-compatible wrapper for existing calls with typo in name.
    parsed = parseTranscript(transcript)
    Path(output).write_text(json.dumps(parsed, indent=4), encoding="utf-8")


def main():
    parser = argparse.ArgumentParser(description="Parse UF transcript PDF into term-grouped JSON")
    parser.add_argument("input_pdf", nargs="?", default="papple.pdf", help="Path to transcript PDF")
    parser.add_argument("output_json", nargs="?", default="transcript.json", help="Path to output JSON")
    parser.add_argument(
        "--stdout",
        action="store_true",
        help="Print parsed JSON to stdout instead of writing a file",
    )
    args = parser.parse_args()

    parsed = parseTranscript(args.input_pdf)
    if args.stdout:
        print(json.dumps(parsed, ensure_ascii=False))
        return

    Path(args.output_json).write_text(json.dumps(parsed, indent=4), encoding="utf-8")


if __name__ == "__main__":
    main()

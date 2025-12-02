import json
from pathlib import Path
from typing import Optional
from dataclasses import dataclass


@dataclass
class Course:
    code: str
    name: str
    description: str
    prerequisites: str
    credits: int
    department: str
    instructors: list[str]
    meeting_times: list[dict]

    def to_document(self) -> str:
        # make to document string for future embedding
        parts = [
            f"Course: {self.code} - {self.name}",
            f"Department: {self.department}",
            f"Credits: {self.credits}",
        ]

        if self.description:
            parts.append(f"Description: {self.description}")

        if self.prerequisites:
            parts.append(f"Prerequisites: {self.prerequisites}")

        if self.instructors:
            parts.append(f"Instructors: {', '.join(self.instructors)}")

        if self.meeting_times:
            times = []
            for mt in self.meeting_times:
                days = ', '.join(mt.get('days', []))
                time_str = f"{mt.get('time_begin', '')} - {mt.get('time_end', '')}"
                times.append(f"{days} {time_str}")
            parts.append(f"Meeting Times: {'; '.join(times)}")

        return "\n".join(parts)


def load_courses_from_json(file_path: Path) -> list[Course]:
    with open(file_path, 'r', encoding='utf-8') as f:
        data = json.load(f)

    courses = []
    for course_data in data:
        instructors = set()
        meeting_times = []
        credits = 0
        department = ""

        for section in course_data.get('sections', []):
            if not credits:
                credits = section.get('credits', 0)

            if not department:
                department = section.get('deptName', '')

            for instructor in section.get('instructors', []):
                name = instructor.get('name', '')
                if name:
                    instructors.add(name)

            if not meeting_times:
                for mt in section.get('meetTimes', []):
                    meeting_times.append({
                        'days': mt.get('meetDays', []),
                        'time_begin': mt.get('meetTimeBegin', ''),
                        'time_end': mt.get('meetTimeEnd', ''),
                        'building': mt.get('meetBuilding', ''),
                        'room': mt.get('meetRoom', ''),
                    })

        course = Course(
            code=course_data.get('code', ''),
            name=course_data.get('name', ''),
            description=course_data.get('description', ''),
            prerequisites=course_data.get('prerequisites', ''),
            credits=credits,
            department=department,
            instructors=list(instructors),
            meeting_times=meeting_times,
        )
        courses.append(course)

    return courses


def get_course_by_code(courses: list[Course], code: str) -> Optional[Course]:
    # Find course by code
    code_upper = code.upper().replace(' ', '')
    for course in courses:
        if course.code.upper().replace(' ', '') == code_upper:
            return course
    return None

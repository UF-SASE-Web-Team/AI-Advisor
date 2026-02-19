import json
from pathlib import Path
from typing import Optional
from dataclasses import dataclass

@dataclass
class Course:
    id: str
    code: str
    name: str
    description: str
    prerequisites: str
    credits: int
    department: str
    instructors: list[str]
    topics: list[str]
    course_id: str
    term_ind: str
    
    def to_document(self) -> str:
        """Vectorize: name + description + topics only (no logistics)"""
        parts = []
        
        if self.name:
            parts.append(f"{self.name}")
        
        if self.description:
            parts.append(f"{self.description}")
        
        # Add topics if available
        if self.topics:
            topics_text = " ".join(self.topics)
            parts.append(f"{topics_text}")
        
        return "\n".join(parts)

def load_courses_from_json(file_path: Path) -> list[Course]:
    with open(file_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    courses = []
    for course_data in data:
        # Extract instructors and other data from sections
        instructors = set()
        credits = 0
        department = ""
        
        sections = course_data.get('sections', [])
        for section in sections:
            if not credits:
                credits = section.get('credits', 0)
            if not department:
                department = section.get('deptName', '')
            
            for instructor in section.get('instructors', []):
                name = instructor.get('name', '')
                if name:
                    instructors.add(name)
        
        # Fallback: extract department from code
        if not department and len(course_data.get('code', '')) >= 3:
            department = course_data.get('code', '')[:3]
        
        course = Course(
            id=course_data.get('id', course_data.get('code', '')),
            code=course_data.get('code', ''),
            name=course_data.get('name', ''),
            description=course_data.get('description', ''),
            prerequisites=course_data.get('prerequisites', ''),
            credits=credits,
            department=department,
            instructors=list(instructors),
            topics=course_data.get('topics', []),
            course_id=course_data.get('courseId', ''),
            term_ind=course_data.get('termInd', ''),
        )
        courses.append(course)
    
    return courses

def get_course_by_code(courses: list[Course], code: str) -> Optional[Course]:
    code_upper = code.upper().replace(' ', '')
    for course in courses:
        if course.code.upper().replace(' ', '') == code_upper:
            return course
    return None

def get_course_by_id(courses: list[Course], course_id: str) -> Optional[Course]:
    for course in courses:
        if course.id == course_id:
            return course
    return None
from google.protobuf.internal import containers as _containers
from google.protobuf import descriptor as _descriptor
from google.protobuf import message as _message
from collections.abc import Iterable as _Iterable, Mapping as _Mapping
from typing import ClassVar as _ClassVar, Optional as _Optional, Union as _Union

DESCRIPTOR: _descriptor.FileDescriptor

class QueryRequest(_message.Message):
    __slots__ = ("question", "max_results", "session_id")
    QUESTION_FIELD_NUMBER: _ClassVar[int]
    MAX_RESULTS_FIELD_NUMBER: _ClassVar[int]
    SESSION_ID_FIELD_NUMBER: _ClassVar[int]
    question: str
    max_results: int
    session_id: str
    def __init__(self, question: _Optional[str] = ..., max_results: _Optional[int] = ..., session_id: _Optional[str] = ...) -> None: ...

class QueryResponse(_message.Message):
    __slots__ = ("answer", "sources", "error_message", "session_id")
    ANSWER_FIELD_NUMBER: _ClassVar[int]
    SOURCES_FIELD_NUMBER: _ClassVar[int]
    ERROR_MESSAGE_FIELD_NUMBER: _ClassVar[int]
    SESSION_ID_FIELD_NUMBER: _ClassVar[int]
    answer: str
    sources: _containers.RepeatedCompositeFieldContainer[SourceDocument]
    error_message: str
    session_id: str
    def __init__(self, answer: _Optional[str] = ..., sources: _Optional[_Iterable[_Union[SourceDocument, _Mapping]]] = ..., error_message: _Optional[str] = ..., session_id: _Optional[str] = ...) -> None: ...

class SourceDocument(_message.Message):
    __slots__ = ("course_code", "course_name", "content", "relevance_score")
    COURSE_CODE_FIELD_NUMBER: _ClassVar[int]
    COURSE_NAME_FIELD_NUMBER: _ClassVar[int]
    CONTENT_FIELD_NUMBER: _ClassVar[int]
    RELEVANCE_SCORE_FIELD_NUMBER: _ClassVar[int]
    course_code: str
    course_name: str
    content: str
    relevance_score: float
    def __init__(self, course_code: _Optional[str] = ..., course_name: _Optional[str] = ..., content: _Optional[str] = ..., relevance_score: _Optional[float] = ...) -> None: ...

class CourseInfoRequest(_message.Message):
    __slots__ = ("course_code",)
    COURSE_CODE_FIELD_NUMBER: _ClassVar[int]
    course_code: str
    def __init__(self, course_code: _Optional[str] = ...) -> None: ...

class CourseInfoResponse(_message.Message):
    __slots__ = ("course_code", "course_name", "description", "prerequisites", "credits", "department", "instructors", "meeting_times", "found", "error_message")
    COURSE_CODE_FIELD_NUMBER: _ClassVar[int]
    COURSE_NAME_FIELD_NUMBER: _ClassVar[int]
    DESCRIPTION_FIELD_NUMBER: _ClassVar[int]
    PREREQUISITES_FIELD_NUMBER: _ClassVar[int]
    CREDITS_FIELD_NUMBER: _ClassVar[int]
    DEPARTMENT_FIELD_NUMBER: _ClassVar[int]
    INSTRUCTORS_FIELD_NUMBER: _ClassVar[int]
    MEETING_TIMES_FIELD_NUMBER: _ClassVar[int]
    FOUND_FIELD_NUMBER: _ClassVar[int]
    ERROR_MESSAGE_FIELD_NUMBER: _ClassVar[int]
    course_code: str
    course_name: str
    description: str
    prerequisites: str
    credits: int
    department: str
    instructors: _containers.RepeatedScalarFieldContainer[str]
    meeting_times: _containers.RepeatedCompositeFieldContainer[MeetingTime]
    found: bool
    error_message: str
    def __init__(self, course_code: _Optional[str] = ..., course_name: _Optional[str] = ..., description: _Optional[str] = ..., prerequisites: _Optional[str] = ..., credits: _Optional[int] = ..., department: _Optional[str] = ..., instructors: _Optional[_Iterable[str]] = ..., meeting_times: _Optional[_Iterable[_Union[MeetingTime, _Mapping]]] = ..., found: bool = ..., error_message: _Optional[str] = ...) -> None: ...

class MeetingTime(_message.Message):
    __slots__ = ("days", "time_begin", "time_end", "building", "room")
    DAYS_FIELD_NUMBER: _ClassVar[int]
    TIME_BEGIN_FIELD_NUMBER: _ClassVar[int]
    TIME_END_FIELD_NUMBER: _ClassVar[int]
    BUILDING_FIELD_NUMBER: _ClassVar[int]
    ROOM_FIELD_NUMBER: _ClassVar[int]
    days: _containers.RepeatedScalarFieldContainer[str]
    time_begin: str
    time_end: str
    building: str
    room: str
    def __init__(self, days: _Optional[_Iterable[str]] = ..., time_begin: _Optional[str] = ..., time_end: _Optional[str] = ..., building: _Optional[str] = ..., room: _Optional[str] = ...) -> None: ...

class HealthRequest(_message.Message):
    __slots__ = ()
    def __init__(self) -> None: ...

class HealthResponse(_message.Message):
    __slots__ = ("status",)
    STATUS_FIELD_NUMBER: _ClassVar[int]
    status: str
    def __init__(self, status: _Optional[str] = ...) -> None: ...

class CreateSessionRequest(_message.Message):
    __slots__ = ("title",)
    TITLE_FIELD_NUMBER: _ClassVar[int]
    title: str
    def __init__(self, title: _Optional[str] = ...) -> None: ...

class CreateSessionResponse(_message.Message):
    __slots__ = ("session_id", "error_message")
    SESSION_ID_FIELD_NUMBER: _ClassVar[int]
    ERROR_MESSAGE_FIELD_NUMBER: _ClassVar[int]
    session_id: str
    error_message: str
    def __init__(self, session_id: _Optional[str] = ..., error_message: _Optional[str] = ...) -> None: ...

class RecommendRequest(_message.Message):
    __slots__ = ("completed_courses", "interests", "max_credits", "term", "level")
    COMPLETED_COURSES_FIELD_NUMBER: _ClassVar[int]
    INTERESTS_FIELD_NUMBER: _ClassVar[int]
    MAX_CREDITS_FIELD_NUMBER: _ClassVar[int]
    TERM_FIELD_NUMBER: _ClassVar[int]
    LEVEL_FIELD_NUMBER: _ClassVar[int]
    completed_courses: _containers.RepeatedScalarFieldContainer[str]
    interests: _containers.RepeatedScalarFieldContainer[str]
    max_credits: int
    term: str
    level: str
    def __init__(self, completed_courses: _Optional[_Iterable[str]] = ..., interests: _Optional[_Iterable[str]] = ..., max_credits: _Optional[int] = ..., term: _Optional[str] = ..., level: _Optional[str] = ...) -> None: ...

class RecommendResponse(_message.Message):
    __slots__ = ("courses", "total_credits", "explanation", "error_message")
    COURSES_FIELD_NUMBER: _ClassVar[int]
    TOTAL_CREDITS_FIELD_NUMBER: _ClassVar[int]
    EXPLANATION_FIELD_NUMBER: _ClassVar[int]
    ERROR_MESSAGE_FIELD_NUMBER: _ClassVar[int]
    courses: _containers.RepeatedCompositeFieldContainer[RecommendedCourse]
    total_credits: int
    explanation: str
    error_message: str
    def __init__(self, courses: _Optional[_Iterable[_Union[RecommendedCourse, _Mapping]]] = ..., total_credits: _Optional[int] = ..., explanation: _Optional[str] = ..., error_message: _Optional[str] = ...) -> None: ...

class RecommendedCourse(_message.Message):
    __slots__ = ("course_code", "course_name", "credits", "description", "score", "prerequisites")
    COURSE_CODE_FIELD_NUMBER: _ClassVar[int]
    COURSE_NAME_FIELD_NUMBER: _ClassVar[int]
    CREDITS_FIELD_NUMBER: _ClassVar[int]
    DESCRIPTION_FIELD_NUMBER: _ClassVar[int]
    SCORE_FIELD_NUMBER: _ClassVar[int]
    PREREQUISITES_FIELD_NUMBER: _ClassVar[int]
    course_code: str
    course_name: str
    credits: int
    description: str
    score: float
    prerequisites: str
    def __init__(self, course_code: _Optional[str] = ..., course_name: _Optional[str] = ..., credits: _Optional[int] = ..., description: _Optional[str] = ..., score: _Optional[float] = ..., prerequisites: _Optional[str] = ...) -> None: ...

from __future__ import annotations

from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field

from .config import ChapterSource, ChapterStatus


# Subject schemas
class SubjectCreate(BaseModel):
    name: str
    color: str = "#007AFF"
    description: Optional[str] = None


class SubjectUpdate(BaseModel):
    name: Optional[str] = None
    color: Optional[str] = None
    description: Optional[str] = None


class SubjectRead(BaseModel):
    id: str
    name: str
    color: str
    description: Optional[str]
    created_at: datetime
    lessons_count: int = Field(..., alias="lessonsCount")
    completed_lessons: int = Field(..., alias="completedLessons")

    class Config:
        allow_population_by_field_name = True


# Lesson schemas
class LessonCreate(BaseModel):
    subject_id: str = Field(..., alias="subjectId")
    name: str
    description: Optional[str] = None

    class Config:
        allow_population_by_field_name = True


class LessonRead(BaseModel):
    id: str
    subject_id: str = Field(..., alias="subjectId")
    name: str
    description: Optional[str]
    created_at: datetime
    chapters_count: int = Field(..., alias="chaptersCount")
    completed_chapters: int = Field(..., alias="completedChapters")
    duration: int

    class Config:
        allow_population_by_field_name = True


# Chapter schemas
class ChapterBase(BaseModel):
    lesson_id: str = Field(..., alias="lessonId")
    name: str
    description: Optional[str] = None

    class Config:
        allow_population_by_field_name = True


class ChapterFromTextCreate(ChapterBase):
    text_input: str = Field(..., alias="textInput")


class ChapterFromAudioCreate(ChapterBase):
    filename: Optional[str] = None


class ChapterFromAudioUrlCreate(ChapterBase):
    audio_url: str = Field(..., alias="audioUrl")


class ChapterRead(BaseModel):
    id: str
    lesson_id: str = Field(..., alias="lessonId")
    name: str
    description: Optional[str]
    status: ChapterStatus
    source_type: ChapterSource = Field(..., alias="sourceType")
    summary: Optional[str]
    bullet_points: List[str] = Field(default_factory=list, alias="bulletPoints")
    sections: List[dict] = Field(default_factory=list)
    transcript: Optional[str]
    audio_remote_url: Optional[str] = Field(default=None, alias="audioRemoteUrl")
    is_processing: bool = Field(..., alias="isProcessing")
    is_completed: bool = Field(..., alias="isCompleted")
    duration: Optional[int]
    flashcards: List["FlashcardRead"] = Field(default_factory=list)
    quiz: List["QuizQuestionRead"] = Field(default_factory=list)
    created_at: datetime
    completed_at: Optional[datetime]
    failure_reason: Optional[str] = Field(default=None, alias="failureReason")

    class Config:
        allow_population_by_field_name = True


class FlashcardRead(BaseModel):
    id: str
    question: str
    answer: str


class QuizQuestionRead(BaseModel):
    id: str
    question: str
    options: List[str]
    correct_answer: int = Field(..., alias="correctAnswer")
    explanation: str

    class Config:
        allow_population_by_field_name = True


class ChatMessageRead(BaseModel):
    id: str
    role: str
    content: str
    created_at: datetime


class ChatMessageCreate(BaseModel):
    content: str


class ChatResponse(BaseModel):
    messages: List[ChatMessageRead]
    assistant_message: ChatMessageRead


ChapterRead.update_forward_refs()

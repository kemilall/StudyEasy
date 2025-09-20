from __future__ import annotations

from datetime import datetime
from typing import List, Optional, TYPE_CHECKING
from uuid import uuid4

from sqlalchemy import Column, Enum as SAEnum, ForeignKey, JSON, String
from sqlalchemy.orm import Mapped
from sqlmodel import Field, Relationship, SQLModel

from .config import ChapterSource, ChapterStatus


class SubjectModel(SQLModel, table=True):
    __tablename__ = "subjects"

    id: str = Field(default_factory=lambda: str(uuid4()), primary_key=True, index=True)
    name: str = Field(index=True)
    color: str = Field(default="#007AFF")
    description: Optional[str] = Field(default=None)
    created_at: datetime = Field(default_factory=datetime.utcnow)

    lessons: Mapped[List["LessonModel"]] = Relationship(back_populates="subject", sa_relationship_kwargs={"cascade": "all, delete"})


class LessonModel(SQLModel, table=True):
    __tablename__ = "lessons"

    id: str = Field(default_factory=lambda: str(uuid4()), primary_key=True, index=True)
    subject_id: str = Field(foreign_key="subjects.id", index=True)
    name: str
    description: Optional[str] = Field(default=None)
    created_at: datetime = Field(default_factory=datetime.utcnow)

    subject: Mapped[SubjectModel] = Relationship(back_populates="lessons")
    chapters: Mapped[List["ChapterModel"]] = Relationship(back_populates="lesson", sa_relationship_kwargs={"cascade": "all, delete"})


class ChapterModel(SQLModel, table=True):
    __tablename__ = "chapters"

    id: str = Field(default_factory=lambda: str(uuid4()), primary_key=True, index=True)
    lesson_id: str = Field(foreign_key="lessons.id", index=True)
    name: str
    description: Optional[str] = Field(default=None)
    status: ChapterStatus = Field(default=ChapterStatus.pending, sa_column=Column(SAEnum(ChapterStatus)))
    source_type: ChapterSource = Field(default=ChapterSource.text, sa_column=Column(SAEnum(ChapterSource)))
    input_text: Optional[str] = Field(default=None)
    transcript_path: Optional[str] = Field(default=None)
    audio_path: Optional[str] = Field(default=None)
    audio_remote_url: Optional[str] = Field(default=None, sa_column=Column(String, nullable=True))
    summary: Optional[str] = Field(default=None)
    bullet_points: List[str] = Field(default_factory=list, sa_column=Column(JSON))
    course_sections: List[dict] = Field(default_factory=list, sa_column=Column(JSON))
    flashcards_generated: bool = Field(default=False)
    quiz_generated: bool = Field(default=False)
    flashcard_count: int = Field(default=0)
    quiz_question_count: int = Field(default=0)
    duration_minutes: Optional[int] = Field(default=None)
    is_completed: bool = Field(default=False)
    is_processing: bool = Field(default=False)
    failure_reason: Optional[str] = Field(default=None)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    processing_started_at: Optional[datetime] = Field(default=None)
    completed_at: Optional[datetime] = Field(default=None)

    lesson: Mapped[LessonModel] = Relationship(back_populates="chapters")
    flashcards: Mapped[List["FlashcardModel"]] = Relationship(back_populates="chapter", sa_relationship_kwargs={"cascade": "all, delete"})
    quiz_questions: Mapped[List["QuizQuestionModel"]] = Relationship(back_populates="chapter", sa_relationship_kwargs={"cascade": "all, delete"})
    chat_history: Mapped[List["ChatMessageModel"]] = Relationship(back_populates="chapter", sa_relationship_kwargs={"cascade": "all, delete"})


class FlashcardModel(SQLModel, table=True):
    __tablename__ = "flashcards"

    id: str = Field(default_factory=lambda: str(uuid4()), primary_key=True)
    chapter_id: str = Field(foreign_key="chapters.id", index=True)
    question: str
    answer: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

    chapter: Mapped[ChapterModel] = Relationship(back_populates="flashcards")


class QuizQuestionModel(SQLModel, table=True):
    __tablename__ = "quiz_questions"

    id: str = Field(default_factory=lambda: str(uuid4()), primary_key=True)
    chapter_id: str = Field(foreign_key="chapters.id", index=True)
    question: str
    options: List[str] = Field(sa_column=Column(JSON))
    correct_answer: int
    explanation: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

    chapter: Mapped[ChapterModel] = Relationship(back_populates="quiz_questions")


class ChatMessageModel(SQLModel, table=True):
    __tablename__ = "chat_messages"

    id: str = Field(default_factory=lambda: str(uuid4()), primary_key=True)
    chapter_id: str = Field(foreign_key="chapters.id", index=True)
    role: str = Field(regex="^(user|assistant)$")
    content: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

    chapter: Mapped[ChapterModel] = Relationship(back_populates="chat_history")

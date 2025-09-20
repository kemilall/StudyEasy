from __future__ import annotations

from typing import List

from sqlmodel import Session, select

from backend.config import ChapterStatus
from backend.models import (
    ChapterModel,
    FlashcardModel,
    LessonModel,
    QuizQuestionModel,
    SubjectModel,
)
from backend.schemas import (
    ChapterRead,
    FlashcardRead,
    LessonRead,
    QuizQuestionRead,
    SubjectRead,
)


def compute_lesson_progress(lesson: LessonModel, session: Session) -> tuple[int, int, int]:
    chapters: List[ChapterModel] = session.exec(
        select(ChapterModel).where(ChapterModel.lesson_id == lesson.id)
    ).all()
    chapters_count = len(chapters)
    completed = sum(1 for chapter in chapters if chapter.is_completed)
    duration = sum(ch.duration_minutes or 0 for ch in chapters)
    return chapters_count, completed, duration


def serialize_lesson(lesson: LessonModel, session: Session) -> LessonRead:
    chapters_count, completed, duration = compute_lesson_progress(lesson, session)
    return LessonRead(
        id=lesson.id,
        subject_id=lesson.subject_id,
        name=lesson.name,
        description=lesson.description,
        created_at=lesson.created_at,
        chapters_count=chapters_count,
        completed_chapters=completed,
        duration=duration,
    )


def serialize_subject(subject: SubjectModel, session: Session) -> SubjectRead:
    lessons: List[LessonModel] = session.exec(
        select(LessonModel).where(LessonModel.subject_id == subject.id)
    ).all()
    lessons_count = len(lessons)
    completed = 0
    for lesson in lessons:
        chapters = session.exec(
            select(ChapterModel).where(ChapterModel.lesson_id == lesson.id)
        ).all()
        if chapters and all(ch.is_completed for ch in chapters):
            completed += 1
    return SubjectRead(
        id=subject.id,
        name=subject.name,
        color=subject.color,
        description=subject.description,
        created_at=subject.created_at,
        lessons_count=lessons_count,
        completed_lessons=completed,
    )


def serialize_flashcards(chapter_id: str, session: Session) -> List[FlashcardRead]:
    flashcards = session.exec(
        select(FlashcardModel).where(FlashcardModel.chapter_id == chapter_id)
    ).all()
    return [
        FlashcardRead(id=item.id, question=item.question, answer=item.answer)
        for item in flashcards
    ]


def serialize_quiz(chapter_id: str, session: Session) -> List[QuizQuestionRead]:
    questions = session.exec(
        select(QuizQuestionModel).where(QuizQuestionModel.chapter_id == chapter_id)
    ).all()
    return [
        QuizQuestionRead(
            id=item.id,
            question=item.question,
            options=item.options,
            correctAnswer=item.correct_answer,
            explanation=item.explanation,
        )
        for item in questions
    ]


def serialize_chapter(chapter: ChapterModel, session: Session) -> ChapterRead:
    flashcards = serialize_flashcards(chapter.id, session)
    quiz = serialize_quiz(chapter.id, session)
    return ChapterRead(
        id=chapter.id,
        lesson_id=chapter.lesson_id,
        name=chapter.name,
        description=chapter.description,
        status=chapter.status,
        source_type=chapter.source_type,
        summary=chapter.summary,
        bullet_points=chapter.bullet_points or [],
        sections=chapter.course_sections or [],
        transcript=chapter.input_text,
        audioRemoteUrl=chapter.audio_remote_url,
        is_processing=chapter.is_processing,
        is_completed=chapter.is_completed,
        duration=chapter.duration_minutes or 0,
        flashcards=flashcards,
        quiz=quiz,
        created_at=chapter.created_at,
        completed_at=chapter.completed_at,
        failure_reason=chapter.failure_reason,
    )

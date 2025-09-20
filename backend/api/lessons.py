from __future__ import annotations

from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select

from backend.database import get_session
from backend.models import LessonModel, SubjectModel
from backend.schemas import LessonCreate, LessonRead

from .utils import serialize_lesson

router = APIRouter(prefix="/lessons", tags=["lessons"])


@router.post("", response_model=LessonRead, status_code=201)
def create_lesson(payload: LessonCreate, session: Session = Depends(get_session)) -> LessonRead:
    subject = session.get(SubjectModel, payload.subject_id)
    if not subject:
        raise HTTPException(status_code=404, detail="Matière introuvable")

    lesson = LessonModel(
        subject_id=payload.subject_id,
        name=payload.name,
        description=payload.description,
    )
    session.add(lesson)
    session.commit()
    session.refresh(lesson)
    return serialize_lesson(lesson, session)


@router.get("/{lesson_id}", response_model=LessonRead)
def get_lesson(lesson_id: str, session: Session = Depends(get_session)) -> LessonRead:
    lesson = session.get(LessonModel, lesson_id)
    if not lesson:
        raise HTTPException(status_code=404, detail="Leçon introuvable")
    return serialize_lesson(lesson, session)


@router.get("/by-subject/{subject_id}", response_model=List[LessonRead])
def list_lessons_by_subject(subject_id: str, session: Session = Depends(get_session)) -> List[LessonRead]:
    lessons = session.exec(select(LessonModel).where(LessonModel.subject_id == subject_id)).all()
    return [serialize_lesson(lesson, session) for lesson in lessons]

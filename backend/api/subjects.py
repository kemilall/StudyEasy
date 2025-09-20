from __future__ import annotations

from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select

from backend.database import get_session
from backend.models import SubjectModel
from backend.schemas import SubjectCreate, SubjectRead

from .utils import serialize_subject

router = APIRouter(prefix="/subjects", tags=["subjects"])


@router.get("", response_model=List[SubjectRead])
def list_subjects(session: Session = Depends(get_session)) -> List[SubjectRead]:
    subjects = session.exec(select(SubjectModel)).all()
    return [serialize_subject(subject, session) for subject in subjects]


@router.post("", response_model=SubjectRead, status_code=201)
def create_subject(payload: SubjectCreate, session: Session = Depends(get_session)) -> SubjectRead:
    subject = SubjectModel(name=payload.name, color=payload.color, description=payload.description)
    session.add(subject)
    session.commit()
    session.refresh(subject)
    return serialize_subject(subject, session)


@router.get("/{subject_id}", response_model=SubjectRead)
def get_subject(subject_id: str, session: Session = Depends(get_session)) -> SubjectRead:
    subject = session.get(SubjectModel, subject_id)
    if not subject:
        raise HTTPException(status_code=404, detail="Matière introuvable")
    return serialize_subject(subject, session)

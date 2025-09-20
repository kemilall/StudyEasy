from __future__ import annotations

from pathlib import Path
from typing import List, Optional

from fastapi import (
    APIRouter,
    BackgroundTasks,
    Depends,
    File,
    Form,
    HTTPException,
    UploadFile,
)
from sqlmodel import Session, select

from backend.config import AUDIO_STORAGE_DIR, ChapterSource, ChapterStatus
from backend.database import get_session
from backend.models import ChapterModel, LessonModel
from backend.schemas import (
    ChapterFromAudioUrlCreate,
    ChapterFromTextCreate,
    ChapterRead,
    FlashcardRead,
    QuizQuestionRead,
)
from backend.services.chapter_processor import process_chapter

from .utils import serialize_chapter, serialize_flashcards, serialize_quiz

router = APIRouter(prefix="/chapters", tags=["chapters"])


def _validate_lesson(session: Session, lesson_id: str) -> LessonModel:
    lesson = session.get(LessonModel, lesson_id)
    if not lesson:
        raise HTTPException(status_code=404, detail="Leçon introuvable")
    return lesson


async def _save_upload_file(upload_file: UploadFile, destination: Path) -> None:
    destination.parent.mkdir(parents=True, exist_ok=True)
    try:
        with destination.open("wb") as buffer:
            while True:
                chunk = await upload_file.read(1024 * 1024)
                if not chunk:
                    break
                buffer.write(chunk)
    finally:
        await upload_file.close()


@router.post("/from-text", response_model=ChapterRead, status_code=201)
async def create_chapter_from_text(
    payload: ChapterFromTextCreate,
    background_tasks: BackgroundTasks,
    session: Session = Depends(get_session),
) -> ChapterRead:
    _validate_lesson(session, payload.lesson_id)
    chapter = ChapterModel(
        lesson_id=payload.lesson_id,
        name=payload.name,
        description=payload.description,
        source_type=ChapterSource.text,
        status=ChapterStatus.pending,
        input_text=payload.text_input,
        is_processing=True,
    )
    session.add(chapter)
    session.commit()
    session.refresh(chapter)
    background_tasks.add_task(process_chapter, chapter.id)
    return serialize_chapter(chapter, session)


@router.post("/from-audio", response_model=ChapterRead, status_code=201)
async def create_chapter_from_audio(
    background_tasks: BackgroundTasks,
    lesson_id: str = Form(..., alias="lessonId"),
    name: str = Form(...),
    description: Optional[str] = Form(None),
    audio_file: UploadFile = File(...),
    session: Session = Depends(get_session),
) -> ChapterRead:
    _validate_lesson(session, lesson_id)

    chapter = ChapterModel(
        lesson_id=lesson_id,
        name=name,
        description=description,
        source_type=ChapterSource.audio,
        status=ChapterStatus.pending,
        is_processing=True,
    )
    session.add(chapter)
    session.commit()
    session.refresh(chapter)

    extension = Path(audio_file.filename or "audio").suffix or ".mp3"
    audio_path = Path(AUDIO_STORAGE_DIR) / f"{chapter.id}{extension}"
    await _save_upload_file(audio_file, audio_path)

    chapter.audio_path = str(audio_path)
    session.add(chapter)
    session.commit()

    background_tasks.add_task(process_chapter, chapter.id)
    return serialize_chapter(chapter, session)


@router.post("/from-audio-url", response_model=ChapterRead, status_code=201)
async def create_chapter_from_audio_url(
    payload: ChapterFromAudioUrlCreate,
    background_tasks: BackgroundTasks,
    session: Session = Depends(get_session),
) -> ChapterRead:
    _validate_lesson(session, payload.lesson_id)

    chapter = ChapterModel(
        lesson_id=payload.lesson_id,
        name=payload.name,
        description=payload.description,
        source_type=ChapterSource.audio,
        status=ChapterStatus.pending,
        is_processing=True,
        audio_remote_url=payload.audio_url,
    )
    session.add(chapter)
    session.commit()
    session.refresh(chapter)

    background_tasks.add_task(process_chapter, chapter.id)
    return serialize_chapter(chapter, session)


@router.get("/{chapter_id}", response_model=ChapterRead)
def get_chapter(chapter_id: str, session: Session = Depends(get_session)) -> ChapterRead:
    chapter = session.get(ChapterModel, chapter_id)
    if not chapter:
        raise HTTPException(status_code=404, detail="Chapitre introuvable")
    return serialize_chapter(chapter, session)


@router.get("/by-lesson/{lesson_id}", response_model=List[ChapterRead])
def list_chapters_by_lesson(lesson_id: str, session: Session = Depends(get_session)) -> List[ChapterRead]:
    chapters = session.exec(select(ChapterModel).where(ChapterModel.lesson_id == lesson_id).order_by(ChapterModel.created_at.desc())).all()
    return [serialize_chapter(chapter, session) for chapter in chapters]


@router.get("/{chapter_id}/flashcards", response_model=List[FlashcardRead])
def get_flashcards(chapter_id: str, session: Session = Depends(get_session)) -> List[FlashcardRead]:
    chapter = session.get(ChapterModel, chapter_id)
    if not chapter:
        raise HTTPException(status_code=404, detail="Chapitre introuvable")
    return serialize_flashcards(chapter_id, session)


@router.get("/{chapter_id}/quiz", response_model=List[QuizQuestionRead])
def get_quiz(chapter_id: str, session: Session = Depends(get_session)) -> List[QuizQuestionRead]:
    chapter = session.get(ChapterModel, chapter_id)
    if not chapter:
        raise HTTPException(status_code=404, detail="Chapitre introuvable")
    return serialize_quiz(chapter_id, session)

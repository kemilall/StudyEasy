from __future__ import annotations

import math
import os
from datetime import datetime
from pathlib import Path
from typing import List, Sequence
from urllib.parse import urlparse

import requests
from pydantic import BaseModel, Field

from backend.config import (
    AUDIO_STORAGE_DIR,
    ChapterSource,
    ChapterStatus,
    TRANSCRIPT_STORAGE_DIR,
)
from backend.database import session_scope
from backend.models import ChapterModel, FlashcardModel, QuizQuestionModel

from .openai_client import get_openai_client


class CourseSection(BaseModel):
    heading: str = Field(..., description="Titre du segment du cours")
    overview: str = Field(..., description="Présentation narrative de la section")
    key_points: List[str] = Field(..., description="Liste des points clés sans perte d'information")
    detailed_content: str = Field(..., description="Cours détaillé, structuré et exhaustif")


class CourseContent(BaseModel):
    summary: str = Field(..., description="Résumé global du cours, complet et structuré")
    bullet_points: List[str] = Field(..., description="Points essentiels à retenir")
    sections: List[CourseSection] = Field(..., description="Sections du cours organisées")
    estimated_duration_minutes: int = Field(..., alias="estimatedDurationMinutes")


class FlashcardItem(BaseModel):
    question: str
    answer: str


class FlashcardCollection(BaseModel):
    flashcards: List[FlashcardItem]


class QuizItem(BaseModel):
    question: str
    options: List[str]
    correct_answer_index: int = Field(..., alias="correctAnswerIndex")
    explanation: str


class QuizCollection(BaseModel):
    questions: List[QuizItem]


def _estimate_duration_from_text(text: str) -> int:
    words = len(text.split())
    if words == 0:
        return 1
    minutes = words / 160
    return max(1, int(math.ceil(minutes)))


def _save_transcript(chapter_id: str, transcript: str) -> str:
    filename = f"{chapter_id}.txt"
    path = Path(TRANSCRIPT_STORAGE_DIR) / filename
    path.write_text(transcript, encoding="utf-8")
    return str(path)


def _transcribe_audio(audio_path: str) -> str:
    client = get_openai_client()
    with open(audio_path, "rb") as audio_file:
        transcription = client.audio.transcriptions.create(
            model="gpt-4o-transcribe",
            file=audio_file,
            response_format="text",
        )
    return transcription


def _download_remote_audio(chapter_id: str, remote_url: str) -> str:
    parsed = urlparse(remote_url)
    suffix = Path(parsed.path).suffix or ".mp3"
    destination = Path(AUDIO_STORAGE_DIR) / f"{chapter_id}{suffix}"
    response = requests.get(remote_url, stream=True, timeout=120)
    response.raise_for_status()
    with destination.open("wb") as buffer:
        for chunk in response.iter_content(chunk_size=1024 * 1024):
            if chunk:
                buffer.write(chunk)
    return str(destination)


def _generate_course_content(raw_text: str) -> CourseContent:
    client = get_openai_client()
    response = client.responses.parse(
        model="gpt-5",
        input=[
            {
                "role": "system",
                "content": (
                (
                    "Tu es un expert pédagogique francophone. Tu analyses un support de cours ou"
                    " une retranscription et tu produis un contenu didactique complet sans omettre"
                    " la moindre information pertinente. L'organisation doit être claire, hiérarchisée"
                    " et exploitable telle quelle pour réviser. Réponds uniquement avec un JSON"
                    " conforme au schéma {'summary': str, 'bullet_points': [str], 'sections':"
                    " [{'heading': str, 'overview': str, 'key_points': [str], 'detailed_content': str}],"
                    " 'estimatedDurationMinutes': int}."
                )
                ),
            },
            {
                "role": "user",
                "content": (
                    "Voici le contenu d'origine. Génére un cours exhaustif et structuré,"
                    " en restituant toutes les informations essentielles :\n\n"
                    f"{raw_text}"
                ),
            },
        ],
        text_format=CourseContent,
    )
    course: CourseContent = response.output_parsed
    if course.estimated_duration_minutes <= 0:
        course.estimated_duration_minutes = _estimate_duration_from_text(raw_text)
    return course


def _generate_flashcards(raw_text: str) -> Sequence[FlashcardItem]:
    client = get_openai_client()
    response = client.responses.parse(
        model="gpt-5",
        input=[
            {
                "role": "system",
                "content": (
                    "Tu es un générateur de flashcards pour des révisions intensives."
                    " Crée autant de cartes que nécessaire pour couvrir toutes les notions"
                    " importantes sans omission. Les cartes doivent être en français,"
                    " précises et non redondantes. Réponds exclusivement avec un JSON"
                    " respectant le schéma {'flashcards': [{'question': str, 'answer': str}, ...]}."
                ),
            },
            {
                "role": "user",
                "content": (
                    "À partir du contenu suivant, liste des flashcards question/réponse"
                    " maximales couvrant 100% des connaissances utiles :\n\n"
                    f"{raw_text}"
                ),
            },
        ],
        text_format=FlashcardCollection,
    )
    data: FlashcardCollection = response.output_parsed
    return data.flashcards


def _generate_quiz(raw_text: str) -> Sequence[QuizItem]:
    client = get_openai_client()
    response = client.responses.parse(
        model="gpt-5",
        input=[
            {
                "role": "system",
                "content": (
                    "Tu conçois des quiz d'entraînement de haute qualité. Pour chaque question,"
                    " propose exactement trois options distinctes, indique l'indice (0-2) de la"
                    " bonne réponse, et ajoute une explication claire rappelant le concept."
                    " Réponds strictement dans un JSON {'questions': [{'question': str,"
                    " 'options': [str, str, str], 'correctAnswerIndex': int, 'explanation': str}, ...]}."
                ),
            },
            {
                "role": "user",
                "content": (
                    "À partir du cours suivant, génère le maximum de questions de quiz"
                    " (QCM) à trois choix couvrant toutes les parties du contenu."
                    " Chaque question doit être précise et non ambiguë :\n\n"
                    f"{raw_text}"
                ),
            },
        ],
        text_format=QuizCollection,
    )
    data: QuizCollection = response.output_parsed
    return data.questions


def process_chapter(chapter_id: str) -> None:
    with session_scope() as session:
        chapter = session.get(ChapterModel, chapter_id)
        if not chapter:
            raise ValueError(f"Chapter {chapter_id} introuvable")
        chapter.status = ChapterStatus.processing
        chapter.is_processing = True
        chapter.processing_started_at = datetime.utcnow()
        session.add(chapter)

    try:
        downloaded_audio_path: str | None = None
        with session_scope() as session:
            chapter = session.get(ChapterModel, chapter_id)
            if not chapter:
                raise ValueError(f"Chapter {chapter_id} introuvable")

            text_source = chapter.input_text or ""
            if chapter.source_type == ChapterSource.audio:
                audio_path = chapter.audio_path
                if (not audio_path or not os.path.exists(audio_path)) and chapter.audio_remote_url:
                    audio_path = _download_remote_audio(chapter.id, chapter.audio_remote_url)
                    chapter.audio_path = audio_path
                    downloaded_audio_path = audio_path
                    session.add(chapter)

                if not audio_path or not os.path.exists(audio_path):
                    raise FileNotFoundError("Fichier audio introuvable pour la transcription")

                transcript = _transcribe_audio(audio_path)
                text_source = transcript
                chapter.input_text = transcript
                chapter.transcript_path = _save_transcript(chapter.id, transcript)

            if not text_source.strip():
                raise ValueError("Aucun contenu texte disponible pour le traitement")

            course_content = _generate_course_content(text_source)
            flashcards = _generate_flashcards(text_source)
            quiz_items = _generate_quiz(text_source)

            # Update chapter core data
            chapter.summary = course_content.summary
            chapter.bullet_points = course_content.bullet_points
            chapter.course_sections = [section.model_dump() for section in course_content.sections]
            chapter.duration_minutes = course_content.estimated_duration_minutes or _estimate_duration_from_text(text_source)
            chapter.is_processing = False
            chapter.is_completed = True
            chapter.status = ChapterStatus.completed
            chapter.completed_at = datetime.utcnow()
            chapter.failure_reason = None
            session.add(chapter)

            # Remove previous generated content if any
            session.query(FlashcardModel).filter(FlashcardModel.chapter_id == chapter.id).delete()
            session.query(QuizQuestionModel).filter(QuizQuestionModel.chapter_id == chapter.id).delete()

            flashcard_models = [
                FlashcardModel(
                    chapter_id=chapter.id,
                    question=item.question,
                    answer=item.answer,
                )
                for item in flashcards
            ]
            session.add_all(flashcard_models)
            chapter.flashcard_count = len(flashcard_models)
            chapter.flashcards_generated = bool(flashcard_models)

            quiz_models = [
                QuizQuestionModel(
                    chapter_id=chapter.id,
                    question=item.question,
                    options=item.options,
                    correct_answer=item.correct_answer_index,
                    explanation=item.explanation,
                )
                for item in quiz_items
            ]
            session.add_all(quiz_models)
            chapter.quiz_question_count = len(quiz_models)
            chapter.quiz_generated = bool(quiz_models)

    except Exception as exc:  # noqa: BLE001
        with session_scope() as session:
            chapter = session.get(ChapterModel, chapter_id)
            if chapter:
                chapter.status = ChapterStatus.failed
                chapter.is_processing = False
                chapter.failure_reason = str(exc)
                session.add(chapter)
        raise

    finally:
        if "downloaded_audio_path" in locals() and downloaded_audio_path:
            try:
                Path(downloaded_audio_path).unlink(missing_ok=True)
            except OSError:
                pass

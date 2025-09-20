from __future__ import annotations

from datetime import datetime
from typing import List

from backend.database import session_scope
from backend.models import ChapterModel, ChatMessageModel
from .openai_client import get_openai_client


MAX_HISTORY_MESSAGES = 12


def format_course_context(chapter: ChapterModel) -> str:
    parts: List[str] = []
    if chapter.summary:
        parts.append(f"Résumé détaillé :\n{chapter.summary}")
    if chapter.bullet_points:
        parts.append("Points clés :\n- " + "\n- ".join(chapter.bullet_points))
    if chapter.course_sections:
        section_lines = []
        for section in chapter.course_sections:
            heading = section.get("heading")
            overview = section.get("overview")
            detailed = section.get("detailed_content")
            key_points = section.get("key_points") or []
            section_lines.append(
                "\n".join([
                    f"Section : {heading}",
                    f"Présentation : {overview}",
                    "Points essentiels :\n- " + "\n- ".join(key_points) if key_points else "",
                    f"Développement complet :\n{detailed}" if detailed else "",
                ])
            )
        parts.append("Sections :\n" + "\n\n".join(filter(None, section_lines)))
    if chapter.input_text:
        parts.append(f"Transcription intégrale :\n{chapter.input_text}")
    return "\n\n".join(filter(None, parts))


def get_chat_history(chapter_id: str) -> List[ChatMessageModel]:
    with session_scope() as session:
        return (
            session.query(ChatMessageModel)
            .filter(ChatMessageModel.chapter_id == chapter_id)
            .order_by(ChatMessageModel.created_at.asc())
            .all()
        )


def append_message(chapter_id: str, role: str, content: str) -> ChatMessageModel:
    with session_scope() as session:
        message = ChatMessageModel(
            chapter_id=chapter_id,
            role=role,
            content=content,
            created_at=datetime.utcnow(),
        )
        session.add(message)
        session.flush()
        session.refresh(message)
        return message


def generate_chat_response(chapter_id: str, user_message: str) -> ChatMessageModel:
    history = get_chat_history(chapter_id)
    user_entry = append_message(chapter_id, "user", user_message)

    with session_scope() as session:
        chapter = session.get(ChapterModel, chapter_id)
        if not chapter:
            raise ValueError("Chapitre introuvable pour le chat")
        context = format_course_context(chapter)

    client = get_openai_client()

    conversation = [
        {
            "role": "system",
            "content": (
                "Tu es un assistant pédagogique spécialisé dans l'aide personnalisée." \
                " Tu réponds en français et tu utilises exclusivement les informations du cours." \
                " Si une question sort du périmètre, indique poliment que tu ne peux pas y répondre." \
                " Structure tes réponses pour favoriser la compréhension de l'étudiant."
            ),
        },
        {
            "role": "system",
            "content": f"Contexte du cours :\n{context}",
        },
    ]

    trimmed_history = history[-MAX_HISTORY_MESSAGES:]
    for message in trimmed_history:
        conversation.append({"role": message.role, "content": message.content})
    conversation.append({"role": "user", "content": user_message})

    response = client.responses.create(
        model="gpt-5",
        input=conversation,
    )
    assistant_text = response.output_text.strip()
    assistant_entry = append_message(chapter_id, "assistant", assistant_text)
    return assistant_entry

from __future__ import annotations

from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select

from backend.database import get_session
from backend.models import ChapterModel, ChatMessageModel
from backend.schemas import ChatMessageCreate, ChatMessageRead, ChatResponse
from backend.services.chat_service import generate_chat_response

router = APIRouter(prefix="/chat", tags=["chat"])


def _validate_chapter(session: Session, chapter_id: str) -> ChapterModel:
    chapter = session.get(ChapterModel, chapter_id)
    if not chapter:
        raise HTTPException(status_code=404, detail="Chapitre introuvable")
    return chapter


@router.get("/{chapter_id}", response_model=List[ChatMessageRead])
def get_chat_history(chapter_id: str, session: Session = Depends(get_session)) -> List[ChatMessageRead]:
    _validate_chapter(session, chapter_id)
    messages = session.exec(
        select(ChatMessageModel)
        .where(ChatMessageModel.chapter_id == chapter_id)
        .order_by(ChatMessageModel.created_at.asc())
    ).all()
    return [
        ChatMessageRead(
            id=message.id,
            role=message.role,
            content=message.content,
            created_at=message.created_at,
        )
        for message in messages
    ]


@router.post("/{chapter_id}", response_model=ChatResponse)
def send_message(
    chapter_id: str,
    payload: ChatMessageCreate,
    session: Session = Depends(get_session),
) -> ChatResponse:
    _validate_chapter(session, chapter_id)
    assistant_message = generate_chat_response(chapter_id, payload.content)

    messages = session.exec(
        select(ChatMessageModel)
        .where(ChatMessageModel.chapter_id == chapter_id)
        .order_by(ChatMessageModel.created_at.asc())
    ).all()
    response_messages = [
        ChatMessageRead(
            id=message.id,
            role=message.role,
            content=message.content,
            created_at=message.created_at,
        )
        for message in messages
    ]
    assistant_schema = ChatMessageRead(
        id=assistant_message.id,
        role=assistant_message.role,
        content=assistant_message.content,
        created_at=assistant_message.created_at,
    )
    return ChatResponse(messages=response_messages, assistant_message=assistant_schema)

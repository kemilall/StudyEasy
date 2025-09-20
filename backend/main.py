from __future__ import annotations

import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.database import init_db

from .api import chapters, chat, lessons, subjects


def create_app() -> FastAPI:
    app = FastAPI(title="StudyEasy Backend", version="0.1.0")

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(subjects.router)
    app.include_router(lessons.router)
    app.include_router(chapters.router)
    app.include_router(chat.router)

    @app.on_event("startup")
    def _startup() -> None:
        init_db()

    @app.get("/health")
    def healthcheck() -> dict[str, str]:
        return {"status": "ok"}

    return app


app = create_app()


if __name__ == "__main__":
    import uvicorn

    port = int(os.getenv("PORT", "8000"))
    reload = os.getenv("UVICORN_RELOAD", "false").lower() == "true"
    uvicorn.run("backend.main:app", host="0.0.0.0", port=port, reload=reload)

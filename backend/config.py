import os
from pathlib import Path
from enum import Enum

BASE_DIR = Path(__file__).resolve().parent

DATABASE_URL = os.getenv("STUDYEASY_DATABASE_URL", f"sqlite:///{BASE_DIR / 'study_easy.db'}")

AUDIO_STORAGE_DIR = os.getenv("STUDYEASY_AUDIO_DIR", str(BASE_DIR / 'storage' / 'audio'))
TRANSCRIPT_STORAGE_DIR = os.getenv("STUDYEASY_TRANSCRIPT_DIR", str(BASE_DIR / 'storage' / 'transcripts'))

Path(AUDIO_STORAGE_DIR).mkdir(parents=True, exist_ok=True)
Path(TRANSCRIPT_STORAGE_DIR).mkdir(parents=True, exist_ok=True)

class ChapterStatus(str, Enum):
    pending = "pending"
    processing = "processing"
    completed = "completed"
    failed = "failed"

class ChapterSource(str, Enum):
    text = "text"
    audio = "audio"

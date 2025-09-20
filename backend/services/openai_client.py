from __future__ import annotations

import threading
from functools import lru_cache

from openai import OpenAI

_client_lock = threading.Lock()
_client_instance: OpenAI | None = None


def get_openai_client() -> OpenAI:
    global _client_instance
    if _client_instance is None:
        with _client_lock:
            if _client_instance is None:
                _client_instance = OpenAI()
    return _client_instance


@lru_cache(maxsize=None)
def get_model_name(default: str) -> str:
    """Allow overriding model through environment variable."""
    return default

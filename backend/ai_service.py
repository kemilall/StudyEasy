import os
import json
import logging
from typing import List, Dict, Optional, Any
from openai import OpenAI
from models import (
    Flashcard,
    QuizQuestion,
    StructuredCourse,
    ProcessedChapter
)
import asyncio
from concurrent.futures import ThreadPoolExecutor
import httpx
from pydub import AudioSegment
import tempfile

logger = logging.getLogger(__name__)

class AIService:
    def __init__(self):
        api_key = os.getenv("OPENAI_API_KEY")
        # Make OpenAI optional so STT-only setups can run without it
        self.client = OpenAI(api_key=api_key) if api_key else None
        self.executor = ThreadPoolExecutor(max_workers=4)
        # ElevenLabs config (lazy check in method to avoid startup failures)
        self.eleven_api_key: Optional[str] = os.getenv("ELEVENLABS_API_KEY")
        self.eleven_model_id: str = os.getenv("ELEVENLABS_STT_MODEL_ID", "scribe_v1")
    
    async def transcribe_audio(self, audio_path: str) -> str:
        """Transcribe audio file using ElevenLabs Speech-to-Text (language auto-detect)."""
        try:
            if not self.eleven_api_key:
                raise ValueError("ELEVENLABS_API_KEY not found in environment variables")

            logger.info(f"Transcribing audio file with ElevenLabs: {audio_path}")

            # Log file details
            file_size = os.path.getsize(audio_path)
            logger.info(f"Audio file size: {file_size} bytes")

            # Note: Files are now recorded as WAV directly, no conversion needed
            file_ext = os.path.splitext(audio_path)[1].lower()
            logger.info(f"Processing {file_ext.upper()} audio file - no conversion needed")

            def _transcribe() -> str:
                url = "https://api.elevenlabs.io/v1/speech-to-text"
                headers = {
                    "xi-api-key": self.eleven_api_key,
                }
                # Determine content type based on file extension
                filename = os.path.basename(audio_path)
                file_ext = os.path.splitext(filename)[1].lower()

                # Map file extensions to proper MIME types
                content_type_map = {
                    '.mp3': 'audio/mpeg',
                    '.wav': 'audio/wav',
                    '.flac': 'audio/flac',
                    '.m4a': 'audio/m4a',
                    '.aac': 'audio/aac',
                    '.ogg': 'audio/ogg',
                    '.webm': 'audio/webm'
                }

                content_type = content_type_map.get(file_ext, 'audio/wav')

                # Omit language_code to keep it null (auto-detect)
                # Note: model_id might not be required for current ElevenLabs API
                data = {}
                # Only include model_id if it's specified and not empty
                if self.eleven_model_id and self.eleven_model_id.strip():
                    data["model_id"] = self.eleven_model_id

                with open(audio_path, "rb") as f:
                    file_content = f.read()
                    logger.info(f"Read {len(file_content)} bytes from file")
                    files = {"file": (filename, file_content, content_type)}
                    logger.info(f"Sending request to ElevenLabs with content_type: {content_type}")
                    logger.info(f"Request data: {data}")

                    response = httpx.post(
                        url,
                        headers=headers,
                        data=data,
                        files=files,
                        timeout=120
                    )

                logger.info(f"ElevenLabs response status: {response.status_code}")
                logger.info(f"ElevenLabs response headers: {dict(response.headers)}")

                if response.status_code != 200:
                    logger.error(f"ElevenLabs error response: {response.text}")
                    logger.error(f"ElevenLabs error status: {response.status_code}")
                    # Try to get more detailed error info
                    try:
                        error_data = response.json()
                        logger.error(f"ElevenLabs error details: {error_data}")
                    except:
                        logger.error("Could not parse ElevenLabs error response as JSON")

                response.raise_for_status()
                payload = response.json()
                # Prefer text field; fallback to joining words if needed
                text = payload.get("text")
                if text is None and isinstance(payload.get("words"), list):
                    text = " ".join([w.get("text", "") for w in payload["words"]]).strip()
                if not text:
                    # As a last resort, return the JSON as string
                    text = json.dumps(payload)
                return text

            loop = asyncio.get_event_loop()
            result_text = await loop.run_in_executor(self.executor, _transcribe)

            logger.info("Transcription completed successfully (ElevenLabs)")
            return result_text

        except Exception as e:
            logger.error(f"Transcription error (ElevenLabs): {str(e)}")
            raise
    
    async def process_chapter(
        self, 
        text: str, 
        chapter_name: str,
        lesson_name: str,
        subject_name: str
    ) -> ProcessedChapter:
        """Process chapter text to generate all components in parallel"""
        try:
            # Run all AI generations in parallel
            tasks = [
                self.generate_structured_course(text, chapter_name, lesson_name, subject_name),
                self.generate_flashcards(text),
                self.generate_quiz(text),
                self._extract_key_points(text),
                self._generate_summary(text)
            ]
            
            results = await asyncio.gather(*tasks)
            
            return ProcessedChapter(
                transcription=text,
                course=results[0],
                flashcards=results[1],
                quiz=results[2],
                key_points=results[3],
                summary=results[4]
            )
            
        except Exception as e:
            logger.error(f"Chapter processing error: {str(e)}")
            raise
    
    async def generate_structured_course(
        self,
        text: str,
        chapter_name: str,
        lesson_name: str,
        subject_name: str
    ) -> StructuredCourse:
        """Generate a structured course from input text using GPT-5"""
        try:
            if self.client is None:
                raise ValueError("OPENAI_API_KEY not set; content generation requires OpenAI.")
            logger.info("Generating structured course")

            def _generate():
                response = self.client.responses.create(
                    model="gpt-4.1",
                    input=[
                        {
                            "role": "developer",
                            "content": """You are an expert educational content creator designed to output JSON. Transform the provided text into a comprehensive, well-structured course.

IMPORTANT:
- Preserve ALL essential information from the source material
- Organize content logically with clear sections
- Ensure nothing important is lost
- Make the content easy to understand and learn
- Use clear headings and structure

Return a JSON object with this exact structure:
{
  "title": "string",
  "introduction": "string",
  "sections": [{"heading": "string", "content": "string"}],
  "key_points": ["string"],
  "summary": "string"
}"""
                        },
                        {
                            "role": "user",
                            "content": f"""Create a structured course from this content:

Subject: {subject_name}
Lesson: {lesson_name}
Chapter: {chapter_name}

Content:
{text}

Transform this into a comprehensive, organized course that preserves all essential information."""
                        }
                    ],
                    text={"format": {"type": "json_object"}}
                )

                import json
                result_data = json.loads(response.output_text)
                return StructuredCourse(**result_data)

            loop = asyncio.get_event_loop()
            result = await loop.run_in_executor(self.executor, _generate)

            logger.info("Course generation completed")
            return result

        except Exception as e:
            logger.error(f"Course generation error: {str(e)}")
            raise
    
    async def generate_flashcards(self, text: str, max_cards: int = 20) -> List[Flashcard]:
        """Generate flashcards from text using GPT-5"""
        try:
            if self.client is None:
                raise ValueError("OPENAI_API_KEY not set; flashcard generation requires OpenAI.")
            logger.info(f"Generating up to {max_cards} flashcards")

            def _generate():
                response = self.client.responses.create(
                    model="gpt-5",
                    input=[
                        {
                            "role": "developer",
                            "content": """You are an expert at creating educational flashcards designed to output JSON.
Extract ALL key terms, concepts, and definitions from the text.
Create comprehensive flashcards that cover the entire content.
Each flashcard should help students memorize important information.

Return a JSON array of flashcards with this exact structure:
[
  {
    "term": "string",
    "definition": "string",
    "example": "string (optional)"
  }
]"""
                        },
                        {
                            "role": "user",
                            "content": f"""Create flashcards from this text. Include ALL important terms and concepts:

{text}

Generate at least {max_cards} flashcards covering all key concepts."""
                        }
                    ],
                    text={"format": {"type": "json_object"}}
                )

                import json
                flashcards_data = json.loads(response.output_text)
                if isinstance(flashcards_data, dict):
                    # If it's a dict, try to find the flashcards in it
                    if 'flashcards' in flashcards_data:
                        flashcards_data = flashcards_data['flashcards']
                    else:
                        # Convert dict to list if it's a single flashcard
                        flashcards_data = [flashcards_data]
                if not isinstance(flashcards_data, list):
                    raise ValueError(f"Expected list or dict with flashcards, got {type(flashcards_data)}")
                result = [Flashcard(**card) for card in flashcards_data]
                return result[:max_cards] if len(result) > max_cards else result

            loop = asyncio.get_event_loop()
            result = await loop.run_in_executor(self.executor, _generate)

            logger.info(f"Generated {len(result)} flashcards")
            return result

        except Exception as e:
            logger.error(f"Flashcard generation error: {str(e)}")
            raise
    
    async def generate_quiz(self, text: str, num_questions: int = 10) -> List[QuizQuestion]:
        """Generate quiz questions from text using GPT-5"""
        try:
            if self.client is None:
                raise ValueError("OPENAI_API_KEY not set; quiz generation requires OpenAI.")
            logger.info(f"Generating {num_questions} quiz questions")

            def _generate():
                response = self.client.responses.create(
                    model="gpt-5",
                    input=[
                        {
                            "role": "developer",
                            "content": """You are an expert quiz creator designed to output JSON.
Create challenging but fair multiple-choice questions that test understanding of the material.
Each question should have exactly 3 options with one correct answer.
Provide clear explanations for the correct answer.

Return a JSON array of quiz questions with this exact structure:
[
  {
    "question": "string",
    "options": ["option1", "option2", "option3"],
    "correct_answer": 0,
    "explanation": "string"
  }
]"""
                        },
                        {
                            "role": "user",
                            "content": f"""Create {num_questions} quiz questions from this text:

{text}

Ensure questions cover different aspects of the content and test real understanding."""
                        }
                    ],
                    text={"format": {"type": "json_object"}}
                )

                import json
                questions_data = json.loads(response.output_text)
                if isinstance(questions_data, dict):
                    # If it's a dict, try to find the questions in it
                    if 'questions' in questions_data:
                        questions_data = questions_data['questions']
                    elif 'quiz' in questions_data:
                        questions_data = questions_data['quiz']
                    else:
                        # Convert dict to list if it's a single question
                        questions_data = [questions_data]
                if not isinstance(questions_data, list):
                    raise ValueError(f"Expected list or dict with questions, got {type(questions_data)}")
                result = [QuizQuestion(**question) for question in questions_data]
                return result[:num_questions] if len(result) > num_questions else result

            loop = asyncio.get_event_loop()
            result = await loop.run_in_executor(self.executor, _generate)

            logger.info(f"Generated {len(result)} quiz questions")
            return result

        except Exception as e:
            logger.error(f"Quiz generation error: {str(e)}")
            raise
    
    async def chat_with_context(
        self,
        message: str,
        context: str,
        chat_history: Optional[List[Dict[str, str]]] = None
    ) -> str:
        """Chat with AI about the course content"""
        try:
            if self.client is None:
                raise ValueError("OPENAI_API_KEY not set; chat requires OpenAI.")
            logger.info("Processing chat message")

            def _chat():
                input_messages = [
                    {
                        "role": "developer",
                        "content": f"""You are an AI tutor helping a student understand their course material.

Course Content:
{context}

Be helpful, encouraging, and provide clear explanations.
Answer questions based on the course content provided.
If asked about something not in the course, politely redirect to the course material."""
                    }
                ]

                # Add chat history
                if chat_history:
                    for msg in chat_history[-10:]:  # Keep last 10 messages for context
                        input_messages.append({
                            "role": msg.get("role", "user"),
                            "content": msg.get("content", "")
                        })

                # Add current message
                input_messages.append({
                    "role": "user",
                    "content": message
                })

                response = self.client.responses.create(
                    model="gpt-5",
                    input=input_messages
                )

                return response.output_text

            loop = asyncio.get_event_loop()
            result = await loop.run_in_executor(self.executor, _chat)

            logger.info("Chat response generated")
            return result

        except Exception as e:
            logger.error(f"Chat error: {str(e)}")
            raise
    
    async def _extract_key_points(self, text: str) -> List[str]:
        """Extract key points from text"""
        try:
            if self.client is None:
                raise ValueError("OPENAI_API_KEY not set; key point extraction requires OpenAI.")
            def _extract():
                response = self.client.responses.create(
                    model="gpt-5",
                    input=[
                        {
                            "role": "developer",
                            "content": "Extract 5-10 key points from the text designed to output JSON. Each point should be concise and capture essential information. Return a JSON array of strings."
                        },
                        {
                            "role": "user",
                            "content": text
                        }
                    ],
                    text={"format": {"type": "json_object"}}
                )

                import json
                key_points_data = json.loads(response.output_text)
                if isinstance(key_points_data, dict):
                    # If it's a dict, try to find the key_points in it
                    if 'key_points' in key_points_data:
                        return key_points_data['key_points']
                    elif 'points' in key_points_data:
                        return key_points_data['points']
                    else:
                        # If it's a dict with other keys, try to extract values
                        return list(key_points_data.values())
                return key_points_data

            loop = asyncio.get_event_loop()
            return await loop.run_in_executor(self.executor, _extract)

        except Exception as e:
            logger.error(f"Key points extraction error: {str(e)}")
            raise
    
    async def _generate_summary(self, text: str) -> str:
        """Generate a comprehensive summary"""
        try:
            if self.client is None:
                raise ValueError("OPENAI_API_KEY not set; summarization requires OpenAI.")
            def _summarize():
                response = self.client.responses.create(
                    model="gpt-5",
                    input=[
                        {
                            "role": "developer",
                            "content": "Create a comprehensive summary that captures all important information from the text."
                        },
                        {
                            "role": "user",
                            "content": text
                        }
                    ]
                )

                return response.output_text

            loop = asyncio.get_event_loop()
            return await loop.run_in_executor(self.executor, _summarize)

        except Exception as e:
            logger.error(f"Summary generation error: {str(e)}")
            raise

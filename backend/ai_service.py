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
        """Process lesson text to generate all components in parallel"""
        try:
            logger.info("=== STARTING PARALLEL PROCESSING ===")
            logger.info(f"Processing lesson: {lesson_name}, subject: {subject_name}")
            logger.info(f"Text length: {len(text)} characters")

            # Run all AI generations in parallel
            logger.info("Creating parallel tasks for: course, flashcards, quiz")
            start_time = asyncio.get_event_loop().time()

            tasks = [
                self.generate_structured_course(text, chapter_name, lesson_name, subject_name),
                self.generate_flashcards(text),
                self.generate_quiz(text)
            ]

            logger.info("Starting parallel execution with asyncio.gather...")
            results = await asyncio.gather(*tasks)

            end_time = asyncio.get_event_loop().time()
            total_time = end_time - start_time
            logger.info(f"=== PARALLEL PROCESSING COMPLETED ===")
            logger.info(f"Total execution time: {total_time:.2f} seconds")
            logger.info(f"Results: course={type(results[0])}, flashcards={len(results[1])}, quiz={len(results[2])}")

            return ProcessedChapter(
                transcription=text,
                course=results[0],
                flashcards=results[1],
                quiz=results[2]
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
        """Generate a comprehensive structured course from input text using GPT-5"""
        try:
            if self.client is None:
                raise ValueError("OPENAI_API_KEY not set; content generation requires OpenAI.")
            logger.info(f"[PARALLEL] Starting comprehensive structured course generation for lesson '{lesson_name}'")

            def _generate():
                response = self.client.responses.create(
                    model="gpt-5",
                    input=[
                        {
                            "role": "developer",
                            "content": """Tu dois uniquement répondre au format JSON décrit ci-dessous, sans ajouter ni modifier la structure.
Tu ne dois pas inventer de nouveaux champs ou formats.

Le JSON doit contenir : titre_cours, description, introduction, plan, sections, conclusion, et references.

Les champs sections et sous-sections contiennent une liste d'éléments dans le champ contenu.

Chaque élément de contenu doit avoir un champ "type" parmi :
"texte", "formule", "mindmap", "definition", "exemple", "sous-section".

Les formules mathématiques doivent être écrites en LaTeX entre $$ ... $$.

Les schémas mentaux doivent être en Mermaid (dans un bloc triple backticks avec le mot mermaid).

Le texte peut contenir du gras (**texte**), des italiques (*texte*), des listes à puces (-) ou numérotées (1.).

RETOURS À LA LIGNE : Utilise \n pour créer des retours à la ligne dans le texte. Exemple :
"Première ligne\n\nDeuxième ligne après un saut\n- Liste à puces\n- Deuxième élément"

Tu peux imbriquer librement texte, exemples, formules et définitions dans une section.

Les références doivent être une liste d'objets contenant au minimum un titre et un lien ou un auteur.

{
  "titre_cours": "Titre du cours",
  "description": "Brève présentation du cours (quel est le thème, le public visé, les objectifs, etc.)",
  "introduction": {
    "texte": "Texte d'introduction libre pouvant contenir du **gras**, des listes à puces, ou des listes numérotées."
  },
  "plan": [
    "Titre de la section 1",
    "Titre de la section 2",
    "Titre de la section 3"
  ],
  "sections": [
    {
      "titre": "Titre de la section",
      "contenu": [
        {
          "type": "texte",
          "valeur": "Texte libre pouvant contenir du **gras**, des listes à puces, des listes numérotées, etc."
        },
        {
          "type": "sous-section",
          "titre": "Titre de la sous-section",
          "contenu": [
            {
              "type": "texte",
              "valeur": "Texte descriptif ou explicatif."
            },
            {
              "type": "formule",
              "valeur": "$$E = mc^2$$"
            },
            {
              "type": "exemple",
              "valeur": "Exemple concret ou mise en situation illustrant le concept."
            },
            {
              "type": "definition",
              "titre": "Fonction mathématique",
              "valeur": "Une fonction est une relation qui associe à chaque élément d'un ensemble de départ (domaine) une unique valeur d'un ensemble d'arrivée (codomaine).\n\n**Notation :** f: A → B\n**Propriété :** Pour tout x ∈ A, il existe un unique y ∈ B tel que f(x) = y"
            },
            {
              "type": "mindmap",
              "valeur": "```mermaid\nmindmap\n  root((Concept principal))\n    Sous-partie A\n    Sous-partie B\n```"
            }
          ]
        },
        {
          "type": "formule",
          "valeur": "$$\\int_a^b f(x)dx = F(b) - F(a)$$"
        },
        {
          "type": "exemple",
          "valeur": "Exemple illustrant la formule précédente."
        }
      ]
    }
  ],
  "conclusion": {
    "texte": "Texte de conclusion récapitulant les idées principales et ouvrant sur d'autres perspectives."
  },
  "references": [
    {
      "type": "livre",
      "titre": "Nom du livre",
      "auteur": "Auteur",
      "annee": 2021,
      "editeur": "Maison d'édition"
    },
    {
      "type": "article",
      "titre": "Titre de l'article",
      "lien": "https://exemple.com"
    }
  ]
}"""
                        },
                        {
                            "role": "user",
                            "content": f"""Transforme ce contenu en cours structuré en respectant EXACTEMENT le format JSON spécifié:

Matière: {subject_name}
Leçon: {lesson_name}
Chapitre: {chapter_name}

Contenu brut:
{text}

INSTRUCTIONS CRITIQUES:
1. FILTRAGE DU CONTENU:
   - IGNORE complètement les salutations ("bonjour", "bonsoir", etc.)
   - IGNORE les références temporelles ("aujourd'hui", "hier", "demain", "cette semaine", etc.)
   - IGNORE les références personnelles ("je", "nous", "mon professeur", "changement de prof", etc.)
   - IGNORE les références au planning ou à l'organisation du cours
   - IGNORE les éléments de contexte scolaire (absences, changements d'horaire, etc.)
   - FOCUS uniquement sur le CONTENU ACADÉMIQUE pur

2. CONTENU À CONSERVER:
   - Concepts théoriques et définitions
   - Formules et équations
   - Exemples concrets et applications
   - Méthodes et procédures
   - Données factuelles et scientifiques

3. GÉNÉRATION:
   - Génère un cours complet et détaillé
   - Organise le contenu de manière logique et intemporelle
   - Utilise tous les types de contenu appropriés (texte, formule, exemple, definition, mindmap, sous-section)
   - Les formules mathématiques doivent être en LaTeX entre $$...$$
   - Les mindmaps doivent être en format Mermaid
   - Écris dans un style académique neutre et intemporel

4. FORMAT SPÉCIFIQUE DES DÉFINITIONS:
   - Toujours inclure un "titre" clair pour la définition
   - Structure la "valeur" avec : définition principale + détails/propriétés
   - Utilise des retours à la ligne (\n) pour séparer les parties
   - Utilise le gras (**texte**) pour les mots-clés importants
   - Exemple de structure :
     "titre": "Nom du concept"
     "valeur": "Définition principale.\n\n**Propriétés :**\n- Propriété 1\n- Propriété 2\n\n**Notation :** symboles mathématiques"

5. RETOURS À LA LIGNE:
   - Utilise \n pour les retours à la ligne simples
   - Utilise \n\n pour créer des paragraphes séparés
   - Dans les listes, chaque élément sur une nouvelle ligne avec \n"""
                        }
                    ],
                    text={
                        "format": {
                            "type": "json_object"
                        },
                        "verbosity": "high"
                    },
                    reasoning={
                        "effort": "minimal"
                    },
                    tools=[],
                    store=True
                )

                import json
                result_data = json.loads(response.output_text)
                return StructuredCourse(**result_data)

            loop = asyncio.get_event_loop()
            result = await loop.run_in_executor(self.executor, _generate)

            logger.info(f"[PARALLEL] Comprehensive course generation completed for lesson '{lesson_name}'")
            return result

        except Exception as e:
            logger.error(f"Course generation error: {str(e)}")
            raise
    
    async def generate_flashcards(self, text: str, max_cards: int = 20) -> List[Flashcard]:
        """Generate flashcards from text using GPT-4.1"""
        try:
            if self.client is None:
                raise ValueError("OPENAI_API_KEY not set; flashcard generation requires OpenAI.")
            logger.info(f"[PARALLEL] Starting flashcards generation (max {max_cards} cards)")

            def _generate():
                response = self.client.responses.create(
                    model="gpt-4.1",
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

            logger.info(f"[PARALLEL] Flashcards generation completed: {len(result)} cards")
            return result

        except Exception as e:
            logger.error(f"Flashcard generation error: {str(e)}")
            raise
    
    async def generate_quiz(self, text: str, num_questions: int = 10) -> List[QuizQuestion]:
        """Generate quiz questions from text using GPT-4.1"""
        try:
            if self.client is None:
                raise ValueError("OPENAI_API_KEY not set; quiz generation requires OpenAI.")
            logger.info(f"[PARALLEL] Starting quiz generation ({num_questions} questions)")

            def _generate():
                response = self.client.responses.create(
                    model="gpt-4.1",
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

            logger.info(f"[PARALLEL] Quiz generation completed: {len(result)} questions")
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
                    model="gpt-4.1",
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
    
